import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { taxFromSubtotal, totalFromSubtotal } from "@/lib/pricing";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();

  const order = await Order.findById(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status === "paid") {
    return NextResponse.json({ ok: true, orderNumber: order.orderNumber });
  }

  if (order.taxAmount == null || order.taxAmount === 0) {
    order.taxAmount = taxFromSubtotal(order.subtotal);
  }
  if (order.total == null || order.total === 0) {
    order.total = totalFromSubtotal(order.subtotal);
  }
  order.status = "paid";
  order.paidAt = new Date();
  await order.save();

  return NextResponse.json({ ok: true, orderNumber: order.orderNumber });
}
