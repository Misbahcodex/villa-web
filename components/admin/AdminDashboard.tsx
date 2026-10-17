"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BookingRecord,
  BlockRecord,
  IcalFeedRecord,
  AuditLogRecord,
  RoomTypeRecord,
  BookingStatus,
} from "@/types";
import { formatAED } from "@/lib/pricing";
import { buildOwnerConfirmationWhatsAppLink, buildOwnerDeclineWhatsAppLink } from "@/lib/notify/whatsappHelper";
import { rooms } from "@/data/rooms";
import { format, parseISO, startOfToday, isToday, isBefore, isAfter } from "date-fns";
// Zero-SVG Typographic Indicators
type IconProps = { className?: string };
const Download = (_: IconProps) => <span>↓</span>;
const Search = (_: IconProps) => <span>⌕</span>;
const LogOut = (_: IconProps) => <span>[Exit]</span>;
const RefreshCw = ({ className }: IconProps) => <span className={className}>↻</span>;
const Shield = (_: IconProps) => <span className="text-accent">★</span>;
const MessageSquare = (_: IconProps) => <span>WA</span>;
const CheckCircle2 = (_: IconProps) => <span className="text-success font-bold">✓</span>;
const XCircle = (_: IconProps) => <span className="text-rose-400 font-bold">✕</span>;
const Clock = (_: IconProps) => <span>•</span>;
const Calendar = (_: IconProps) => <span>[Cal]</span>;
const Layers = (_: IconProps) => <span>[Units]</span>;
const Settings = (_: IconProps) => <span>[Config]</span>;
const Plus = (_: IconProps) => <span>+</span>;
const Trash2 = (_: IconProps) => <span>✕</span>;
const Copy = (_: IconProps) => <span>Copy</span>;
const ExternalLink = (_: IconProps) => <span>↗</span>;
const ChevronRight = (_: IconProps) => <span>→</span>;
const UserCheck = (_: IconProps) => <span>[Adults]</span>;
const AlertCircle = (_: IconProps) => <span>!</span>;
const Phone = (_: IconProps) => <span>[Tel]</span>;
const LinkIcon = (_: IconProps) => <span>[Link]</span>;
const Filter = (_: IconProps) => <span>[Filter]</span>;



interface AdminDashboardProps {
  initialAuthenticated: boolean;
}

type DashboardTab = "today" | "inbox" | "calendar" | "bookings" | "settings" | "audit";

export function AdminDashboard({ initialAuthenticated }: AdminDashboardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthenticated);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<DashboardTab>("today");

  // Core Data State
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [blocks, setBlocks] = useState<BlockRecord[]>([]);
  const [icalFeeds, setIcalFeeds] = useState<IcalFeedRecord[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomTypeRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [awaitingFactsCount, setAwaitingFactsCount] = useState<number>(7);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals & Drawers
  const [showManualBookingModal, setShowManualBookingModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedDayForBlock, setSelectedDayForBlock] = useState<string>("");
  const [declinePromptId, setDeclinePromptId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [copiedFeedUrl, setCopiedFeedUrl] = useState<string | null>(null);

  // Form states for adding feed or manual booking
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedLabel, setNewFeedLabel] = useState("");
  const [newFeedRoomId, setNewFeedRoomId] = useState("premium-single-capsule");

  // Fetch all dashboard data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsRes, blocksRes, feedsRes, settingsRes] = await Promise.all([
        fetch("/api/admin/bookings"),
        fetch("/api/admin/blocks"),
        fetch("/api/admin/ical-feeds"),
        fetch("/api/admin/settings"),
      ]);

      if (bookingsRes.status === 401) {
        setIsAuthenticated(false);
        return;
      }

      const [bookingsData, blocksData, feedsData, settingsData] = await Promise.all([
        bookingsRes.json(),
        blocksRes.json(),
        feedsRes.json(),
        settingsRes.json(),
      ]);

      if (bookingsData.bookings) setBookings(bookingsData.bookings);
      if (blocksData.blocks) setBlocks(blocksData.blocks);
      if (feedsData.feeds) setIcalFeeds(feedsData.feeds);
      if (settingsData.roomTypes) setRoomTypes(settingsData.roomTypes);
      if (settingsData.awaitingCount !== undefined) setAwaitingFactsCount(settingsData.awaitingCount);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  // Login handler
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
        setPassword("");
      } else {
        setLoginError("Invalid password. Check ADMIN_PASSWORD environment variable.");
      }
    } catch {
      setLoginError("Login request failed");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
  };

  // Actions
  const handleConfirm = async (id: string) => {
    setActionInProgress(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}/confirm`, { method: "POST" });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "confirmed", holdExpiresAt: null } : b))
        );
      }
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDecline = async (id: string) => {
    setActionInProgress(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: declineReason || "Dates not available" }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "declined", holdExpiresAt: null } : b))
        );
        setDeclinePromptId(null);
        setDeclineReason("");
      }
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSyncFeed = async (feedId: string) => {
    setActionInProgress(`sync-${feedId}`);
    try {
      const res = await fetch(`/api/admin/ical-feeds/${feedId}/sync`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Feed synchronized successfully!");
        fetchData();
      } else {
        alert(data.error || "Sync failed.");
      }
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSyncAllFeeds = async () => {
    setActionInProgress("sync-all");
    try {
      for (const feed of icalFeeds) {
        await fetch(`/api/admin/ical-feeds/${feed.id}/sync`, { method: "POST" });
      }
      alert("All calendar feeds synchronized successfully!");
      fetchData();
    } catch {
      alert("Failed to synchronize all feeds.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleBlockPhone = async (phone: string) => {
    if (!confirm(`Block phone number "${phone}" from submitting new reservation requests?`)) return;
    try {
      const res = await fetch("/api/admin/phone-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        alert(`Phone number "${phone}" has been blocked.`);
        fetchData();
      }
    } catch {
      alert("Failed to block phone number");
    }
  };

  const handleDeleteFeed = async (feedId: string) => {
    if (!confirm("Are you sure you want to delete this iCal feed and remove its blocked events?")) return;
    const res = await fetch(`/api/admin/ical-feeds/${feedId}`, { method: "DELETE" });
    if (res.ok) {
      setIcalFeeds((prev) => prev.filter((f) => f.id !== feedId));
    }
  };

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedUrl || !newFeedLabel) return;

    const res = await fetch("/api/admin/ical-feeds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomTypeId: newFeedRoomId,
        url: newFeedUrl,
        label: newFeedLabel,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setIcalFeeds((prev) => [...prev, data.feed]);
      setNewFeedUrl("");
      setNewFeedLabel("");
    }
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const res = await fetch("/api/admin/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomTypeId: formData.get("roomTypeId"),
        startDate: formData.get("startDate"),
        endDate: formData.get("endDate"),
        units: Number(formData.get("units") || 1),
        reason: formData.get("reason"),
      }),
    });

    if (res.ok) {
      setShowBlockModal(false);
      fetchData();
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm("Remove this calendar block?")) return;
    const res = await fetch(`/api/admin/blocks/${blockId}`, { method: "DELETE" });
    if (res.ok) {
      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFeedUrl(id);
    setTimeout(() => setCopiedFeedUrl(null), 2500);
  };

  // ----------------------------------------------------
  // COMPUTED STATS: TODAY'S ARRIVALS, DEPARTURES, IN-HOUSE
  // ----------------------------------------------------
  const todayStr = format(startOfToday(), "yyyy-MM-dd");

  const todayArrivals = bookings.filter(
    (b) => b.checkIn === todayStr && (b.status === "confirmed" || b.status === "pending")
  );
  const todayDepartures = bookings.filter(
    (b) => b.checkOut === todayStr && b.status === "confirmed"
  );
  const inHouseGuests = bookings.filter(
    (b) => b.checkIn <= todayStr && b.checkOut > todayStr && b.status === "confirmed"
  );
  const pendingRequests = bookings.filter((b) => b.status === "pending");

  // Filtered bookings for the table view
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (roomFilter !== "all" && b.roomTypeId !== roomFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = b.ref.toLowerCase().includes(q);
      const matchName = b.guestName.toLowerCase().includes(q);
      const matchPhone = b.guestPhone.includes(q);
      return matchRef || matchName || matchPhone;
    }
    return true;
  });

  // ----------------------------------------------------
  // LOGIN SCREEN
  // ----------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-[#272220] border-2 border-[#38302C] p-8 rounded-2xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent flex items-center justify-center text-accent mx-auto">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="font-sans font-black text-2xl uppercase tracking-tight text-white">
              OPERATIONS DESK
            </h1>
            <p className="text-xs text-[#C8C2BC]">
              Enter manager password to access live bookings, inventory holds, and calendar sync.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="admin-pw" className="text-xs font-bold uppercase tracking-wider text-[#C8C2BC]">
                Password
              </label>
              <input
                id="admin-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Manager password"
                className="w-full bg-[#1E1A18] border border-[#38302C] text-white text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-accent"
                autoFocus
                required
              />
            </div>

            {loginError && (
              <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800 p-2.5 rounded-lg">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-accent hover:bg-accent-strong text-umber-950 font-black py-3 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-lg"
            >
              ACCESS DASHBOARD
            </button>
          </form>

          <p className="text-[11px] text-[#C8C2BC] text-center">
            Default demo password: <code className="text-accent">demo_admin_2026</code>
          </p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // AUTHENTICATED DASHBOARD
  // ----------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#38302C] pb-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-accent block">
            DUBAI SANCTUARY • LIVE ENGINE
          </span>
          <h1 className="font-sans font-black text-2xl sm:text-3xl uppercase tracking-tight text-white">
            OPERATIONS DASHBOARD
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/facts"
            className={`inline-flex items-center gap-1.5 border px-3 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${
              awaitingFactsCount > 0
                ? "bg-accent-cool/15 border-accent-cool text-accent-cool hover:bg-accent-cool/25"
                : "bg-success/15 border-success text-success hover:bg-success/25"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{awaitingFactsCount} facts awaiting confirmation</span>
          </Link>

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-[#272220] hover:bg-[#38302C] border border-[#38302C] text-white px-3 py-2 rounded-lg text-xs font-bold uppercase transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <a
            href="/api/admin/export"
            className="inline-flex items-center gap-1.5 bg-[#272220] hover:bg-[#38302C] border border-[#38302C] text-white px-3 py-2 rounded-lg text-xs font-bold uppercase transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-red-200 px-3 py-2 rounded-lg text-xs font-bold uppercase transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#272220] border border-[#38302C] p-5 rounded-2xl space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-[#8A827C] font-bold block">
            PENDING HOLDS
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-sans font-black text-3xl text-accent-cool">
              {pendingRequests.length}
            </span>
            <span className="text-[11px] text-accent-cool font-bold uppercase">
              12h Holds
            </span>
          </div>
        </div>

        <div className="bg-[#272220] border border-[#38302C] p-5 rounded-2xl space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-[#8A827C] font-bold block">
            TODAY&apos;S ARRIVALS
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-sans font-black text-3xl text-success">
              {todayArrivals.length}
            </span>
            <span className="text-[11px] text-success font-bold uppercase">
              Check-in from 15:00
            </span>
          </div>
        </div>

        <div className="bg-[#272220] border border-[#38302C] p-5 rounded-2xl space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-[#8A827C] font-bold block">
            IN-HOUSE GUESTS
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-sans font-black text-3xl text-white">
              {inHouseGuests.length}
            </span>
            <span className="text-[11px] text-[#C8C2BC] font-bold uppercase">
              Active Stays
            </span>
          </div>
        </div>

        <div className="bg-[#272220] border border-[#38302C] p-5 rounded-2xl space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-[#8A827C] font-bold block">
            DEPARTURES TODAY
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-sans font-black text-3xl text-accent">
              {todayDepartures.length}
            </span>
            <span className="text-[11px] text-accent font-bold uppercase">
              Until 11:00
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-[#38302C] gap-2 overflow-x-auto pb-1">
        {[
          { id: "today", label: "Today View", badge: todayArrivals.length + todayDepartures.length },
          { id: "inbox", label: "Inbox (Holds)", badge: pendingRequests.length, highlight: true },
          { id: "calendar", label: "Calendar & Blocks" },
          { id: "bookings", label: "All Bookings" },
          { id: "settings", label: "Settings & iCal Feeds" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DashboardTab)}
              className={`px-4 py-2.5 rounded-t-lg text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-colors flex items-center gap-2 border-b-2 ${
                isActive
                  ? "bg-[#272220] text-white border-accent"
                  : "text-[#8A827C] hover:text-[#C8C2BC] border-transparent"
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    tab.highlight ? "bg-accent-cool text-umber-950" : "bg-[#38302C] text-white"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: TODAY VIEW */}
      {/* ---------------------------------------------------- */}
      {activeTab === "today" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Arrivals Today */}
          <div className="bg-[#272220] border border-[#38302C] p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#38302C] pb-3">
              <h2 className="font-sans font-black text-lg uppercase tracking-tight text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-success" />
                <span>Arrivals Today ({todayArrivals.length})</span>
              </h2>
              <span className="text-xs text-success font-bold">Standard Check-in: 15:00</span>
            </div>

            {todayArrivals.length === 0 ? (
              <p className="text-xs text-[#8A827C] py-8 text-center italic">No guest arrivals scheduled for today.</p>
            ) : (
              <div className="space-y-3">
                {todayArrivals.map((b) => {
                  const room = rooms.find((r) => r.id === b.roomTypeId);
                  return (
                    <div key={b.id} className="p-4 bg-[#1E1A18] rounded-xl border border-[#38302C] space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white text-sm block">{b.guestName}</span>
                          <span className="text-[11px] text-success font-mono">{b.ref} • {room?.name}</span>
                        </div>
                        <a
                          href={buildOwnerConfirmationWhatsAppLink(b, room?.name || b.roomTypeId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-3 py-1.5 rounded text-[11px] font-bold uppercase"
                        >
                          <Phone className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                      <div className="text-xs text-[#C8C2BC] flex items-center justify-between pt-1 border-t border-[#38302C]/50">
                        <span>Check-out: {b.checkOut}</span>
                        <span className="font-bold text-white">{b.estimatedTotalAED} AED</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Departures Today */}
          <div className="bg-[#272220] border border-[#38302C] p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#38302C] pb-3">
              <h2 className="font-sans font-black text-lg uppercase tracking-tight text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" />
                <span>Departures Today ({todayDepartures.length})</span>
              </h2>
              <span className="text-xs text-accent font-bold">Standard Check-out: 11:00</span>
            </div>

            {todayDepartures.length === 0 ? (
              <p className="text-xs text-[#8A827C] py-8 text-center italic">No guest departures scheduled for today.</p>
            ) : (
              <div className="space-y-3">
                {todayDepartures.map((b) => {
                  const room = rooms.find((r) => r.id === b.roomTypeId);
                  return (
                    <div key={b.id} className="p-4 bg-[#1E1A18] rounded-xl border border-[#38302C] space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white text-sm block">{b.guestName}</span>
                          <span className="text-[11px] text-[#C8C2BC] font-mono">{b.ref} • {room?.name}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                          DEPARTING
                        </span>
                      </div>
                      <div className="text-xs text-[#8A827C] pt-1 border-t border-[#38302C]/50">
                        <span>Phone: {b.guestPhone}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: INBOX (PENDING REQUESTS WITH COUNTDOWN) */}
      {/* ---------------------------------------------------- */}
      {activeTab === "inbox" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-sans font-black text-xl uppercase tracking-tight text-white">
              PENDING REQUESTS AWAITING CONFIRMATION ({pendingRequests.length})
            </h2>
            <span className="text-xs text-accent-cool font-bold">
              12-Hour Inventory Hold
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-12 text-center bg-[#272220] border border-[#38302C] rounded-2xl space-y-2">
              <CheckCircle2 className="w-8 h-8 text-success mx-auto" />
              <p className="font-bold text-white text-sm">Inbox Zero! All booking requests have been processed.</p>
              <p className="text-xs text-[#8A827C]">New direct requests will appear here with an active hold countdown.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((b) => {
                const room = rooms.find((r) => r.id === b.roomTypeId);
                const expiryTime = b.holdExpiresAt
                  ? new Date(b.holdExpiresAt).toLocaleTimeString("en-AE", {
                      timeZone: "Asia/Dubai",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "N/A";

                return (
                  <div key={b.id} className="bg-[#272220] border-2 border-accent-cool/50 p-6 rounded-2xl space-y-4 shadow-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-lg text-white">{b.ref}</span>
                          <span className="bg-accent-cool text-umber-950 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                            HOLD ACTIVE
                          </span>
                        </div>
                        <span className="text-xs text-accent font-bold block mt-0.5">{room?.name}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-sans font-black text-white block">{b.estimatedTotalAED} AED</span>
                        <span className="text-[10px] text-[#8A827C] uppercase">{b.adults} Adults</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#1E1A18] p-3 rounded-lg border border-[#38302C]">
                      <div>
                        <span className="text-[10px] text-[#8A827C] block">DATES</span>
                        <span className="text-white font-medium">{b.checkIn} → {b.checkOut}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8A827C] block">HOLD EXPIRES</span>
                        <span className="text-accent-cool font-bold">{expiryTime} GST</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-[#38302C]">
                        <span className="text-[10px] text-[#8A827C] block">GUEST</span>
                        <span className="text-white font-bold">{b.guestName}</span> • <span className="font-mono text-[#C8C2BC]">{b.guestPhone}</span>
                      </div>
                      {b.notes && (
                        <div className="col-span-2 text-[#C8C2BC] text-[11px] italic">
                          &ldquo;{b.notes}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        disabled={actionInProgress === b.id}
                        onClick={() => handleConfirm(b.id)}
                        className="flex-1 bg-success hover:bg-success/90 text-white font-black py-2.5 px-3 rounded text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm</span>
                      </button>

                      <button
                        type="button"
                        disabled={actionInProgress === b.id}
                        onClick={() => setDeclinePromptId(b.id)}
                        className="flex-1 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-200 font-bold py-2.5 px-3 rounded text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Decline</span>
                      </button>

                      <a
                        href={buildOwnerConfirmationWhatsAppLink(b, room?.name || b.roomTypeId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: CALENDAR & BLOCKS */}
      {/* ---------------------------------------------------- */}
      {activeTab === "calendar" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-sans font-black text-xl uppercase tracking-tight text-white">
                INVENTORY BLOCKS &amp; CALENDAR MANAGEMENT
              </h2>
              <p className="text-xs text-[#8A827C]">
                Add manual maintenance blocks or inspect imported OTA calendar blocks.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowBlockModal(true)}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-strong text-umber-950 font-black px-4 py-2 rounded-lg text-xs uppercase tracking-wider shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Manual Block</span>
            </button>
          </div>

          {/* Active Blocks List */}
          <div className="bg-[#272220] border border-[#38302C] p-6 rounded-2xl space-y-4">
            <h3 className="font-sans font-bold text-sm uppercase text-white tracking-wide">
              Active Calendar Blocks ({blocks.length})
            </h3>

            {blocks.length === 0 ? (
              <p className="text-xs text-[#8A827C] py-4 text-center italic">No manual or imported calendar blocks currently active.</p>
            ) : (
              <div className="space-y-2">
                {blocks.map((blk) => {
                  const room = rooms.find((r) => r.id === blk.roomTypeId);
                  return (
                    <div
                      key={blk.id}
                      className="p-3.5 bg-[#1E1A18] border border-[#38302C] rounded-xl flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{room?.name || blk.roomTypeId}</span>
                          <span className="bg-[#38302C] text-[#C8C2BC] text-[10px] font-bold px-2 py-0.5 rounded">
                            {blk.units} {blk.units === 1 ? "unit" : "units"}
                          </span>
                          <span className="text-[10px] text-accent uppercase font-mono">
                            {blk.source}
                          </span>
                        </div>
                        <span className="text-[#8A827C] block">
                          Dates: <strong className="text-white">{blk.startDate} to {blk.endDate}</strong> • Reason: {blk.reason}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteBlock(blk.id)}
                        className="text-red-400 hover:text-red-300 p-2 border border-red-900/50 rounded hover:bg-red-950/40 transition-colors"
                        title="Remove Block"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 4: ALL BOOKINGS TABLE */}
      {/* ---------------------------------------------------- */}
      {activeTab === "bookings" && (
        <div className="space-y-4">
          {/* Filter / Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8A827C] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference, guest name, phone..."
                className="w-full bg-[#272220] border border-[#38302C] pl-10 pr-4 py-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-accent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#272220] border border-[#38302C] px-3 py-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-accent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Holds</option>
              <option value="confirmed">Confirmed</option>
              <option value="declined">Declined</option>
              <option value="expired">Expired Holds</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="bg-[#272220] border border-[#38302C] px-3 py-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-accent"
            >
              <option value="all">All Spaces</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Bookings Table */}
          <div className="bg-[#272220] border border-[#38302C] rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#C8C2BC]">
                <thead className="bg-[#1E1A18] text-[#8A827C] uppercase tracking-wider font-bold border-b border-[#38302C]">
                  <tr>
                    <th className="py-3 px-4">Ref</th>
                    <th className="py-3 px-4">Guest</th>
                    <th className="py-3 px-4">Space</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#38302C]">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#8A827C] italic">
                        No bookings match your search filters.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => {
                      const room = rooms.find((r) => r.id === b.roomTypeId);
                      return (
                        <tr key={b.id} className="hover:bg-[#1E1A18]/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-white">{b.ref}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-white block">{b.guestName}</span>
                            <span className="text-[11px] text-[#8A827C] block font-mono">{b.guestPhone}</span>
                          </td>
                          <td className="py-3.5 px-4">{room?.name || b.roomTypeId}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-white block">{b.checkIn} → {b.checkOut}</span>
                            <span className="text-[10px] text-[#8A827C]">{b.adults} Adults</span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white">{b.estimatedTotalAED} AED</td>
                          <td className="py-3.5 px-4">
                            {b.status === "confirmed" && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded">
                                Confirmed
                              </span>
                            )}
                            {b.status === "pending" && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-cool bg-accent-cool/10 px-2 py-0.5 rounded">
                                Pending Hold
                              </span>
                            )}
                            {b.status === "declined" && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-300 bg-red-950/50 px-2 py-0.5 rounded">
                                Declined
                              </span>
                            )}
                            {b.status === "expired" && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                                Expired
                              </span>
                            )}
                            {b.status === "cancelled" && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                                Cancelled
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={buildOwnerConfirmationWhatsAppLink(b, room?.name || b.roomTypeId)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-bold"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => handleBlockPhone(b.guestPhone)}
                                className="text-[10px] text-rose-400 hover:text-rose-300 border border-rose-900/40 hover:bg-rose-950/40 px-2 py-0.5 rounded transition-colors"
                                title={`Block ${b.guestPhone}`}
                              >
                                Block
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 5: SETTINGS & ICAL FEEDS */}
      {/* ---------------------------------------------------- */}
      {activeTab === "settings" && (
        <div className="space-y-8">
          {/* Inbound iCal Feeds */}
          <div className="bg-[#272220] border border-[#38302C] p-6 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-sans font-black text-lg uppercase tracking-tight text-white">
                  INBOUND ICAL CALENDAR FEEDS
                </h2>
                <p className="text-xs text-[#8A827C]">
                  Import bookings from external platforms to block dates. External calendars refresh on their own schedule.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSyncAllFeeds}
                disabled={actionInProgress === "sync-all" || icalFeeds.length === 0}
                className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-strong text-umber-950 font-bold px-3.5 py-2 rounded-lg text-xs uppercase transition-colors shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${actionInProgress === "sync-all" ? "animate-spin" : ""}`} />
                <span>{actionInProgress === "sync-all" ? "Syncing All..." : "Sync All Feeds"}</span>
              </button>
            </div>

            {/* Existing Feeds */}
            <div className="space-y-3">
              {icalFeeds.map((feed) => {
                const room = rooms.find((r) => r.id === feed.roomTypeId);
                return (
                  <div key={feed.id} className="p-4 bg-[#1E1A18] border border-[#38302C] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{feed.label}</span>
                        <span className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded">
                          {room?.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#8A827C] block truncate max-w-md mt-0.5 font-mono">
                        {feed.url}
                      </span>
                      <span className="text-[10px] text-[#C8C2BC] block mt-1">
                        Last Synced: {feed.lastSyncedAt ? new Date(feed.lastSyncedAt).toLocaleString() : "Never"} • Status: {feed.lastStatus || "Pending"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSyncFeed(feed.id)}
                        disabled={actionInProgress === `sync-${feed.id}`}
                        className="bg-[#38302C] hover:bg-[#4A403A] text-white px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors"
                      >
                        {actionInProgress === `sync-${feed.id}` ? "Syncing..." : "Sync Now"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFeed(feed.id)}
                        className="text-red-400 hover:text-red-300 p-1.5"
                        title="Delete feed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Feed Form */}
            <form onSubmit={handleAddFeed} className="pt-4 border-t border-[#38302C] space-y-4">
              <span className="font-bold text-xs uppercase tracking-wider text-white block">Add Inbound iCal Feed</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Feed Label (e.g. Airbnb Single Pods)"
                  value={newFeedLabel}
                  onChange={(e) => setNewFeedLabel(e.target.value)}
                  className="bg-[#1E1A18] border border-[#38302C] text-white text-xs px-3.5 py-2 rounded-lg"
                  required
                />
                <input
                  type="url"
                  placeholder="Feed URL (https://...)"
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                  className="bg-[#1E1A18] border border-[#38302C] text-white text-xs px-3.5 py-2 rounded-lg"
                  required
                />
                <select
                  value={newFeedRoomId}
                  onChange={(e) => setNewFeedRoomId(e.target.value)}
                  className="bg-[#1E1A18] border border-[#38302C] text-white text-xs px-3 py-2 rounded-lg"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="bg-accent hover:bg-accent-strong text-umber-950 text-xs font-black uppercase px-4 py-2 rounded-lg"
              >
                Connect Feed
              </button>
            </form>
          </div>

          {/* Outbound iCal Feeds (Export URLs) */}
          <div className="bg-[#272220] border border-[#38302C] p-6 rounded-2xl space-y-4">
            <div>
              <h2 className="font-sans font-black text-lg uppercase tracking-tight text-white">
                OUTBOUND ICAL EXPORT FEEDS
              </h2>
              <p className="text-xs text-[#8A827C]">
                Calendar feeds can be shared with other platforms. Other platforms refresh these on their own schedule.
                Strict Privacy: All feeds omit guest PII and show events solely as &ldquo;Booked&rdquo;.
              </p>
            </div>

            <div className="space-y-3">
              {roomTypes.map((r) => {
                const token = "rizq_demo_ical_token_secure_2026";
                const url = typeof window !== "undefined"
                  ? `${window.location.origin}/api/ical/${r.slug}.ics?token=${token}`
                  : `/api/ical/${r.slug}.ics?token=${token}`;

                return (
                  <div key={r.id} className="p-4 bg-[#1E1A18] border border-[#38302C] rounded-xl flex items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="font-bold text-white block">{r.name}</span>
                      <span className="font-mono text-[11px] text-[#8A827C] block truncate max-w-lg mt-0.5">
                        {url}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(url, r.id)}
                      className="inline-flex items-center gap-1.5 bg-[#38302C] hover:bg-[#4A403A] text-white px-3 py-1.5 rounded text-xs font-bold transition-colors shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedFeedUrl === r.id ? "COPIED!" : "COPY FEED URL"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Manual Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#272220] border-2 border-[#38302C] p-6 sm:p-8 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#38302C] pb-3">
              <h3 className="font-sans font-black text-lg uppercase text-white">ADD CALENDAR BLOCK</h3>
              <button
                type="button"
                onClick={() => setShowBlockModal(false)}
                className="text-[#8A827C] hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddBlock} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#C8C2BC] font-bold block">Space / Room</label>
                <select name="roomTypeId" className="w-full bg-[#1E1A18] border border-[#38302C] text-white p-2.5 rounded-lg">
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#C8C2BC] font-bold block">Start Date</label>
                  <input type="date" name="startDate" defaultValue={todayStr} required className="w-full bg-[#1E1A18] border border-[#38302C] text-white p-2.5 rounded-lg" />
                </div>
                <div className="space-y-1">
                  <label className="text-[#C8C2BC] font-bold block">End Date (Exclusive)</label>
                  <input type="date" name="endDate" defaultValue={todayStr} required className="w-full bg-[#1E1A18] border border-[#38302C] text-white p-2.5 rounded-lg" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#C8C2BC] font-bold block">Units to Block</label>
                <input type="number" name="units" defaultValue={1} min={1} required className="w-full bg-[#1E1A18] border border-[#38302C] text-white p-2.5 rounded-lg" />
              </div>

              <div className="space-y-1">
                <label className="text-[#C8C2BC] font-bold block">Reason / Note</label>
                <input type="text" name="reason" placeholder="e.g. Scheduled deep maintenance" required className="w-full bg-[#1E1A18] border border-[#38302C] text-white p-2.5 rounded-lg" />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 border border-[#38302C] text-[#C8C2BC] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent hover:bg-accent-strong text-umber-950 font-black rounded-lg uppercase tracking-wider"
                >
                  Create Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decline Reason Modal */}
      {declinePromptId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#272220] border-2 border-red-800 p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-sans font-black text-base uppercase text-white">Decline Booking Request</h3>
            <p className="text-xs text-[#C8C2BC]">
              Provide a reason for declining this request. The inventory hold will be released immediately.
            </p>
            <input
              type="text"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g. Conflicted dates, property private buyout"
              className="w-full bg-[#1E1A18] border border-[#38302C] text-white text-xs p-2.5 rounded-lg"
            />
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeclinePromptId(null)}
                className="px-3 py-1.5 border border-[#38302C] text-[#C8C2BC] rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDecline(declinePromptId)}
                className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white font-bold rounded"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
