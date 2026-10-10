import mongoose, { Schema, models, model } from "mongoose";

const ProductSchema = new Schema(
  {
    externalId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    image: { type: String, default: "" },
  },
  { _id: true }
);

const CategorySchema = new Schema(
  {
    externalId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    products: [ProductSchema],
  },
  { timestamps: true }
);

export type IProduct = {
  _id: mongoose.Types.ObjectId;
  externalId: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

export type ICategory = mongoose.InferSchemaType<typeof CategorySchema> & {
  _id: mongoose.Types.ObjectId;
  products: IProduct[];
};

export const Category =
  models.Category || model("Category", CategorySchema);
