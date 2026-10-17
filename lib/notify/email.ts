/**
 * Rizq Luxurious Villa — Owner & Guest Email Notifications (Resend)
 *
 * NOTE: Failures never block the booking flow. PII is masked in console logs.
 */

import { Resend } from "resend";
import { BookingRecord } from "@/types";
import { siteConfig } from "@/data/site";

const resendApiKey = process.env.RESEND_API_KEY;
const isEmailEnabled = process.env.ENABLE_EMAIL === "true" && Boolean(resendApiKey);
const ownerEmail = process.env.OWNER_EMAIL || "manager@example.com";
const fromEmail = process.env.NOTIFICATION_FROM_EMAIL || "reservations@resend.dev";

const resend = isEmailEnabled && resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Redacts phone numbers and emails for safe logging.
 */
export function maskSensitive(text?: string | null): string {
  if (!text) return "[none]";
  if (text.includes("@")) {
    const [user, domain] = text.split("@");
    return `${user.slice(0, 2)}***@${domain}`;
  }
  return text.slice(0, 4) + " *** " + text.slice(-3);
}

/**
 * Sends a new booking request notification to the property owner.
 * Full guest contact details are provided to the owner.
 */
export async function sendOwnerNewBookingEmail(
  booking: BookingRecord,
  roomName: string,
  adminBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!isEmailEnabled || !resend) {
    return { success: false, error: "Email notifications disabled or RESEND_API_KEY missing" };
  }

  const adminLink = `${adminBaseUrl}/admin`;
  const holdExpiryText = booking.holdExpiresAt
    ? new Date(booking.holdExpiresAt).toLocaleString("en-AE", { timeZone: "Asia/Dubai" })
    : "12 Hours from request";

  const addonsList = booking.addons && booking.addons.length > 0
    ? booking.addons.map((a) => `<li>${a.name} (${a.priceConfirmed ? a.priceAED + " AED" : "Price on request"})</li>`).join("")
    : "<li>None</li>";

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #1C1816; color: #E9E6E7; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #262120; border: 1px solid #352E2C; border-radius: 8px; padding: 32px;">
    <div style="border-bottom: 2px solid #AB978C; padding-bottom: 16px; margin-bottom: 24px;">
      <h1 style="color: #AB978C; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;">New Booking Request</h1>
      <p style="color: #6B7C98; margin: 4px 0 0 0; font-size: 14px; font-weight: bold;">Reference: ${booking.ref}</p>
    </div>

    <div style="background-color: #1C1816; border-left: 4px solid #AB978C; padding: 12px 16px; margin-bottom: 24px; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #AB978C; font-weight: bold;">⚡ 12-Hour Inventory Hold Active</p>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #E9E6E7;">Hold expires at: <strong>${holdExpiryText} GST</strong>. Confirm in dashboard or inventory releases.</p>
    </div>

    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 8px 0; color: #7B7F8A; width: 140px;">Space:</td>
        <td style="padding: 8px 0; color: #E9E6E7; font-weight: bold;">${roomName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #7B7F8A;">Dates:</td>
        <td style="padding: 8px 0; color: #E9E6E7;">${booking.checkIn} to ${booking.checkOut}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #7B7F8A;">Guests:</td>
        <td style="padding: 8px 0; color: #E9E6E7;">${booking.adults} Adults ${booking.children > 0 ? `, ${booking.children} Children` : ""}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #7B7F8A;">Estimated Total:</td>
        <td style="padding: 8px 0; color: #AB978C; font-weight: bold; font-size: 16px;">${booking.estimatedTotalAED} AED</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #7B7F8A;">Guest Name:</td>
        <td style="padding: 8px 0; color: #E9E6E7;">${booking.guestName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #7B7F8A;">Guest Phone:</td>
        <td style="padding: 8px 0; color: #E9E6E7;">${booking.guestPhone}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #7B7F8A;">Guest Email:</td>
        <td style="padding: 8px 0; color: #E9E6E7;">${booking.guestEmail || "[Not provided]"}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #7B7F8A;">Special Requests:</td>
        <td style="padding: 8px 0; color: #E9E6E7;">${booking.notes || "None"}</td>
      </tr>
    </table>

    <div style="margin-bottom: 24px;">
      <p style="font-size: 13px; font-weight: bold; color: #7B7F8A; margin-bottom: 8px;">Requested Add-ons:</p>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #E9E6E7;">
        ${addonsList}
      </ul>
    </div>

    <div style="text-align: center; margin-top: 32px; border-top: 1px solid #352E2C; padding-top: 24px;">
      <a href="${adminLink}" style="display: inline-block; background-color: #AB978C; color: #1C1816; font-weight: bold; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">
        Open Operations Dashboard &rarr;
      </a>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: ownerEmail,
      subject: `[New Request] ${booking.ref} — ${roomName} (${booking.checkIn} to ${booking.checkOut})`,
      html,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, id: result.data?.id };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

/**
 * Sends a reminder email to the owner at the halfway point of the hold (6h for 12h hold).
 */
export async function sendOwnerHoldHalfwayReminderEmail(
  booking: BookingRecord,
  roomName: string,
  adminBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!isEmailEnabled || !resend) {
    return { success: false, error: "Email notifications disabled or RESEND_API_KEY missing" };
  }

  const adminLink = `${adminBaseUrl}/admin`;
  const holdExpiryText = booking.holdExpiresAt
    ? new Date(booking.holdExpiresAt).toLocaleString("en-AE", { timeZone: "Asia/Dubai" })
    : "approx 6 hours";

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #1C1816; color: #E9E6E7; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #262120; border: 1px solid #352E2C; border-radius: 8px; padding: 32px;">
    <div style="border-bottom: 2px solid #6B7C98; padding-bottom: 16px; margin-bottom: 24px;">
      <h1 style="color: #6B7C98; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">Hold Halfway Reminder</h1>
      <p style="color: #AB978C; margin: 4px 0 0 0; font-size: 14px; font-weight: bold;">Ref: ${booking.ref} (${roomName})</p>
    </div>

    <p style="color: #E9E6E7;">This is a reminder that the 12-hour inventory hold for reservation <strong>${booking.ref}</strong> is at the halfway point.</p>
    <p style="color: #7B7F8A;">Hold expires at: <strong style="color: #E9E6E7;">${holdExpiryText} GST</strong>.</p>
    <p style="color: #E9E6E7;">Guest: <strong>${booking.guestName}</strong> (${booking.guestPhone})</p>
    <p style="color: #E9E6E7;">Stay: ${booking.checkIn} to ${booking.checkOut}</p>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${adminLink}" style="display: inline-block; background-color: #AB978C; color: #1C1816; font-weight: bold; font-size: 13px; text-decoration: none; padding: 10px 24px; border-radius: 4px; text-transform: uppercase;">
        Review in Admin &rarr;
      </a>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: ownerEmail,
      subject: `[Hold Reminder - 6h Left] ${booking.ref} — ${roomName}`,
      html,
    });
    return { success: !result.error, id: result.data?.id, error: result.error?.message };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Sends a confirmation email to the guest if they provided an email address.
 */
export async function sendGuestBookingConfirmedEmail(
  booking: BookingRecord,
  roomName: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!isEmailEnabled || !resend || !booking.guestEmail) {
    return { success: false, error: "Guest email missing or Resend disabled" };
  }

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F6F4F5; color: #1C1816; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E9E6E7; border-radius: 8px; padding: 32px;">
    <div style="border-bottom: 2px solid #AB978C; padding-bottom: 16px; margin-bottom: 24px;">
      <h1 style="color: #1C1816; margin: 0; font-size: 24px; text-transform: uppercase;">Reservation Confirmed</h1>
      <p style="color: #AB978C; margin: 4px 0 0 0; font-size: 14px; font-weight: bold;">Reference: ${booking.ref}</p>
    </div>

    <p>Dear ${booking.guestName},</p>
    <p>We are pleased to confirm your stay at <strong>Rizq Luxurious Villa</strong> in Dubai.</p>

    <div style="background-color: #F6F4F5; padding: 16px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0;"><strong>Space:</strong> ${roomName}</p>
      <p style="margin: 0 0 8px 0;"><strong>Check-in:</strong> ${booking.checkIn}</p>
      <p style="margin: 0 0 8px 0;"><strong>Check-out:</strong> ${booking.checkOut}</p>
      <p style="margin: 0;"><strong>Estimated Total:</strong> ${booking.estimatedTotalAED} AED</p>
    </div>

    <p style="font-size: 14px; color: #5E5653;">Our on-site team is available on WhatsApp at <strong>+${siteConfig.whatsappNumber}</strong> to assist with directions or special requests.</p>
  </div>
</body>
</html>
  `;

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: booking.guestEmail,
      subject: `Reservation Confirmed: ${booking.ref} — Rizq Luxurious Villa Dubai`,
      html,
    });
    return { success: !result.error, id: result.data?.id, error: result.error?.message };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
