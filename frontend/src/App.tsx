import { useEffect, useMemo, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE as string;

// ======= Types =======
type HelloResponse = { message: string };

type Holding = {
  id: number;
  currency: string;       // maps to DB column Currency
  purchaseDate: string;   // YYYY-MM-DD
  amount: number;
  price: number;
  value: number;
  created_at?: string | null;
};

// ======= Helpers =======
async function fetchJSON<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

async function getHello(name?: string): Promise<HelloResponse> {
  const url = name ? `${API_BASE}/hello?name=${encodeURIComponent(name)}` : `${API_BASE}/hello`;
  return fetchJSON<HelloResponse>(url);
}

async function listHoldings(): Promise<Holding[]> {
  return fetchJSON<Holding[]>(`${API_BASE}/holdings`);
}

async function addHolding(payload: Omit<Holding, "id" | "created_at">): Promise<Holding> {
  // FastAPI expects the aliased names the backend defined (Currency, PurchaseDate, …)
  const body = JSON.stringify({
    Currency: payload.currency,
    PurchaseDate: payload.purchaseDate, // YYYY-MM-DD
    Amount: payload.amount,
    Price: payload.price,
    Value: payload.value,
  });
  return fetchJSON<Holding>(`${API_BASE}/holdings`, { method: "POST", body });
}

// ======= Component =======
function App() {
  // hello demo
  const [count, setCount] = useState(0);
  const [helloMsg, setHelloMsg] = useState("");

  // holdings state
  const [rows, setRows] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // add form
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [form, setForm] = useState<Omit<Holding, "id" | "created_at">>({
    currency: "USD",
    purchaseDate: today,
    amount: 0,
    price: 0,
    value: 0,
  });

  // initial load
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const data = await listHoldings();
        setRows(data);
      } catch (e: any) {
        setErr(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // hello buttons
  const callHello = async (name?: string) => {
    try {
      const { message } = await getHello(name);
      setHelloMsg(message);
    } catch (e: any) {
      setHelloMsg(`Error: ${e.message ?? e}`);
    }
  };

  // submit holding
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErr(null);
      // simple computed value if user leaves 0
      const payload = {
        ...form,
        value: form.value && form.value !== 0 ? form.value : Number((form.amount * form.price).toFixed(2)),
      };
      const created = await addHolding(payload);
      setRows((prev) => [created, ...prev]); // optimistic prepend
      // reset amount/price for quick subsequent entry
      setForm((f) => ({ ...f, amount: 0, price: 0, value: 0 }));
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <h1>Vite + React + InwestNow</h1>

      <div className="card">
        <button onClick={() => setCount((c) => c + 1)}>count is {count}</button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>

      {/* Hello demo */}
      <div className="card" style={{ display: "grid", gap: 8 }}>
        <h2>Call Python API /hello</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => callHello()}>Say Hello (default)</button>
          <button onClick={() => callHello("Jacob")}>Say Hello Jacob</button>
        </div>
        <p>
          <strong>Response:</strong> {helloMsg}
        </p>
      </div>

      {/* Holdings form */}
      <div className="card" style={{ display: "grid", gap: 12 }}>
        <h2>Add Holding</h2>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <label>
              Currency
              <input
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
                placeholder="USD"
                required
              />
            </label>
            <label>
              Purchase date
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
                required
              />
            </label>
            <label>
              Amount
              <input
                type="number"
                step="any"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                required
              />
            </label>
            <label>
              Price
              <input
                type="number"
                step="any"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                required
              />
            </label>
            <label>
              Value (optional; auto = amount × price)
              <input
                type="number"
                step="any"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
              />
            </label>
          </div>
          <button type="submit">Add</button>
        </form>

        {err && (
          <p style={{ color: "crimson" }}>
            <strong>Error:</strong> {err}
          </p>
        )}
      </div>

      {/* Holdings table */}
      <div className="card" style={{ display: "grid", gap: 12 }}>
        <h2>Holdings</h2>
        {loading ? (
          <p>Loading…</p>
        ) : rows.length === 0 ? (
          <p>No rows yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 8 }}>ID</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Currency</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Purchase date</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Amount</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Price</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Value</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td style={{ padding: 8 }}>{r.id}</td>
                    <td style={{ padding: 8 }}>{r.currency}</td>
                    <td style={{ padding: 8 }}>{r.purchaseDate}</td>
                    <td style={{ padding: 8, textAlign: "right" }}>{r.amount}</td>
                    <td style={{ padding: 8, textAlign: "right" }}>{r.price}</td>
                    <td style={{ padding: 8, textAlign: "right" }}>{r.value}</td>
                    <td style={{ padding: 8 }}>{r.created_at ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="read-the-docs">API base: {API_BASE}</p>
    </>
  );
}

export default App;
