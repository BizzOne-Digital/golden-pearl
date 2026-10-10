import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOST = "app1.restolabs.com";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (parsed.hostname !== ALLOWED_HOST) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  const upstream = await fetch(raw, {
    headers: { Accept: "image/*" },
    next: { revalidate: 86400 },
  });

  if (!upstream.ok) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const bytes = await upstream.arrayBuffer();
  const contentType = upstream.headers.get("content-type") || "image/jpeg";

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
