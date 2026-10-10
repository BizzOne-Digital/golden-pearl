const PLACEHOLDER = "/menu/placeholder.svg";

export function isPlaceholderImage(url?: string | null) {
  if (!url) return true;
  return url.includes("no_image");
}

/** Prefer local cached path from scrape; otherwise proxy Restolabs URLs. */
export function resolveMenuImage(
  image?: string | null,
  categoryImage?: string | null
): string {
  if (image && image.startsWith("/menu/")) return image;
  if (image && !isPlaceholderImage(image)) {
    return `/api/menu-image?url=${encodeURIComponent(image)}`;
  }
  if (categoryImage && categoryImage.startsWith("/menu/")) return categoryImage;
  if (categoryImage && !isPlaceholderImage(categoryImage)) {
    return `/api/menu-image?url=${encodeURIComponent(categoryImage)}`;
  }
  return PLACEHOLDER;
}
