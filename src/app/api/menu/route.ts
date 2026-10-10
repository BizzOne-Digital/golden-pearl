import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Category } from "@/models/Menu";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find().sort({ sortOrder: 1 }).lean();
    if (categories.length > 0) {
      return NextResponse.json({
        restaurant: "Golden Pearl Restaurant",
        categories: categories.map((c) => ({
          id: c.externalId,
          _id: String(c._id),
          name: c.name,
          image: c.image,
          items: (c.products || []).map((p: {
            externalId: string;
            _id?: { toString(): string };
            name: string;
            description?: string;
            price: number;
            image?: string;
          }) => ({
            id: p.externalId,
            _id: String(p._id),
            name: p.name,
            description: p.description,
            price: p.price,
            image: p.image,
          })),
        })),
      });
    }
  } catch {
    /* fall back to static menu file */
  }

  try {
    const raw = readFileSync(join(process.cwd(), "data", "menu.json"), "utf8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json(
      { error: "Menu not available. Run npm run seed after setting MONGODB_URI." },
      { status: 503 }
    );
  }
}
