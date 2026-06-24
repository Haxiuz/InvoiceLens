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
    
    // Check if the body is an array (Bulk Import)
    if (Array.isArray(body)) {
      if (body.length === 0) return NextResponse.json({ success: true, count: 0 });

      // Build data array for createMany
      const records = body.map(inv => ({
        userId: (session.user as any).id,
        vendorName: inv.vendor_name || null,
        invoiceNumber: inv.invoice_number || null,
        invoiceDate: inv.invoice_date || null,
        totalAmount: inv.grand_total ? parseFloat(inv.grand_total) : null,
        currency: inv.currency || null,
        dataJson: JSON.stringify(inv),
      }));

      const result = await prisma.invoice.createMany({
        data: records,
      });

      return NextResponse.json({ success: true, count: result.count });
    } else {
      // Single Import
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
    }
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
