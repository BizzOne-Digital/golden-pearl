import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { generateOrderNumber } from "@/lib/format";

type OrderBody = {
  customerName: string;
  email: string;
  phone: string;
  orderType: "pickup" | "delivery";
  address?: string;
  notes?: string;
  items: {
    productId?: string;
    externalId?: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }[];
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as OrderBody;

  if (!body.customerName || !body.email || !body.phone || !body.items?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const subtotal = body.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  await connectDB();

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    customerName: body.customerName,
    email: body.email,
    phone: body.phone,
    orderType: body.orderType || "pickup",
    address: body.address || "",
    notes: body.notes || "",
    items: body.items,
    subtotal,
    status: "pending_payment",
  });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (stripeKey) {
    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: body.email,
      line_items: body.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "cad",
          unit_amount: Math.round(item.price * 100),
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : undefined,
          },
        },
      })),
      metadata: {
        orderId: String(order._id),
        orderNumber: order.orderNumber,
      },
      success_url: `${origin}/?paid=1&order=${order.orderNumber}`,
      cancel_url: `${origin}/?cancelled=1`,
    });

    order.stripeSessionId = session.id;
    await order.save();

    return NextResponse.json({
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      checkoutUrl: session.url,
    });
  }

  return NextResponse.json({
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    demoPayment: true,
  });
}
