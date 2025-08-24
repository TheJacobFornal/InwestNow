import { useEffect, useMemo, useState } from "react";

type Row = Record<string, any>;

const envBase = (import.meta as any).env?.VITE_API_BASE as string | undefined;

// Prefer VITE_API_BASE; fall back to same-origin (useful if you reverse-proxy /api/*)
const API_BASE = (envBase && envBase.trim().length > 0)
  ? envBase
  : (typeof window !== "undefined" ? window.location.origin : "http://localhost:8000");

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, "");
  const p = path.replace(/^\/+/, "");
  return `${b}/${p}`;
}

const EMPLOYEES_URL = joinUrl(API_BASE, "/api/employees");
const HEALTH_URL = joinUrl(API_BASE, "/api/health");

export default function App() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<{ ok?: boolean; server_time?: string } | null>(null);

  const fetchHealth = async () => {
    try {
      const res = await fetch(HEALTH_URL, { method: "GET" });
      if (!res.ok) throw new Error(`Health HTTP ${res.status}`);
      const data = await res.json();
      setHealth(data);
    } catch (e: any) {
      setHealth({ ok: false, server_time: e.message || "unavailable" });
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(EMPLOYEES_URL, { method: "GET" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(Array.isArray(data.items) ? data.items : []);
    } catch (e: any) {
      setError(e.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchEmployees();
  }, []);

  const columns = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows]);

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>Employees</h1>
          <div style={{ fontSize: 12, color: "#666" }}>
            API: <code>{EMPLOYEES_URL}</code>
            {" · "}
            Health:{" "}
            {health?.ok ? (
              <span style={{ color: "green" }}>OK</span>
            ) : (
              <span style={{ color: "red" }}>DOWN</span>
            )}
            {health?.server_time ? ` · ${health.server_time}` : null}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchHealth} style={btn}>Check Health</button>
          <button onClick={fetchEmployees} style={btn}>Refresh</button>
        </div>
      </header>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {!loading && !error && rows.length === 0 && <p>No records found.</p>}

      {!loading && !error && rows.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c} style={th}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c} style={td}>{formatCell(r[c])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatCell(v: any) {
  if (v == null) return "";
  if (typeof v === "string") {
    // Light ISO date/datetime prettifier
    const isoLike = /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?)?$/;
    if (isoLike.test(v)) {
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d.toLocaleString();
    }
    return v;
  }
  if (typeof v === "number") {
    return Number.isInteger(v) ? v.toLocaleString() : v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (v instanceof Date) return v.toLocaleString();
  return String(v);
}

const th: React.CSSProperties = {
  textTransform: "capitalize",
  textAlign: "left",
  borderBottom: "1px solid #ddd",
  padding: "10px 8px",
  whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  borderBottom: "1px solid #f0f0f0",
  padding: "10px 8px",
  verticalAlign: "top",
  whiteSpace: "nowrap",
};
const btn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #ddd",
  cursor: "pointer",
  background: "#fff",
};
