import { readFileSync } from "fs";
import { join } from "path";
import { connectDB } from "@/lib/mongodb";
import { Category } from "@/models/Menu";
import type { MenuResponse } from "@/types/menu";

const MENU_JSON_PATH = join(process.cwd(), "data", "menu.json");

export function getMenuFromFile(): MenuResponse | null {
  try {
    const raw = readFileSync(MENU_JSON_PATH, "utf8");
    return JSON.parse(raw) as MenuResponse;
  } catch {
    return null;
  }
}

export async function getMenu(): Promise<MenuResponse | null> {
  try {
    await connectDB();
    const categories = await Category.find().sort({ sortOrder: 1 }).lean();
    if (categories.length > 0) {
      return {
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
            description: p.description ?? "",
            price: p.price,
            image: p.image ?? "",
          })),
        })),
      };
    }
  } catch {
    /* fall back to static menu file */
  }

  return getMenuFromFile();
}
