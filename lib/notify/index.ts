/**
 * Rizq Luxurious Villa — Notification Dispatcher
 *
 * Fans out notifications across enabled channels (Email, Telegram) asynchronously.
 * Never throws errors that block guest bookings.
 * Logs all notification attempts and outcomes to audit_log.
 */

import { BookingRecord } from "@/types";
import { rooms } from "@/data/rooms";
import { sendOwnerNewBookingEmail, sendGuestBookingConfirmedEmail } from "./email";
import { sendOwnerTelegramBookingNotification } from "./telegram";
import { addAuditLog } from "@/lib/db/store";

export async function dispatchNewBookingNotifications(
  booking: BookingRecord,
  adminBaseUrl?: string
): Promise<void> {
  const room = rooms.find((r) => r.id === booking.roomTypeId);
  const roomName = room ? room.name : booking.roomTypeId;

  // 1. Dispatch Email to Owner asynchronously
  sendOwnerNewBookingEmail(booking, roomName, adminBaseUrl)
    .then(async (res) => {
      if (res.success) {
        await addAuditLog({
          bookingId: booking.id,
          actor: "system",
          action: "notification_email_sent",
          meta: { recipient: "owner", emailId: res.id },
        });
      } else if (res.error && !res.error.includes("disabled")) {
        await addAuditLog({
          bookingId: booking.id,
          actor: "system",
          action: "notification_email_failed",
          meta: { error: res.error },
        });
      }
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("[Notify Email Dispatch Error]:", err);
    });

  // 2. Dispatch Telegram to Owner asynchronously
  sendOwnerTelegramBookingNotification(booking, roomName, adminBaseUrl)
    .then(async (res) => {
      if (res.success) {
        await addAuditLog({
          bookingId: booking.id,
          actor: "system",
          action: "notification_telegram_sent",
          meta: { recipient: "owner", messageId: res.messageId },
        });
      } else if (res.error && !res.error.includes("disabled")) {
        await addAuditLog({
          bookingId: booking.id,
          actor: "system",
          action: "notification_telegram_failed",
          meta: { error: res.error },
        });
      }
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("[Notify Telegram Dispatch Error]:", err);
    });
}

export async function dispatchBookingConfirmedNotification(booking: BookingRecord): Promise<void> {
  const room = rooms.find((r) => r.id === booking.roomTypeId);
  const roomName = room ? room.name : booking.roomTypeId;

  if (booking.guestEmail) {
    sendGuestBookingConfirmedEmail(booking, roomName)
      .then(async (res) => {
        if (res.success) {
          await addAuditLog({
            bookingId: booking.id,
            actor: "system",
            action: "guest_confirmation_email_sent",
            meta: { guestEmailMasked: booking.guestEmail?.slice(0, 3) + "***" },
          });
        }
      })
      .catch(() => {
        // Non-blocking
      });
  }
}

export async function dispatchHalfwayReminderNotification(
  booking: BookingRecord,
  adminBaseUrl?: string
): Promise<void> {
  const room = rooms.find((r) => r.id === booking.roomTypeId);
  const roomName = room ? room.name : booking.roomTypeId;

  // Import dynamic or direct helper
  const { sendOwnerHoldHalfwayReminderEmail } = await import("./email");
  const { sendOwnerTelegramHalfwayReminder } = await import("./telegram");

  sendOwnerHoldHalfwayReminderEmail(booking, roomName, adminBaseUrl).catch(() => {});
  sendOwnerTelegramHalfwayReminder(booking, roomName, adminBaseUrl).catch(() => {});
}
