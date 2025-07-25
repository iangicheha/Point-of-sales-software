import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';
import { Between } from 'typeorm';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

const router = Router();

router.get('/daily', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const orders = await AppDataSource.getRepository(Order).find({
    where: { createdAt: Between(today, tomorrow) },
    relations: ['items'],
  });
  const payments = await AppDataSource.getRepository(Payment).find({
    where: { paidAt: Between(today, tomorrow) },
  });
  const revenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  res.json({
    date: today.toISOString().slice(0, 10),
    orders: orders.length,
    revenue,
  });
});

router.get('/daily/pdf', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const orders = await AppDataSource.getRepository(Order).find({ where: { createdAt: Between(today, tomorrow) } });
  const payments = await AppDataSource.getRepository(Payment).find({ where: { paidAt: Between(today, tomorrow) } });
  const revenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="daily-report.pdf"');
  doc.text(`Daily Report - ${today.toISOString().slice(0, 10)}`);
  doc.text(`Orders: ${orders.length}`);
  doc.text(`Revenue: $${revenue}`);
  doc.end();
  doc.pipe(res);
});

router.get('/daily/excel', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const orders = await AppDataSource.getRepository(Order).find({ where: { createdAt: Between(today, tomorrow) } });
  const payments = await AppDataSource.getRepository(Payment).find({ where: { paidAt: Between(today, tomorrow) } });
  const revenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Daily Report');
  sheet.addRow(['Date', 'Orders', 'Revenue']);
  sheet.addRow([today.toISOString().slice(0, 10), orders.length, revenue]);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="daily-report.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

router.get('/summary', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    // Support ?period=today|week|month or ?from=YYYY-MM-DD&to=YYYY-MM-DD
    let fromDate: Date, toDate: Date;
    const period = req.query.period as string;
    if (period) {
      const now = new Date();
      if (period === 'today') {
        fromDate = new Date(now);
        fromDate.setHours(0, 0, 0, 0);
        toDate = new Date(now);
        toDate.setHours(23, 59, 59, 999);
      } else if (period === 'week') {
        // Start from last Sunday
        fromDate = new Date(now);
        fromDate.setDate(now.getDate() - now.getDay());
        fromDate.setHours(0, 0, 0, 0);
        toDate = new Date(now);
        toDate.setHours(23, 59, 59, 999);
      } else if (period === 'month') {
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        toDate = new Date(now);
        toDate.setHours(23, 59, 59, 999);
      } else {
        return res.status(400).json({ message: 'Invalid period' });
      }
    } else {
      const from = req.query.from as string;
      const to = req.query.to as string;
      if (!from || !to) return res.status(400).json({ message: 'from and to required' });
      fromDate = new Date(from);
      toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
    }

    // Get all orders and payments in range
    const orders = await AppDataSource.getRepository(Order).find({
      where: { createdAt: Between(fromDate, toDate) },
      relations: ['items', 'items.menuItem'],
    });
    const payments = await AppDataSource.getRepository(Payment).find({
      where: { paidAt: Between(fromDate, toDate) },
    });
    const revenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Daily breakdown
    const days: Record<string, { orders: number; revenue: number }> = {};
    let d = new Date(fromDate);
    while (d <= toDate) {
      const dayStr = d.toISOString().slice(0, 10);
      days[dayStr] = { orders: 0, revenue: 0 };
      d.setDate(d.getDate() + 1);
    }
    orders.forEach(o => {
      const day = o.createdAt.toISOString().slice(0, 10);
      if (days[day]) days[day].orders++;
    });
    payments.forEach(p => {
      const day = p.paidAt?.toISOString().slice(0, 10);
      if (day && days[day]) days[day].revenue += Number(p.amount);
    });

    // Top-selling products
    const productMap: Record<string, { name: string; quantity: number }> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const name = item.menuItem?.name || 'Unknown';
        if (!productMap[name]) productMap[name] = { name, quantity: 0 };
        productMap[name].quantity += item.quantity;
      });
    });
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    res.json({
      from: fromDate.toISOString().slice(0, 10),
      to: toDate.toISOString().slice(0, 10),
      totalOrders: orders.length,
      totalRevenue: revenue,
      daily: days,
      topProducts,
    });
  } catch (err) {
    console.error('Error in /api/reports/summary:', err);
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
});

export default router; 