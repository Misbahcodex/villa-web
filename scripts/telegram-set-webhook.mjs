/**
 * Registers the Telegram bot webhook with the secret token.
 * Usage: node scripts/telegram-set-webhook.mjs https://your-domain.com
 */

const domain = process.argv[2] || process.env.NEXT_PUBLIC_APP_URL || "https://rizqvilla.com";
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || "rizq_telegram_webhook_secret_2026";

if (!botToken) {
  console.error("Error: TELEGRAM_BOT_TOKEN environment variable is required.");
  process.exit(1);
}

const webhookUrl = `${domain.replace(/\/$/, "")}/api/telegram/webhook`;

console.log(`Setting Telegram webhook for bot to: ${webhookUrl}`);

async function setWebhook() {
  const url = `https://api.telegram.org/bot${botToken}/setWebhook`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: webhookSecret,
      allowed_updates: ["callback_query", "message"],
    }),
  });

  const data = await res.json();
  if (data.ok) {
    console.log("✓ Webhook successfully set!");
    console.log(data);
  } else {
    console.error("✗ Failed to set webhook:", data);
  }
}

setWebhook().catch(console.error);
