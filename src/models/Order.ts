import mongoose, { Schema, models, model } from "mongoose";

const OrderItemSchema = new Schema(
  {
    productId: String,
    externalId: String,
    name: String,
    price: Number,
    quantity: Number,
    image: String,
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    orderType: {
      type: String,
      enum: ["pickup", "delivery"],
      default: "pickup",
    },
    address: { type: String, default: "" },
    notes: { type: String, default: "" },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending_payment", "paid", "cancelled"],
      default: "pending_payment",
    },
    stripeSessionId: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export type IOrder = mongoose.InferSchemaType<typeof OrderSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Order = models.Order || model("Order", OrderSchema);
