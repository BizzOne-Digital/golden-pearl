import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { generateOrderNumber } from "@/lib/format";
import { taxFromSubtotal, totalFromSubtotal } from "@/lib/pricing";
import { absoluteAssetUrl } from "@/lib/stripe-order";
import {
  STRIPE_SITE_ID,
  buildStripePaymentMetadata,
} from "@/lib/stripe-config";

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

  if (body.orderType === "delivery" && !body.address?.trim()) {
    return NextResponse.json(
      { error: "Delivery address is required" },
      { status: 400 }
    );
  }

  const subtotal = body.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const taxAmount = taxFromSubtotal(subtotal);
  const total = totalFromSubtotal(subtotal);

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
    taxAmount,
    total,
    status: "pending_payment",
  });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const origin =
    req.headers.get("origin") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  if (stripeKey) {
    const stripe = new Stripe(stripeKey);
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      body.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "cad",
          unit_amount: Math.round(item.price * 100),
          product_data: {
            name: item.name,
            images: absoluteAssetUrl(origin, item.image)
              ? [absoluteAssetUrl(origin, item.image)!]
              : undefined,
          },
        },
      }));

    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "cad",
        unit_amount: Math.round(taxAmount * 100),
        product_data: {
          name: "Tax (13%)",
        },
      },
    });

    const paymentMetadata = buildStripePaymentMetadata({
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      customerName: body.customerName,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: body.email,
      line_items: lineItems,
      metadata: paymentMetadata,
      payment_intent_data: {
        metadata: paymentMetadata,
        description: `Golden Pearl · ${order.orderNumber} · ${STRIPE_SITE_ID}`,
      },
      success_url: `${origin}/?paid=1&order=${encodeURIComponent(order.orderNumber)}&session_id={CHECKOUT_SESSION_ID}`,
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
