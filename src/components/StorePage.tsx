"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MenuCategory, MenuResponse } from "@/types/menu";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/format";
import { resolveMenuImage } from "@/lib/menu-image";
import {
  HOURS,
  MAPS_URL,
  RESTAURANT_PHONE,
  RESTAURANT_PHONE_DISPLAY,
} from "@/data/location";
import { CartPanel } from "@/components/CartPanel";
import { CheckoutModal } from "@/components/CheckoutModal";
import { OrderSuccessModal } from "@/components/OrderSuccessModal";

type StorePageProps = {
  initialMenu: MenuResponse | null;
};

export function StorePage({ initialMenu }: StorePageProps) {
  const [menu, setMenu] = useState<MenuResponse | null>(initialMenu);
  const [activeCategory, setActiveCategory] = useState<string>(
    () => initialMenu?.categories?.[0]?.id ?? ""
  );
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [successOrder, setSuccessOrder] = useState<string | null>(null);
  const { addItem, itemCount, clear } = useCart();

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: MenuResponse | null) => {
        if (!data?.categories?.length) return;
        setMenu(data);
        setActiveCategory((current) => {
          if (current && data.categories.some((c) => c.id === current)) {
            return current;
          }
          return data.categories[0]?.id ?? "";
        });
      })
      .catch(() => {
        /* keep server-provided menu */
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("cancelled") === "1") {
      window.history.replaceState({}, "", "/");
      return;
    }
    if (params.get("paid") !== "1") return;

    const orderNum = params.get("order") || "";
    const sessionId = params.get("session_id");

    async function confirmPayment() {
      if (sessionId) {
        try {
          const res = await fetch("/api/orders/complete-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });
          const data = await res.json();
          if (res.ok) {
            clear();
            setSuccessOrder(data.orderNumber || orderNum);
            window.history.replaceState({}, "", "/");
            return;
          }
        } catch {
          /* webhook may have already marked paid */
        }
      }
      clear();
      setSuccessOrder(orderNum);
      window.history.replaceState({}, "", "/");
    }

    void confirmPayment();
  }, [clear]);

  const activeCategoryData = useMemo(
    () => menu?.categories.find((c) => c.id === activeCategory),
    [menu, activeCategory]
  );

  const activeItems = useMemo(
    () => activeCategoryData?.items ?? [],
    [activeCategoryData]
  );

  const scrollToMenu = useCallback(() => {
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  if (!menu?.categories?.length) {
    return (
      <div className="flex min-h-screen w-full min-w-0 flex-col items-center justify-center gap-4 overflow-x-hidden bg-stone-50 p-4 text-center sm:p-8">
        <p className="text-lg text-stone-700">Menu is not loaded yet.</p>
        <p className="text-sm text-stone-500">
          Set <code className="rounded bg-stone-200 px-1">MONGODB_URI</code> and
          run <code className="rounded bg-stone-200 px-1">npm run seed</code>, or
          ensure <code className="rounded bg-stone-200 px-1">data/menu.json</code> exists.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-stone-50 text-stone-900">
      <header className="fixed inset-x-0 top-0 z-40 overflow-hidden border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-2 px-3 py-3 sm:px-4 sm:py-3.5">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="min-w-0 max-w-[calc(100%-5.5rem)] shrink rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a20302]/40"
          >
            <img
              src="/logo.jpg"
              alt="Golden Pearl Chinese Restaurant"
              className="h-12 w-auto max-w-full object-contain object-left sm:h-14 md:h-16"
              width={320}
              height={82}
            />
          </button>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative rounded-full bg-[#a20302] px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#8a0202] sm:px-4"
            >
              Cart
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-xs font-bold text-stone-900">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <section className="relative mt-[4.25rem] min-h-[min(72vh,640px)] w-full overflow-hidden bg-stone-950 text-white sm:mt-[4.75rem] md:mt-20 sm:min-h-[min(85vh,720px)]">
        <img
          src="/hero.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover object-[75%_center] sm:object-[70%_center] md:object-right"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/80 to-stone-950/40 md:via-stone-950/55 md:to-transparent"
          aria-hidden
        />
        <div className="relative mx-auto flex h-full min-h-[inherit] w-full max-w-6xl items-center px-3 py-12 sm:px-4 sm:py-16 md:py-24">
          <div className="w-full min-w-0 max-w-lg text-left md:max-w-xl">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-amber-300/95 sm:text-sm sm:tracking-[0.2em]">
              Order online · Fresh &amp; flavourful
            </p>
            <h1 className="mt-3 break-words text-3xl font-bold leading-tight tracking-tight sm:mt-4 sm:text-4xl md:text-5xl lg:text-[3.25rem]">
              Golden Pearl Chinese Restaurant
            </h1>
            <p className="mt-3 text-base leading-relaxed text-stone-200 sm:mt-4 sm:text-lg">
              Browse our full menu, add your favourites to cart, and checkout in
              minutes — pickup or delivery.
            </p>
            {menu.address && (
              <p className="mt-3 text-sm text-stone-300">{menu.address}</p>
            )}
            <button
              type="button"
              onClick={scrollToMenu}
              className="mt-8 rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-stone-900 shadow-lg transition hover:bg-amber-300"
            >
              View menu
            </button>
          </div>
        </div>
      </section>

      <section id="menu" className="w-full min-w-0 max-w-full overflow-x-hidden py-10 sm:py-12">
        <div className="mx-auto max-w-6xl px-3 sm:px-4">
          <h2 className="text-2xl font-bold tracking-tight">Menu</h2>
        </div>

        <div
          className="sticky top-[4.25rem] z-30 mt-6 w-full min-w-0 max-w-full overflow-hidden border-b border-stone-200 bg-stone-50/95 py-2.5 backdrop-blur sm:top-[4.75rem] md:top-20 sm:mt-8 sm:py-3"
        >
          <div
            className="max-w-full overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="inline-flex gap-2 px-3 sm:mx-auto sm:flex sm:max-w-6xl sm:flex-wrap sm:px-4 md:flex-nowrap">
            {menu.categories.map((cat: MenuCategory) => {
              const catImg = resolveMenuImage(cat.image);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex max-w-[14rem] shrink-0 items-center gap-2 rounded-full px-2.5 py-1.5 text-left text-xs font-medium transition sm:max-w-none sm:px-3 sm:py-2 sm:text-sm ${
                    activeCategory === cat.id
                      ? "bg-[#a20302] text-white shadow"
                      : "bg-white text-stone-700 ring-1 ring-stone-200 hover:ring-stone-300"
                  }`}
                >
                  <img
                    src={catImg}
                    alt=""
                    className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-white/30 sm:h-8 sm:w-8"
                    loading="lazy"
                  />
                  <span className="truncate">{cat.name}</span>
                </button>
              );
            })}
            </div>
          </div>
        </div>

        <div className="mx-auto grid w-full min-w-0 max-w-6xl grid-cols-1 gap-4 px-3 pt-8 sm:grid-cols-2 sm:gap-6 sm:px-4 lg:grid-cols-3">
          {activeItems.map((item) => (
            <article
              key={item.id}
              className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/80 transition hover:shadow-md"
            >
              <div className="relative aspect-[4/3] bg-stone-100">
                <img
                  src={resolveMenuImage(item.image, activeCategoryData?.image)}
                  alt={item.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 flex-1 font-semibold leading-snug break-words">
                    {item.name}
                  </h3>
                  <span className="shrink-0 text-sm font-semibold text-[#a20302]">
                    {formatCurrency(item.price)}
                  </span>
                </div>
                {item.description && (
                  <p className="line-clamp-2 text-sm text-stone-500">
                    {item.description}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() =>
                    addItem({
                      externalId: item.id,
                      productId: item._id,
                      name: item.name,
                      price: item.price,
                      image: item.image,
                    })
                  }
                  className="mt-auto rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
                >
                  Add to cart
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        id="hours"
        className="w-full min-w-0 max-w-full overflow-x-hidden border-t border-stone-200 bg-white py-10 sm:py-14"
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-3 sm:px-4 md:grid-cols-2 md:gap-16">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Hours</h2>
            <p className="mt-2 text-sm text-stone-500">
              Times from Google · may change on holidays.
            </p>
            <ul className="mt-6 divide-y divide-stone-100">
              {HOURS.map((row) => (
                <li
                  key={row.day}
                  className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-2"
                >
                  <span className="font-medium text-stone-800">{row.day}</span>
                  <span className="text-stone-600 sm:text-right">
                    {row.hours}
                    {"note" in row && row.note && (
                      <span className="mt-0.5 block text-xs text-stone-400">
                        {row.note}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Visit us</h2>
            {menu.address && (
              <p className="mt-4 text-stone-600">{menu.address}</p>
            )}
            <p className="mt-4">
              <a
                href={`tel:${RESTAURANT_PHONE}`}
                className="text-lg font-semibold text-[#a20302] hover:underline"
              >
                {RESTAURANT_PHONE_DISPLAY}
              </a>
            </p>
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-stone-800 sm:w-auto sm:justify-start"
            >
              Open in Google Maps
            </a>
          </div>
        </div>
      </section>

      <footer className="w-full min-w-0 max-w-full overflow-x-hidden border-t border-stone-200 bg-stone-50 px-3 py-10 text-center text-sm text-stone-500">
        <img
          src="/logo.jpg"
          alt=""
          className="mx-auto h-16 max-w-[min(100%,300px)] w-auto object-contain opacity-90 sm:h-[4.5rem]"
          width={220}
          height={56}
        />
        <p className="mt-3">Order online · Pickup &amp; delivery</p>
      </footer>

      <CartPanel
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onDemoPaid={(orderNumber) => setSuccessOrder(orderNumber)}
      />

      {successOrder && (
        <OrderSuccessModal
          orderNumber={successOrder}
          onClose={() => setSuccessOrder(null)}
        />
      )}
    </div>
  );
}
