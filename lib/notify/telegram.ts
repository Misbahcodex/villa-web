/**
 * Rizq Luxurious Villa — Owner Telegram Bot Notifications & Webhook Handler
 *
 * NOTE: Failures never block the booking flow.
 */

import { BookingRecord } from "@/types";

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const ownerChatId = process.env.TELEGRAM_CHAT_ID;
const isTelegramEnabled = process.env.ENABLE_TELEGRAM === "true" && Boolean(botToken && ownerChatId);

export interface TelegramInlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

/**
 * Sends a Telegram notification with inline action buttons to the property owner.
 */
export async function sendOwnerTelegramBookingNotification(
  booking: BookingRecord,
  roomName: string,
  adminBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  if (!isTelegramEnabled || !botToken || !ownerChatId) {
    return { success: false, error: "Telegram disabled or credentials missing" };
  }

  const holdExpiryText = booking.holdExpiresAt
    ? new Date(booking.holdExpiresAt).toLocaleTimeString("en-AE", {
        timeZone: "Asia/Dubai",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "12h";

  const messageText = `
🛎 *NEW BOOKING REQUEST*
*Ref:* \`${booking.ref}\`
*Space:* ${escapeMarkdown(roomName)}
*Dates:* ${booking.checkIn} → ${booking.checkOut}
*Guests:* ${booking.adults} Adults${booking.children > 0 ? `, ${booking.children} Kids` : ""}
*Total:* *${booking.estimatedTotalAED} AED*

👤 *Guest:* ${escapeMarkdown(booking.guestName)}
📞 *Phone:* \`${booking.guestPhone}\`
${booking.notes ? `📝 *Notes:* _${escapeMarkdown(booking.notes)}_\n` : ""}
⏳ *Hold Expires:* ${holdExpiryText} GST
`.trim();

  const inlineKeyboard = [
    [
      { text: "✅ Confirm", callback_data: `confirm:${booking.id}` },
      { text: "❌ Decline", callback_data: `decline:${booking.id}` },
    ],
    [
      { text: "🔗 Open Dashboard", url: `${adminBaseUrl}/admin` },
    ],
  ];

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: ownerChatId,
        text: messageText,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      return { success: false, error: data.description || "Telegram API error" };
    }

    return { success: true, messageId: data.result?.message_id };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Answers a Telegram callback query.
 */
export async function answerTelegramCallbackQuery(callbackQueryId: string, text: string): Promise<void> {
  if (!botToken) return;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: true,
      }),
    });
  } catch {
    // Non-blocking
  }
}

/**
 * Edits the Telegram message text to reflect confirmed/declined status.
 */
export async function editTelegramMessage(
  chatId: number | string,
  messageId: number,
  newText: string
): Promise<void> {
  if (!botToken) return;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: newText,
        parse_mode: "Markdown",
      }),
    });
  } catch {
    // Non-blocking
  }
}

/**
 * Sends a halfway reminder to the owner via Telegram (e.g. at 6 hours for a 12h hold).
 */
export async function sendOwnerTelegramHalfwayReminder(
  booking: BookingRecord,
  roomName: string,
  adminBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  if (!isTelegramEnabled || !botToken || !ownerChatId) {
    return { success: false, error: "Telegram disabled or credentials missing" };
  }

  const holdExpiryText = booking.holdExpiresAt
    ? new Date(booking.holdExpiresAt).toLocaleTimeString("en-AE", {
        timeZone: "Asia/Dubai",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "approx 6h left";

  const messageText = `
⚠️ *HOLD HALFWAY REMINDER (6h Remaining)*
*Ref:* \`${booking.ref}\`
*Space:* ${escapeMarkdown(roomName)}
*Guest:* ${escapeMarkdown(booking.guestName)} (\`${booking.guestPhone}\`)
*Dates:* ${booking.checkIn} → ${booking.checkOut}
*Expires:* ${holdExpiryText} GST
`.trim();

  const inlineKeyboard = [
    [
      { text: "✅ Confirm", callback_data: `confirm:${booking.id}` },
      { text: "❌ Decline", callback_data: `decline:${booking.id}` },
    ],
    [
      { text: "🔗 Open Dashboard", url: `${adminBaseUrl}/admin` },
    ],
  ];

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: ownerChatId,
        text: messageText,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: inlineKeyboard },
      }),
    });
    const data = await res.json();
    return { success: data.ok, messageId: data.result?.message_id };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, "\\$&");
}
