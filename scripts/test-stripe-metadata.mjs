/**
 * Verifies Stripe Checkout session + PaymentIntent metadata (no payment completed).
 * Run: node scripts/test-stripe-metadata.mjs
 */
import Stripe from "stripe";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal() {
  const path = join(root, ".env.local");
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

function buildStripePaymentMetadata(input) {
  const site = process.env.STRIPE_SITE_ID?.trim() || "goldenpearl";
  return {
    site,
    source: "goldenpearl-online-order",
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    customerName: input.customerName,
  };
}

loadEnvLocal();

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret) {
  console.error("FAIL: STRIPE_SECRET_KEY missing in .env.local");
  process.exit(1);
}

const siteId = process.env.STRIPE_SITE_ID?.trim() || "goldenpearl";
const meta = buildStripePaymentMetadata({
  orderId: "test-order-id",
  orderNumber: "GP-METADATA-TEST",
  customerName: "Metadata Test",
});

const stripe = new Stripe(secret);

const session = await stripe.checkout.sessions.create({
  mode: "payment",
  customer_email: "metadata-test@example.com",
  line_items: [
    {
      quantity: 1,
      price_data: {
        currency: "cad",
        unit_amount: 100,
        product_data: { name: "Metadata test (do not pay)" },
      },
    },
  ],
  metadata: meta,
  payment_intent_data: {
    metadata: meta,
    description: `Golden Pearl · ${meta.orderNumber} · ${siteId}`,
  },
  success_url: "https://example.com/success",
  cancel_url: "https://example.com/cancel",
});

const expanded = await stripe.checkout.sessions.retrieve(session.id, {
  expand: ["payment_intent"],
});
const pi = expanded.payment_intent;
const piMeta =
  pi && typeof pi !== "string" ? pi.metadata : null;

const checks = [
  ["session.metadata.site", expanded.metadata?.site, siteId],
  ["session.metadata.source", expanded.metadata?.source, "goldenpearl-online-order"],
  ["session.metadata.orderNumber", expanded.metadata?.orderNumber, meta.orderNumber],
];

if (piMeta) {
  checks.push(
    ["payment_intent.metadata.site", piMeta.site, siteId],
    ["payment_intent.metadata.source", piMeta.source, "goldenpearl-online-order"]
  );
}

let failed = false;
for (const [label, actual, expected] of checks) {
  const ok = actual === expected;
  console.log(`${ok ? "OK" : "FAIL"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failed = true;
}

await stripe.checkout.sessions.expire(session.id).catch(() => {});

console.log(`Session id: ${session.id} (expired — no payment needed)`);
if (!piMeta) {
  console.log(
    "Note: PaymentIntent metadata is set when the customer opens Checkout (payment_intent_data)."
  );
}

if (failed) {
  process.exit(1);
}
console.log("\nAll metadata checks passed.");
