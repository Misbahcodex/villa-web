"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { VerificationStatus } from "@/data/policies";

interface FactRow {
  key: string;
  label: string;
  value: any;
  status: VerificationStatus;
  sources?: string[];
  note?: string;
  isSaving?: boolean;
  saveSuccess?: boolean;
}

const FACT_METADATA: Record<string, { label: string; placeholder: string; type: "string" | "number" | "boolean" }> = {
  checkInWindow: { label: "Check-in Window", placeholder: "e.g. 15:00 – 23:00", type: "string" },
  checkOutTime: { label: "Check-out Time", placeholder: "e.g. 11:00", type: "string" },
  adultsOnly: { label: "Adults-Only Property", placeholder: "true / false", type: "boolean" },
  minGuestAge: { label: "Minimum Guest Age", placeholder: "e.g. 18", type: "number" },
  outdoorPool: { label: "Outdoor Swimming Pool", placeholder: "true / false", type: "boolean" },
  coworking: { label: "Coworking Space", placeholder: "true / false", type: "boolean" },
  socialLounge: { label: "Social Lounge & Café", placeholder: "true / false", type: "boolean" },
  wifiMbps: { label: "Wi-Fi Speed (Mbps)", placeholder: "e.g. 500", type: "number" },
  freeParking: { label: "Free On-Site Parking", placeholder: "true / false", type: "boolean" },
  selfServeLaundry: { label: "Self-Serve Laundry", placeholder: "true / false", type: "boolean" },
  gym: { label: "Gym / Fitness Center", placeholder: "true / false", type: "boolean" },
  shuttle: { label: "Airport / Metro Shuttle", placeholder: "true / false", type: "boolean" },
  paymentPolicy: { label: "Payment Policy", placeholder: "e.g. Deposit requirement / arrival terms", type: "string" },
};

export default function AdminFactsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(true);
  const [facts, setFacts] = useState<FactRow[]>([]);
  const [awaitingCount, setAwaitingCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchFacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/facts");
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(true);
      const data = await res.json();
      if (data.facts) {
        const rows: FactRow[] = Object.entries(data.facts).map(([key, fact]: [string, any]) => ({
          key,
          label: FACT_METADATA[key]?.label || key,
          value: fact.value !== null && fact.value !== undefined ? String(fact.value) : "",
          status: fact.status,
          sources: fact.sources || [],
          note: fact.note,
        }));
        setFacts(rows);
        setAwaitingCount(data.awaitingCount ?? rows.filter((r) => r.status !== "confirmed").length);
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacts();
  }, [fetchFacts]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        fetchFacts();
      } else {
        setLoginError("Invalid admin password");
      }
    } catch {
      setLoginError("Network connection error");
    }
  };

  const handleUpdateRow = (key: string, field: "value" | "status", newValue: any) => {
    setFacts((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: newValue } : row))
    );
  };

  const handleSaveFact = async (row: FactRow) => {
    const meta = FACT_METADATA[row.key];
    let parsedValue: any = row.value;

    if (row.value === "" || row.value === null) {
      parsedValue = null;
    } else if (meta?.type === "boolean") {
      parsedValue = row.value === "true" || row.value === true;
    } else if (meta?.type === "number") {
      const num = Number(row.value);
      parsedValue = isNaN(num) ? null : num;
    }

    setFacts((prev) =>
      prev.map((r) => (r.key === row.key ? { ...r, isSaving: true, saveSuccess: false } : r))
    );

    try {
      const res = await fetch("/api/admin/facts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: row.key,
          value: parsedValue,
          status: row.status,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAwaitingCount(data.awaitingCount);
        setFacts((prev) =>
          prev.map((r) => (r.key === row.key ? { ...r, isSaving: false, saveSuccess: true } : r))
        );
        setStatusMessage(`Saved "${row.label}" successfully.`);
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setFacts((prev) =>
          prev.map((r) => (r.key === row.key ? { ...r, isSaving: false } : r))
        );
      }
    } catch {
      setFacts((prev) =>
        prev.map((r) => (r.key === row.key ? { ...r, isSaving: false } : r))
      );
    }
  };

  // Login View
  if (isAuthenticated === false) {
    return (
      <div className="pt-32 pb-24 px-4 max-w-md mx-auto min-h-screen text-on-dark font-mono">
        <div className="bg-surface border border-subtle p-8 rounded-sm space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-sm border border-accent/40 bg-base flex items-center justify-center text-accent mx-auto text-xs">
              LOCK
            </div>
            <h1 className="font-serif text-xl uppercase tracking-tight text-on-dark font-normal">
              Admin Authentication
            </h1>
            <p className="text-xs text-muted-dark font-sans font-light">
              Please authenticate to access the property facts checklist.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Enter admin password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-base border border-subtle text-on-dark text-xs px-4 py-3 rounded-sm focus:outline-none focus:border-accent"
                required
              />
              {loginError && <p className="text-xs text-rose-400 mt-1">{loginError}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-accent hover:bg-accent-strong text-base font-medium py-3 rounded-sm text-xs uppercase tracking-widest transition-colors"
            >
              Sign In to Verification Desk →
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-base min-h-screen text-on-dark font-mono">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-subtle pb-6">
          <div className="space-y-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs text-muted-dark hover:text-on-dark transition-colors"
            >
              <span>← Back to Operations Dashboard</span>
            </Link>
            <h1 className="font-serif text-2xl sm:text-3xl uppercase tracking-tight text-on-dark font-normal">
              Property Facts Verification
            </h1>
            <p className="text-xs text-muted-dark max-w-2xl font-sans font-light">
              Approval control for property specifications and operational rules. Changing a fact to &quot;confirmed&quot; publishes it to the live guest-facing website. Unconfirmed facts display neutral placeholder wording.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-sm text-xs uppercase tracking-wider border flex items-center gap-2 ${
              awaitingCount > 0
                ? "bg-accent/10 border-accent/40 text-accent"
                : "bg-success/15 border-success text-success"
            }`}>
              <span>•</span>
              <span>{awaitingCount} facts awaiting confirmation</span>
            </div>

            <button
              type="button"
              onClick={fetchFacts}
              disabled={loading}
              className="inline-flex items-center gap-1.5 bg-surface hover:bg-subtle border border-subtle text-on-dark px-3 py-2 rounded-sm text-xs uppercase tracking-wider transition-colors"
            >
              <span>{loading ? "Syncing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="p-3 bg-success/15 border border-success rounded-sm text-xs text-success flex items-center gap-2">
            <span>✓</span>
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Facts Table */}
        <div className="bg-surface border border-subtle rounded-sm overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-base text-muted-dark uppercase tracking-wider text-[10px] border-b border-subtle">
                <tr>
                  <th className="py-3.5 px-4 font-medium">Property Fact</th>
                  <th className="py-3.5 px-4 font-medium">Approved Value</th>
                  <th className="py-3.5 px-4 font-medium">Verification Status</th>
                  <th className="py-3.5 px-4 font-medium">Listing Sources &amp; Notes</th>
                  <th className="py-3.5 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {facts.map((row) => {
                  const meta = FACT_METADATA[row.key];
                  return (
                    <tr key={row.key} className="hover:bg-base/40 transition-colors">
                      {/* Fact Label */}
                      <td className="py-4 px-4 text-on-dark">
                        <span className="block font-medium">{row.label}</span>
                        <code className="text-[10px] text-muted-dark block">
                          {row.key}
                        </code>
                      </td>

                      {/* Editable Value */}
                      <td className="py-4 px-4">
                        {meta?.type === "boolean" ? (
                          <select
                            value={String(row.value)}
                            onChange={(e) => handleUpdateRow(row.key, "value", e.target.value === "true")}
                            className="bg-base border border-subtle text-on-dark text-xs px-2.5 py-1.5 rounded-sm focus:outline-none focus:border-accent"
                          >
                            <option value="">null (Not confirmed)</option>
                            <option value="true">true (Available / Yes)</option>
                            <option value="false">false (Not available / No)</option>
                          </select>
                        ) : (
                          <input
                            type={meta?.type === "number" ? "number" : "text"}
                            value={row.value ?? ""}
                            placeholder={meta?.placeholder || "Enter approved value..."}
                            onChange={(e) => handleUpdateRow(row.key, "value", e.target.value)}
                            className="bg-base border border-subtle text-on-dark text-xs px-3 py-1.5 rounded-sm w-48 focus:outline-none focus:border-accent"
                          />
                        )}
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-4 px-4">
                        <select
                          value={row.status}
                          onChange={(e) => handleUpdateRow(row.key, "status", e.target.value as VerificationStatus)}
                          className={`text-xs px-2.5 py-1.5 rounded-sm border focus:outline-none ${
                            row.status === "confirmed"
                              ? "bg-success/15 border-success text-success"
                              : row.status === "conflicting"
                              ? "bg-rose-950/40 border-rose-800 text-rose-300"
                              : "bg-surface border-subtle text-accent"
                          }`}
                        >
                          <option value="confirmed" className="bg-base text-success">
                            ✓ confirmed
                          </option>
                          <option value="unconfirmed" className="bg-base text-muted-dark">
                            ? unconfirmed
                          </option>
                          <option value="conflicting" className="bg-base text-rose-400">
                            ! conflicting
                          </option>
                        </select>
                      </td>

                      {/* Sources and Notes */}
                      <td className="py-4 px-4 text-muted-dark max-w-xs">
                        {row.sources && row.sources.length > 0 ? (
                          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-dark">
                            {row.sources.map((s, idx) => (
                              <li key={idx} className="truncate" title={s}>
                                {s}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-[11px] text-muted-dark italic">No sources cited</span>
                        )}
                        {row.note && (
                          <span className="text-[10px] text-accent/80 block mt-1">
                            Note: {row.note}
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSaveFact(row)}
                          disabled={row.isSaving}
                          className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-strong disabled:opacity-50 text-base px-3 py-1.5 rounded-sm text-xs uppercase tracking-wider transition-colors"
                        >
                          <span>{row.isSaving ? "Saving..." : row.saveSuccess ? "Saved!" : "Save"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
