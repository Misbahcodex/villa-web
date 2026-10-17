import { Resend } from "resend";
import { InquiryRecord } from "@/types";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendOwnerInquiryNotification(inquiry: InquiryRecord): Promise<boolean> {
  const recipient = process.env.OWNER_NOTIFICATION_EMAIL;

  if (process.env.ENABLE_BACKEND !== "true" || !resend || !recipient) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[Resend Notification Stubbed]:", {
        to: recipient || "owner@placeholder",
        guest: inquiry.guestName,
        room: inquiry.roomId,
        dates: `${inquiry.checkIn} to ${inquiry.checkOut}`,
        total: `AED ${inquiry.estimatedTotalAED}`,
      });
    }
    return true;
  }

  try {
    await resend.emails.send({
      from: process.env.NOTIFICATION_FROM_EMAIL || "Rizq Villa Direct <notifications@resend.dev>",
      to: [recipient],
      subject: `New Direct Reservation Lead: ${inquiry.guestName} (${inquiry.roomId})`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #1C1816; color: #E9E6E7; padding: 32px; border-radius: 8px;">
          <h2 style="color: #AB978C; margin-top: 0;">New Direct Booking Inquiry</h2>
          <p style="color: #E9E6E7;">A guest has submitted a direct reservation inquiry via the website:</p>
          <hr style="border: 0; border-top: 1px solid #352E2C; margin: 24px 0;" />
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="color: #7B7F8A; padding: 6px 0;">Guest Name:</td><td style="font-weight: bold; color: #E9E6E7;">${inquiry.guestName}</td></tr>
            <tr><td style="color: #7B7F8A; padding: 6px 0;">Email:</td><td style="color: #E9E6E7;">${inquiry.guestEmail || "Not provided"}</td></tr>
            <tr><td style="color: #7B7F8A; padding: 6px 0;">Phone:</td><td style="color: #E9E6E7;">${inquiry.guestPhone || "Not provided"}</td></tr>
            <tr><td style="color: #7B7F8A; padding: 6px 0;">Room / Space:</td><td style="color: #AB978C; font-weight: bold;">${inquiry.roomId}</td></tr>
            <tr><td style="color: #7B7F8A; padding: 6px 0;">Dates:</td><td style="color: #E9E6E7;">${inquiry.checkIn} to ${inquiry.checkOut} (${inquiry.nights} nights)</td></tr>
            <tr><td style="color: #7B7F8A; padding: 6px 0;">Guests:</td><td style="color: #E9E6E7;">${inquiry.guests}</td></tr>
            <tr><td style="color: #7B7F8A; padding: 6px 0;">Promo Applied:</td><td style="color: #AB978C;">${inquiry.promoCode} (15% Direct Privilege)</td></tr>
            <tr><td style="color: #7B7F8A; padding: 6px 0;">Estimated Total:</td><td style="color: #AB978C; font-weight: bold;">AED ${inquiry.estimatedTotalAED.toLocaleString()}</td></tr>
            ${inquiry.specialRequests ? `<tr><td style="color: #7B7F8A; padding: 6px 0;">Special Requests:</td><td style="color: #E9E6E7;">${inquiry.specialRequests}</td></tr>` : ""}
          </table>
          <hr style="border: 0; border-top: 1px solid #352E2C; margin: 24px 0;" />
          <p style="font-size: 12px; color: #7B7F8A;">This lead has also initiated WhatsApp direct communication. Follow up immediately to confirm room allocation.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Resend Error]:", error);
    return false;
  }
}
