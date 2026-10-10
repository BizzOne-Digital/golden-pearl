import { NextRequest, NextResponse } from "next/server";
import { checkAdminCredentials, createAdminSession } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const { email, password } = (await req.json()) as {
    email?: string;
    password?: string;
  };
  if (
    !email ||
    !password ||
    !checkAdminCredentials(email, password)
  ) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  await createAdminSession();
  return NextResponse.json({ ok: true });
}
