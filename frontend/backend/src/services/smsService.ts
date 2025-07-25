import twilio from 'twilio';

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromSMS = process.env.TWILIO_FROM_SMS;
const toSMS = process.env.NOTIFY_PHONE;
const fromWhatsApp = process.env.TWILIO_FROM_WHATSAPP;
const toWhatsApp = process.env.NOTIFY_WHATSAPP;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function sendOrderSMS(order: any) {
  if (!client || !fromSMS || !toSMS) return;
  const items = order.items?.map((i: any) => `${i.menuItem?.name || ''} x${i.quantity}`).join(', ');
  await client.messages.create({
    body: `New Order #${order.id}: ${items}`,
    from: fromSMS,
    to: toSMS,
  });
}

export async function sendOrderWhatsApp(order: any) {
  if (!client || !fromWhatsApp || !toWhatsApp) return;
  const items = order.items?.map((i: any) => `${i.menuItem?.name || ''} x${i.quantity}`).join(', ');
  await client.messages.create({
    body: `New Order #${order.id}: ${items}`,
    from: `whatsapp:${fromWhatsApp}`,
    to: `whatsapp:${toWhatsApp}`,
  });
}

export async function sendLowInventorySMS(items: any[]) {
  if (!client || !fromSMS || !toSMS || !items.length) return;
  const lines = items.map(i => `${i.name}: ${i.quantity}${i.unit}`).join('; ');
  await client.messages.create({
    body: `Low Inventory: ${lines}`,
    from: fromSMS,
    to: toSMS,
  });
}

export async function sendLowInventoryWhatsApp(items: any[]) {
  if (!client || !fromWhatsApp || !toWhatsApp || !items.length) return;
  const lines = items.map(i => `${i.name}: ${i.quantity}${i.unit}`).join('; ');
  await client.messages.create({
    body: `Low Inventory: ${lines}`,
    from: `whatsapp:${fromWhatsApp}`,
    to: `whatsapp:${toWhatsApp}`,
  });
} 