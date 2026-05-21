// WhatsApp messaging via Twilio. Silently no-ops if env vars are missing.
import twilio from "twilio";

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"

let cachedClient: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!sid || !token || !from) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = twilio(sid, token);
  }
  return cachedClient;
}

function normalizeTo(to: string): string {
  const trimmed = to.trim();
  if (trimmed.startsWith("whatsapp:")) return trimmed;
  // Ensure it has a leading + for E.164
  return `whatsapp:${trimmed.startsWith("+") ? trimmed : "+" + trimmed.replace(/[^\d]/g, "")}`;
}

export async function sendWhatsApp(to: string, message: string) {
  const client = getClient();
  if (!client) {
    console.warn("[whatsapp] Twilio env vars missing — skipping send", { to });
    return { skipped: true };
  }

  try {
    const msg = await client.messages.create({
      from,
      to: normalizeTo(to),
      body: message,
    });
    return { ok: true, sid: msg.sid };
  } catch (err) {
    console.error("[whatsapp] send failed:", err);
    return { error: true };
  }
}
