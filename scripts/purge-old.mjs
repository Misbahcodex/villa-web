import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storePath = path.join(__dirname, "..", "data", "store.json");

const RETENTION_DAYS = parseInt(process.env.RETENTION_DAYS || "90", 10);
const cutoffTimestamp = Date.now() - RETENTION_DAYS * 24 * 3600 * 1000;

try {
  if (fs.existsSync(storePath)) {
    const content = fs.readFileSync(storePath, "utf-8");
    const data = JSON.parse(content);

    const initialCount = data.bookings?.length || 0;
    data.bookings = (data.bookings || []).filter((b) => {
      const createdAt = new Date(b.createdAt).getTime();
      return createdAt >= cutoffTimestamp;
    });

    const purged = initialCount - data.bookings.length;

    data.auditLogs = data.auditLogs || [];
    data.auditLogs.unshift({
      id: `log-purge-${Date.now()}`,
      actor: "system-cli",
      action: "purge_old_bookings",
      meta: { retentionDays: RETENTION_DAYS, purgedCount: purged },
      createdAt: new Date().toISOString(),
    });

    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`✓ Purge complete: Removed ${purged} bookings older than ${RETENTION_DAYS} days.`);
  } else {
    console.log("No store file found. Nothing to purge.");
  }
} catch (err) {
  console.error("Purge error:", err);
  process.exit(1);
}
