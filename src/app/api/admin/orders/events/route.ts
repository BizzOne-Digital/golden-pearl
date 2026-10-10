import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { verifyAdminSession } from "@/lib/admin-auth";

export async function GET(req: Request) {
  if (!(await verifyAdminSession())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sinceParam = req.url.includes("since=")
    ? new URL(req.url).searchParams.get("since")
    : null;
  const since = sinceParam ? new Date(sinceParam) : new Date();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "connected", since: since.toISOString() });

      const poll = async () => {
        try {
          await connectDB();
          const orders = await Order.find({
            status: "paid",
            paidAt: { $gt: since },
          })
            .sort({ paidAt: 1 })
            .lean();

          for (const order of orders) {
            if (order.paidAt && order.paidAt > since) {
              since.setTime(order.paidAt.getTime());
              send({
                type: "paid_order",
                order: {
                  id: String(order._id),
                  orderNumber: order.orderNumber,
                  customerName: order.customerName,
                  subtotal: order.subtotal,
                  paidAt: order.paidAt,
                },
              });
            }
          }
        } catch {
          send({ type: "error", message: "poll failed" });
        }
      };

      const interval = setInterval(poll, 3000);
      poll();

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
