import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/adminAuth";
import { getBookings } from "@/lib/db/store";
import { rooms } from "@/data/rooms";
import { getNightsBetween } from "@/lib/availability";

export async function GET() {
  if (!verifyAdminSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await getBookings();

  const headers = [
    "Reference",
    "Room / Space",
    "Check In",
    "Check Out",
    "Nights",
    "Adults",
    "Children",
    "Guest Name",
    "Phone",
    "Email",
    "Status",
    "Estimated Total (AED)",
    "Hold Expires (GST)",
    "Source",
    "Created Date",
    "Special Requests",
  ];

  const escapeCsv = (str?: string | number | null) => {
    if (str === undefined || str === null) return '""';
    const clean = String(str).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = bookings.map((b) => {
    const room = rooms.find((r) => r.id === b.roomTypeId);
    const roomName = room ? room.name : b.roomTypeId;
    const nights = getNightsBetween(b.checkIn, b.checkOut).length;

    return [
      escapeCsv(b.ref),
      escapeCsv(roomName),
      escapeCsv(b.checkIn),
      escapeCsv(b.checkOut),
      nights,
      b.adults,
      b.children,
      escapeCsv(b.guestName),
      escapeCsv(b.guestPhone),
      escapeCsv(b.guestEmail || ""),
      escapeCsv(b.status),
      b.estimatedTotalAED,
      escapeCsv(b.holdExpiresAt || "N/A"),
      escapeCsv(b.source),
      escapeCsv(b.createdAt),
      escapeCsv(b.notes || ""),
    ];
  });

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const filename = `rizq_villa_bookings_${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
