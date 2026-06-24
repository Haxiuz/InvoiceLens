import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Must be logged in
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key not configured on server." }, { status: 500 });
  }

  let body: { base64?: string; mimeType?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { base64, mimeType, text } = body;
  if (!base64 && !text) {
    return NextResponse.json({ error: "Missing base64/mimeType or text." }, { status: 400 });
  }

  const prompt = `You are an expert accounting AI. Analyze this invoice data and extract all structured information.

Return ONLY a valid JSON object — no markdown, no code fences, no explanation. Use this exact schema:
{
  "vendor_name": "string or null",
  "vendor_address": "string or null",
  "invoice_number": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD or null",
  "payment_terms": "string or null",
  "line_items": [
    { "description": "string", "quantity": number_or_null, "unit_price": number_or_null, "total": number_or_null }
  ],
  "subtotal": number_or_null,
  "tax_amount": number_or_null,
  "grand_total": number_or_null,
  "currency": "USD/EUR/IDR/etc or null",
  "anomalies": ["list any issues found, empty array if none"]
}

Rules:
- line_items must be an array (empty if none found)
- anomalies must be an array (empty if none found)
- All numeric values must be plain numbers, not strings
- If you cannot read something, use null`;

  // Build Gemini content parts based on input type
  const parts: object[] = [{ text: prompt }];
  if (text) {
    // Text-based file (xlsx, xml, docx extracted text)
    parts.push({ text: `\n\nInvoice data to analyze:\n${text}` });
  } else if (base64 && mimeType) {
    // Image or PDF
    parts.push({ inline_data: { mime_type: mimeType, data: base64 } });
  }

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
      }),
    }
  );

  if (!geminiRes.ok) {
    const err = await geminiRes.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } })?.error?.message || `Gemini API error ${geminiRes.status}`;
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const json = await geminiRes.json();
  const rawText: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const cleaned = rawText.replace(/```json|```/g, "").trim();

  try {
    const data = JSON.parse(cleaned);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to parse Gemini response.", raw: cleaned }, { status: 502 });
  }
}
