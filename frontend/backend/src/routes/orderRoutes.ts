import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Order, OrderItem } from '../models/Order';
import { MenuItem } from '../models/MenuItem';
import { Inventory } from '../models/Inventory';
import { authenticateJWT, authorizeRoles, AuthRequest } from '../middlewares/auth';
import { sendOrderNotification } from '../services/emailService';
import { sendOrderSMS, sendOrderWhatsApp } from '../services/smsService';
import { sendLowInventoryNotification } from '../services/emailService';
import { sendLowInventorySMS, sendLowInventoryWhatsApp } from '../services/smsService';
import { Payment } from '../models/Payment';
import { Notification } from '../models/Notification';

const router = Router();

router.get('/', authenticateJWT, async (req, res) => {
  const orders = await AppDataSource.getRepository(Order).find({
    relations: ['payments', 'items', 'items.menuItem'],
    order: { createdAt: 'DESC' }
  });
  res.json(orders);
});

router.post('/', authenticateJWT, authorizeRoles('admin', 'waiter'), async (req: AuthRequest, res) => {
  const repo = AppDataSource.getRepository(Order);
  const userRepo = AppDataSource.getRepository('User');
  const notificationRepo = AppDataSource.getRepository(Notification);
  const { type, room, tableNumber, customerName, status, items, location } = req.body;
  let createdBy = undefined;
  if (req.user && req.user.id) {
    createdBy = await userRepo.findOneBy({ id: req.user.id });
  }
  // Only include 'type' if it exists on the Order entity
  const orderData: any = { room, tableNumber, customerName, status, createdBy, location };
  if (typeof type !== 'undefined') orderData.type = type;
  console.log('orderData:', orderData);
  let orderMaybeArray = repo.create(orderData) as Order | Order[];
  if (Array.isArray(orderMaybeArray)) {
    throw new Error('Order creation returned an array, expected a single object');
  }
  const order: Order = orderMaybeArray;
  await repo.save(order);
  // Save order items
  if (items && Array.isArray(items)) {
    const itemRepo = AppDataSource.getRepository(OrderItem);
    for (const i of items) {
      const menuItem = await AppDataSource.getRepository(MenuItem).findOneBy({ id: i.menuItemId });
      if (menuItem) {
        const orderItem = itemRepo.create({ order: order, menuItem, quantity: i.quantity, price: i.price });
        await itemRepo.save(orderItem);
      }
    }
  }
  // Fetch order with items for notification
  const fullOrder = await repo.findOne({ where: { id: order.id }, relations: ['items', 'items.menuItem', 'createdBy'] });
  if (fullOrder) {
    await sendOrderNotification(fullOrder);
    await sendOrderSMS(fullOrder);
    await sendOrderWhatsApp(fullOrder);
    // Low inventory check
    const lowItems = await AppDataSource.getRepository(Inventory).find();
    const low = lowItems.filter(i => Number(i.quantity) < Number(i.minThreshold));
    if (low.length) {
      await sendLowInventoryNotification(low);
      await sendLowInventorySMS(low);
      await sendLowInventoryWhatsApp(low);
    }
    // Create notification for new order
    await notificationRepo.save(notificationRepo.create({
      type: 'info',
      message: `New order placed: Table ${tableNumber || '-'} by ${customerName || 'Guest'}`
    }));
  }
  res.status(201).json(order);
});

router.put('/:id', authenticateJWT, authorizeRoles('admin', 'waiter'), async (req, res) => {
  const repo = AppDataSource.getRepository(Order);
  const order = await repo.findOneBy({ id: Number(req.params.id) });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  Object.assign(order, req.body);
  await repo.save(order);
  res.json(order);
});

router.delete('/:id', authenticateJWT, authorizeRoles('admin', 'waiter'), async (req, res) => {
  const repo = AppDataSource.getRepository(Order);
  const order = await repo.findOneBy({ id: Number(req.params.id) });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  await repo.remove(order);
  res.json({ message: 'Order deleted' });
});

router.get('/:id/receipt', authenticateJWT, async (req, res) => {
  const orderId = Number(req.params.id);
  const orderRepo = AppDataSource.getRepository(Order);
  const paymentRepo = AppDataSource.getRepository(Payment);
  const order = await orderRepo.findOne({ where: { id: orderId }, relations: ['items', 'items.menuItem', 'room', 'createdBy'] });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  const payments = await paymentRepo.find({ where: { order: { id: orderId } } });
  const staff = order.createdBy?.name || 'Staff';
  res.json({
    hotel: {
      name: 'Belmont Hotel',
      address: 'Rodi Kopany, off Homabay-Ndhiwa Road, Homabay Town',
      phone: '0700 494454',
    },
    order: {
      id: order.id,
      type: order.type,
      room: order.room?.number || null,
      tableNumber: order.tableNumber,
      customerName: order.customerName,
      createdAt: order.createdAt,
      staff,
      items: order.items.map(i => ({
        name: i.menuItem?.name,
        quantity: i.quantity,
        price: i.price,
      })),
      subtotal: order.items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0),
    },
    payments,
    thankYou: 'Thank you for choosing Belmont Hotel!'
  });
});

export default router; 