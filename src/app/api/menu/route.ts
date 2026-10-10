import { NextResponse } from "next/server";
import { getMenu } from "@/lib/get-menu";

export async function GET() {
  const menu = await getMenu();
  if (!menu) {
    return NextResponse.json(
      { error: "Menu not available. Run npm run seed after setting MONGODB_URI." },
      { status: 503 }
    );
  }
  return NextResponse.json(menu);
}
