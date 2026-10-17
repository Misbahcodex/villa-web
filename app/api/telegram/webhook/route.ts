import { NextRequest, NextResponse } from "next/server";
import { confirmBooking, declineBooking, getBookingById, addAuditLog } from "@/lib/db/store";
import { answerTelegramCallbackQuery, editTelegramMessage } from "@/lib/notify/telegram";
import { dispatchBookingConfirmedNotification } from "@/lib/notify";

const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || "rizq_telegram_webhook_secret_2026";
const OWNER_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(req: NextRequest) {
  // 1. Verify Secret Token Header
  const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");
  if (secretHeader !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized Telegram webhook secret" }, { status: 401 });
  }

  let body: {
    callback_query?: {
      id: string;
      data?: string;
      message?: {
        message_id: number;
        chat: { id: number | string };
        text?: string;
      };
      from?: { id: number | string; first_name?: string };
    };
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const query = body.callback_query;
  if (!query || !query.data || !query.message) {
    // Standard update or message, ignore
    return NextResponse.json({ ok: true });
  }

  // 2. Validate Chat ID (Only accept from the designated owner chat)
  const chatId = String(query.message.chat.id);
  const allowedOwnerChat = OWNER_CHAT_ID ? String(OWNER_CHAT_ID) : "123456789";
  if (chatId !== allowedOwnerChat) {
    await answerTelegramCallbackQuery(query.id, "Unauthorized user");
    return NextResponse.json({ error: "Forbidden chat" }, { status: 403 });
  }

  const [action, bookingId] = query.data.split(":");
  const booking = await getBookingById(bookingId);

  if (!booking) {
    await answerTelegramCallbackQuery(query.id, "Booking not found");
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (action === "confirm") {
    const updated = await confirmBooking(booking.id, "telegram-bot", {
      fromUser: query.from?.first_name || "owner",
    });

    if (updated) {
      await answerTelegramCallbackQuery(query.id, `Booking ${booking.ref} Confirmed!`);
      const confirmedText = `✅ *BOOKING CONFIRMED*\nRef: \`${booking.ref}\`\nGuest: ${booking.guestName}\nDates: ${booking.checkIn} to ${booking.checkOut}\nTotal: ${booking.estimatedTotalAED} AED\n\nConfirmed via Telegram by owner.`;
      await editTelegramMessage(query.message.chat.id, query.message.message_id, confirmedText);
      await dispatchBookingConfirmedNotification(updated);
    }
  } else if (action === "decline") {
    const updated = await declineBooking(booking.id, "Declined via Telegram bot by owner", "telegram-bot");
    if (updated) {
      await answerTelegramCallbackQuery(query.id, `Booking ${booking.ref} Declined.`);
      const declinedText = `❌ *BOOKING DECLINED*\nRef: \`${booking.ref}\`\nGuest: ${booking.guestName}\nDates: ${booking.checkIn} to ${booking.checkOut}\n\nDeclined via Telegram. Inventory released.`;
      await editTelegramMessage(query.message.chat.id, query.message.message_id, declinedText);
    }
  }

  return NextResponse.json({ ok: true });
}
