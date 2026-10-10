import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public", "menu");
const itemsDir = join(publicDir, "items");
const categoriesDir = join(publicDir, "categories");

const body = {
  profile_id: "1398691",
  api_key: "bypass",
  location_id: "1398695",
  customize_data: false,
  language: "en",
  app_version: "3.0.0",
};

function pickRemoteImage(item, categoryUrl) {
  const candidates = [
    item.zoomed_image_url,
    item.image_url,
    ...(Array.isArray(item.multi_image)
      ? item.multi_image.map((m) => m?.image_url || m?.url)
      : []),
  ].filter(Boolean);

  for (const url of candidates) {
    if (!url.includes("no_image")) return url;
  }
  if (categoryUrl && !categoryUrl.includes("no_image")) return categoryUrl;
  return "";
}

async function downloadToLocal(remoteUrl, basePath) {
  if (!remoteUrl || remoteUrl.includes("no_image")) return "";
  try {
    const r = await fetch(remoteUrl);
    if (!r.ok) return "";
    const ct = r.headers.get("content-type") || "";
    let ext = ".jpg";
    if (ct.includes("png")) ext = ".png";
    else if (ct.includes("webp")) ext = ".webp";
    else if (ct.includes("gif")) ext = ".gif";

    const filePath = `${basePath}${ext}`;
    const buf = Buffer.from(await r.arrayBuffer());
    writeFileSync(filePath, buf);
    return filePath.replace(join(root, "public"), "").replace(/\\/g, "/");
  } catch {
    return "";
  }
}

function transform(raw) {
  const loc = raw?.response?.location?.[0];
  if (!loc) {
    console.error("No location in response");
    return { restaurant: "Golden Pearl Restaurant", categories: [] };
  }

  const categories = (loc.menu || []).map((cat) => {
    const categoryRemote = cat.image_url || "";
    return {
      id: String(cat.id),
      name: cat.title,
      image: categoryRemote,
      imageRemote: categoryRemote,
      items: (cat.menu_item || []).map((item) => {
        const remote = pickRemoteImage(item, categoryRemote);
        return {
          id: String(item.id),
          name: item.title,
          description: (item.description || "").replace(/<[^>]+>/g, "").trim(),
          price: Number(item.price) || 0,
          image: remote,
          imageRemote: remote,
        };
      }),
    };
  });

  return {
    restaurant: loc.title || "Golden Pearl Restaurant",
    address: `${loc.address || ""}, ${loc.city || ""}`.trim(),
    phone: loc.phone,
    categories: categories.filter((c) => c.items.length > 0),
  };
}

async function cacheImages(menu) {
  mkdirSync(itemsDir, { recursive: true });
  mkdirSync(categoriesDir, { recursive: true });

  let downloaded = 0;

  for (const cat of menu.categories) {
    if (cat.imageRemote) {
      const local = await downloadToLocal(
        cat.imageRemote,
        join(categoriesDir, cat.id)
      );
      if (local) {
        cat.image = local;
        downloaded++;
      }
    }

    for (const item of cat.items) {
      if (!item.imageRemote) continue;
      const local = await downloadToLocal(
        item.imageRemote,
        join(itemsDir, item.id)
      );
      if (local) {
        item.image = local;
        downloaded++;
      }
    }
  }

  for (const cat of menu.categories) {
    delete cat.imageRemote;
    for (const item of cat.items) {
      delete item.imageRemote;
    }
  }

  return downloaded;
}

const res = await fetch("https://app1.restolabs.com/api/profile", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: JSON.stringify(body),
});

const text = await res.text();
const json = JSON.parse(text.replace(/^\s+/, ""));
const outDir = join(root, "data");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "menu-raw.json"), JSON.stringify(json, null, 2), "utf8");

const menu = transform(json);
const downloaded = await cacheImages(menu);

writeFileSync(join(outDir, "menu.json"), JSON.stringify(menu, null, 2), "utf8");
const count = menu.categories.reduce((n, c) => n + c.items.length, 0);
const withLocal = menu.categories.reduce(
  (n, c) =>
    n + c.items.filter((i) => i.image && i.image.startsWith("/menu/")).length,
  0
);
console.log(
  `OK: ${menu.categories.length} categories, ${count} items, ${downloaded} images cached, ${withLocal} items with local photos`
);
