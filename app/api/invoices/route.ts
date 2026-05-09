import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const invoice = await prisma.invoice.create({
      data: {
        userId: (session.user as any).id,
        vendorName: body.vendor_name || null,
        invoiceNumber: body.invoice_number || null,
        invoiceDate: body.invoice_date || null,
        totalAmount: body.grand_total ? parseFloat(body.grand_total) : null,
        currency: body.currency || null,
        dataJson: JSON.stringify(body),
      },
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error("Error saving invoice:", error);
    return NextResponse.json({ error: "Failed to save invoice" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoices = await prisma.invoice.findMany({
      where: { userId: (session.user as any).id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Failed to fetch invoices", details: String(error) }, { status: 500 });
  }
}
