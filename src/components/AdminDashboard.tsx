"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/format";

type OrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  orderType: string;
  address?: string;
  notes?: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  status: string;
  paidAt?: string;
  createdAt: string;
};

export function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sinceRef = useRef<string | null>(null);

  const loadOrders = useCallback(async () => {
    const res = await fetch("/api/admin/orders");
    if (res.status === 401) {
      setAuthed(false);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setOrders(data.orders || []);
    setAuthed(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- session check on mount
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!authed) return;
    if (!sinceRef.current) {
      sinceRef.current = new Date().toISOString();
    }

    const es = new EventSource(
      `/api/admin/orders/events?since=${encodeURIComponent(sinceRef.current)}`
    );

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "paid_order") {
          audioRef.current?.play().catch(() => {
            /* user may block autoplay until interaction */
          });
          loadOrders();
        }
      } catch {
        /* ignore */
      }
    };

    return () => es.close();
  }, [authed, loadOrders]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      setLoginError("Invalid email or password");
      return;
    }
    setAuthed(true);
    sinceRef.current = new Date().toISOString();
    await loadOrders();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setOrders([]);
  }

  if (loading && !authed) {
    return (
      <div className="flex min-h-screen w-full min-w-0 items-center justify-center overflow-x-hidden bg-stone-100">
        <p className="text-stone-600">Loading…</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen w-full min-w-0 items-center justify-center overflow-x-hidden bg-stone-100 px-4">
        <form
          onSubmit={login}
          className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg ring-1 ring-stone-200"
        >
          <img
            src="/logo.jpg"
            alt="Golden Pearl Chinese Restaurant"
            className="mx-auto h-12 w-auto object-contain"
          />
          <h1 className="mt-4 text-center text-xl font-semibold">Admin — Orders</h1>
          <p className="mt-1 text-sm text-stone-500">
            New paid orders play a sound notification.
          </p>
          <label className="mt-6 block text-sm font-medium">
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            />
          </label>
          <label className="mt-4 block text-sm font-medium">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            />
          </label>
          {loginError && (
            <p className="mt-2 text-sm text-red-600">{loginError}</p>
          )}
          <button
            type="submit"
            className="mt-4 w-full rounded-xl bg-stone-900 py-2.5 text-white"
          >
            Sign in
          </button>
          <Link href="/" className="mt-4 block text-center text-sm text-stone-500">
            Back to store
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-stone-100">
      <audio ref={audioRef} src="/sounds/order-notification.mp3" preload="auto" />
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold">Orders</h1>
            <p className="text-xs text-stone-500 break-words">
              Listening for paid orders · notification:{" "}
              <code className="rounded bg-stone-100 px-1 break-all">
                order-notification.mp3
              </code>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => audioRef.current?.play()}
              className="text-sm text-stone-600 underline"
            >
              Test sound
            </button>
            <Link href="/" className="text-sm text-stone-600">Store</Link>
            <button
              type="button"
              onClick={logout}
              className="text-sm font-medium text-[#a20302]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl min-w-0 px-3 py-8 sm:px-4">
        {orders.length === 0 ? (
          <p className="text-center text-stone-500">No orders yet.</p>
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => (
              <li
                key={order.id}
                className="min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="text-sm text-stone-600">
                      {order.customerName} · {order.phone}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      order.status === "paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-stone-500">
                  {order.orderType} · {formatCurrency(order.subtotal)}
                </p>
                <ul className="mt-3 border-t border-stone-100 pt-3 text-sm">
                  {order.items.map((item, i) => (
                    <li key={i}>
                      {item.quantity}× {item.name}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
