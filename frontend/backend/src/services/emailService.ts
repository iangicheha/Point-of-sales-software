import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOrderNotification(order: any) {
  if (!process.env.NOTIFY_EMAIL) return;
  const items = order.items?.map((i: any) => `${i.menuItem?.name || ''} x${i.quantity}`).join(', ');
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.NOTIFY_EMAIL,
    subject: `New Order #${order.id}`,
    text: `A new order has been placed.\n\nOrder ID: ${order.id}\nType: ${order.type}\nItems: ${items}\nStatus: ${order.status}`,
  });
}

export async function sendLowInventoryNotification(items: any[]) {
  if (!process.env.NOTIFY_EMAIL || !items.length) return;
  const lines = items.map(i => `${i.name}: ${i.quantity} ${i.unit} (min: ${i.minThreshold})`).join('\n');
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.NOTIFY_EMAIL,
    subject: `Low Inventory Alert`,
    text: `The following inventory items are below their minimum threshold:\n\n${lines}`,
  });
} 