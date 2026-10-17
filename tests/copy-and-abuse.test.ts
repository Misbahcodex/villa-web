import { describe, it, expect, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  normalizePhone,
  blockPhoneNumber,
  unblockPhoneNumber,
  isPhoneNumberBlocked,
  getBlockedPhoneNumbers,
  createBookingRequest,
  clearDemoData,
  getBookings,
  getBookingByRef,
} from "@/lib/db/store";
import { checkRateLimit } from "@/lib/rateLimit";

describe("Copy & Term Integrity Suite", () => {
  const publicDirs = [
    path.join(process.cwd(), "app"),
    path.join(process.cwd(), "components"),
  ];

  function getFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        getFiles(fullPath, fileList);
      } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
        fileList.push(fullPath);
      }
    }
    return fileList;
  }

  const allFiles = publicDirs.flatMap((dir) => (fs.existsSync(dir) ? getFiles(dir) : []));

  it("ensures public code does not contain banned soundproof claim", () => {
    for (const file of allFiles) {
      const content = fs.readFileSync(file, "utf-8");
      expect(content.toLowerCase()).not.toContain("soundproof");
    }
  });

  it("ensures public code does not contain ergonomic ventilation or fold-down tray", () => {
    for (const file of allFiles) {
      const content = fs.readFileSync(file, "utf-8");
      expect(content.toLowerCase()).not.toContain("ergonomic ventilation");
      expect(content.toLowerCase()).not.toContain("fold-down tray");
    }
  });

  it("ensures public code does not contain unverified queen or king bed claims", () => {
    const bedRegex = /\b(queen|king)\b/i;
    for (const file of allFiles) {
      // Exclude admin mock/feed references or variable names if any
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        // Skip imports, paths, or comments
        if (line.includes("import ") || line.includes("//")) continue;
        expect(line).not.toMatch(bedRegex);
      }
    }
  });

  it("ensures public code does not contain unverified square meter claims", () => {
    const sqmRegex = /\d+\s*(m²|sqm)/i;
    for (const file of allFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        if (line.includes("//")) continue;
        expect(line).not.toMatch(sqmRegex);
      }
    }
  });

  it("ensures public code does not contain courtyard claims", () => {
    for (const file of allFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        if (line.includes("//")) continue;
        expect(line.toLowerCase()).not.toContain("courtyard");
      }
    }
  });

  it("ensures public code does not contain hardcoded rizqvilla.com domain", () => {
    for (const file of allFiles) {
      const content = fs.readFileSync(file, "utf-8");
      expect(content).not.toContain("https://rizqvilla.com");
      expect(content).not.toContain("http://rizqvilla.com");
    }
  });

  it("ensures public code does not contain obsolete blossom or coral palette references", () => {
    const bannedColors = ["#f15c3b", "#d94a2a", "#b5d973", "#e4c3c3", "#e8dcb8", "#f6cd48"];
    for (const file of allFiles) {
      // Skip test files or svg files
      if (file.includes(".test.") || file.includes("images.generated")) continue;
      const content = fs.readFileSync(file, "utf-8").toLowerCase();
      for (const color of bannedColors) {
        expect(content, `File ${file} should not contain ${color}`).not.toContain(color);
      }
    }
  });
});

describe("Abuse Protection & Rate Limiting Suite", () => {
  beforeEach(async () => {
    await clearDemoData();
  });

  it("normalizes phone numbers accurately across symbols and formatting variants", () => {
    expect(normalizePhone("+971 50 123 4567")).toBe("971501234567");
    expect(normalizePhone("00971-50-123-4567")).toBe("00971501234567");
    expect(normalizePhone("971501234567")).toBe("971501234567");
  });

  it("allows blocking and unblocking phone numbers by admin", async () => {
    const phone = "+971 50 999 8888";
    expect(isPhoneNumberBlocked(phone)).toBe(false);

    await blockPhoneNumber(phone, "admin_test");
    expect(isPhoneNumberBlocked(phone)).toBe(true);
    expect(isPhoneNumberBlocked("971509998888")).toBe(true);

    const blockedList = await getBlockedPhoneNumbers();
    expect(blockedList).toContain(normalizePhone(phone));

    await unblockPhoneNumber(phone, "admin_test");
    expect(isPhoneNumberBlocked(phone)).toBe(false);
  });

  it("rejects booking creation if phone number is blocked", async () => {
    const phone = "+971 50 888 7777";
    await blockPhoneNumber(phone);

    const result = await createBookingRequest({
      roomTypeId: "premium-single-capsule",
      checkIn: "2026-12-01",
      checkOut: "2026-12-05",
      adults: 1,
      children: 0,
      guestName: "Blocked Spammer",
      guestPhone: phone,
      estimatedTotalAED: 600,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("BLOCKED");
    }
  });

  it("enforces maximum 2 active holds per normalized phone number", async () => {
    const phone = "+971 50 111 2222";

    // 1st hold: succeeds
    const b1 = await createBookingRequest({
      roomTypeId: "premium-single-capsule",
      checkIn: "2026-12-01",
      checkOut: "2026-12-03",
      adults: 1,
      children: 0,
      guestName: "Active Guest",
      guestPhone: phone,
      estimatedTotalAED: 300,
    });
    expect(b1.success).toBe(true);

    // 2nd hold: succeeds (different dates)
    const b2 = await createBookingRequest({
      roomTypeId: "premium-single-capsule",
      checkIn: "2026-12-05",
      checkOut: "2026-12-07",
      adults: 1,
      children: 0,
      guestName: "Active Guest",
      guestPhone: "971501112222", // Unformatted variant
      estimatedTotalAED: 300,
    });
    expect(b2.success).toBe(true);

    // 3rd hold: rejected due to limit exceeded
    const b3 = await createBookingRequest({
      roomTypeId: "premium-single-capsule",
      checkIn: "2026-12-10",
      checkOut: "2026-12-12",
      adults: 1,
      children: 0,
      guestName: "Active Guest",
      guestPhone: "+971-50-111-2222",
      estimatedTotalAED: 300,
    });
    expect(b3.success).toBe(false);
    if (!b3.success) {
      expect(b3.code).toBe("LIMIT_EXCEEDED");
    }
  });

  it("enforces rate limit of 3 booking submissions per 10 minutes per IP", () => {
    const testIp = "192.168.1.99";
    const windowMs = 10 * 60 * 1000;

    const r1 = checkRateLimit(`test-book:${testIp}`, 3, windowMs);
    const r2 = checkRateLimit(`test-book:${testIp}`, 3, windowMs);
    const r3 = checkRateLimit(`test-book:${testIp}`, 3, windowMs);
    const r4 = checkRateLimit(`test-book:${testIp}`, 3, windowMs);

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(r3.success).toBe(true);
    expect(r4.success).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it("enforces rate limit of 5 status lookup attempts per 15 minutes per ref and IP", () => {
    const testRef = "RZQ-TEST123";
    const windowMs = 15 * 60 * 1000;

    for (let i = 1; i <= 5; i++) {
      const res = checkRateLimit(`test-lookup:${testRef}`, 5, windowMs);
      expect(res.success).toBe(true);
    }

    const blockedAttempt = checkRateLimit(`test-lookup:${testRef}`, 5, windowMs);
    expect(blockedAttempt.success).toBe(false);
  });
});
