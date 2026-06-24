import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || "",
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
