import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storePath = path.join(__dirname, "..", "data", "store.json");

const roomTypes = [
  {
    id: "premium-single-capsule",
    slug: "single-capsule",
    name: "Premium Single Capsule Pod",
    unitsTotal: 8,
    baseRateAED: 180,
    maxGuests: 1,
  },
  {
    id: "deluxe-double-capsule",
    slug: "double-capsule",
    name: "Deluxe Double Capsule Pod",
    unitsTotal: 6,
    baseRateAED: 260,
    maxGuests: 2,
  },
  {
    id: "executive-private-suite",
    slug: "private-suite",
    name: "Executive Private Suite",
    unitsTotal: 2,
    baseRateAED: 540,
    maxGuests: 2,
  },
];

const emptyStoreData = {
  roomTypes,
  bookings: [],
  blocks: [],
  icalFeeds: [],
  auditLogs: [
    {
      id: `log-cleared-${Date.now()}`,
      actor: "system",
      action: "seed_cleared",
      meta: { timestamp: new Date().toISOString() },
      createdAt: new Date().toISOString(),
    },
  ],
};

fs.mkdirSync(path.dirname(storePath), { recursive: true });
fs.writeFileSync(storePath, JSON.stringify(emptyStoreData, null, 2), "utf-8");
console.log("✓ Seed clear completed: All demo bookings, calendar blocks, and feeds removed.");
