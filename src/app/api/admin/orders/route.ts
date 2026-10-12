import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { verifyAdminSession } from "@/lib/admin-auth";

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const orders = await Order.find().sort({ createdAt: -1 }).limit(100).lean();

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: String(o._id),
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      email: o.email,
      phone: o.phone,
      orderType: o.orderType,
      address: o.address,
      notes: o.notes,
      items: o.items,
      subtotal: o.subtotal,
      taxAmount: o.taxAmount ?? 0,
      total: o.total ?? o.subtotal,
      status: o.status,
      paidAt: o.paidAt,
      createdAt: o.createdAt,
    })),
  });
}
