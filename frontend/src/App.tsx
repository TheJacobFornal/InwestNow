import { useEffect, useState } from "react";

type Employee = {
  id: number;
  name: string;
  role: string;
  salary: number;
  hire_date: string;   // ISO date from API
  created_at: string;  // ISO datetime from API
};

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("http://localhost:8000/api/employees");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEmployees(data.items || []);
    } catch (e: any) {
      setError(e.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Employees</h1>
        <button onClick={fetchEmployees} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", cursor: "pointer" }}>
          Refresh
        </button>
      </header>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {!loading && !error && employees.length === 0 && (
        <p>No records found.</p>
      )}

      {!loading && !error && employees.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>ID</th>
                <th style={th}>Name</th>
                <th style={th}>Role</th>
                <th style={th}>Salary</th>
                <th style={th}>Hire Date</th>
                <th style={th}>Created</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td style={td}>{emp.id}</td>
                  <td style={td}>{emp.name}</td>
                  <td style={td}>{emp.role}</td>
                  <td style={td}>${emp.salary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={td}>{new Date(emp.hire_date).toLocaleDateString()}</td>
                  <td style={td}>{new Date(emp.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <footer style={{ marginTop: 24, fontSize: 12, color: "#666" }}>
        API: <code>http://localhost:8000/api/employees</code>
      </footer>
    </div>
  );
}

const th: React.CSSProperties = {
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

