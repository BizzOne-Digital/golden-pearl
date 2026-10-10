import mongoose from "mongoose";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI missing in .env.local");
  process.exit(1);
}

const menu = JSON.parse(
  readFileSync(join(__dirname, "..", "data", "menu.json"), "utf8")
);

const ProductSchema = new mongoose.Schema(
  {
    externalId: String,
    name: String,
    description: String,
    price: Number,
    image: String,
  },
  { _id: true }
);

const CategorySchema = new mongoose.Schema(
  {
    externalId: { type: String, unique: true },
    name: String,
    image: String,
    sortOrder: Number,
    products: [ProductSchema],
  },
  { timestamps: true }
);

const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);

await mongoose.connect(uri);

let order = 0;
for (const cat of menu.categories) {
  await Category.findOneAndUpdate(
    { externalId: cat.id },
    {
      externalId: cat.id,
      name: cat.name,
      image: cat.image || "",
      sortOrder: order++,
      products: cat.items.map((item) => ({
        externalId: item.id,
        name: item.name,
        description: item.description || "",
        price: item.price,
        image: item.image || "",
      })),
    },
    { upsert: true, new: true }
  );
}

console.log(`Seeded ${menu.categories.length} categories`);
await mongoose.disconnect();
