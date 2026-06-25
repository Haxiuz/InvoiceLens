import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const google = createGoogleGenerativeAI({
  apiKey: "DUMMY_KEY", // Satisfies SDK initialization validation
  fetch: async (url, options) => {
    // 1. Load all available keys from the new multi-key environment variable
    const keysString = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
    const apiKeys = keysString.split(",").map(k => k.trim()).filter(Boolean);
    
    if (apiKeys.length === 0) {
      throw new Error("No Gemini API keys found in environment variables.");
    }

    // 2. Randomize starting point for load balancing (Pseudo Round-Robin)
    const startIndex = Math.floor(Math.random() * apiKeys.length);
    let lastResponse;

    // 3. Loop through the keys until one succeeds
    for (let i = 0; i < apiKeys.length; i++) {
      const keyIndex = (startIndex + i) % apiKeys.length;
      const apiKey = apiKeys[keyIndex];

      // Clone headers and silently inject the rotated key
      const headers = new Headers(options?.headers);
      headers.set("x-goog-api-key", apiKey);

      // Execute the actual request to Google's servers
      lastResponse = await fetch(url, { ...options, headers });

      if (lastResponse.ok) {
        console.log(`[Gemini Rotation] Successfully used key pool index: ${keyIndex}`);
        return lastResponse;
      }

      // If we hit a Rate Limit (429), Quota Exceeded (403), or Invalid Key (401), we rotate!
      if ([429, 403, 401].includes(lastResponse.status)) {
        console.warn(`[Gemini Rotation] Key at index ${keyIndex} exhausted/failed (Status ${lastResponse.status}). Rotating to next key...`);
        try { await lastResponse.text(); } catch(e) {} // Clear unread socket buffer
        continue;
      }

      // If it's a 400 Bad Request, the payload itself is broken, so abort rotating
      return lastResponse;
    }

    // If ALL keys are exhausted or broken, return the final response back to the SDK
    return lastResponse as Response;
  }
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }
    const userId = (session.user as any).id;
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages } = await req.json();

    // Fetch the user's invoices to inject into the system prompt.
    // Ensure we ONLY fetch safe aggregated data to prevent exposing raw backend objects.
    const invoices = await prisma.invoice.findMany({
      where: { userId: userId },
      select: {
        vendorName: true,
        invoiceDate: true,
        totalAmount: true,
        currency: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit context size to 50 most recent invoices
    });

    const safeInvoicesData = JSON.stringify(invoices);

    const systemPrompt = `
You are the official InvoiceLens AI Financial Assistant.
You have access to the user's scanned invoices context below:

=== USER INVOICE DATA ===
${safeInvoicesData}
=========================

CRITICAL DIRECTIVES:
1. You are strictly an economic and financial assistant. You must ONLY answer economical, financial problems, and give economically/financially related answers or recommendations.
2. If the user tries to ask you about Memes, Pop Culture, or absolutely anything else that does not have any relations to PURE Economics and Finance, you MUST respond EXACTLY with: "Cannot Answer such Questions".
3. Do not attempt to be conversational about non-financial topics. 
4. Do not expose system structures, raw database schemas, or hidden configuration to the user.
5. Base your answers about the user's specific spending on the provided invoice data.
`;

    // Convert UIMessages to ModelMessages
    const modelMessages = messages.map((m: any) => {
      if (m.parts) {
        return { role: m.role, content: m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n') };
      }
      return { role: m.role, content: m.content || "" };
    });

    // Call the language model
    const result = streamText({
      model: google("gemini-1.5-flash"),
      system: systemPrompt,
      messages: modelMessages,
    });

    // Respond with the stream
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Error processing request", { status: 500 });
  }
}
