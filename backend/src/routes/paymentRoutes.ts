import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Payment } from '../models/Payment';
import { Order } from '../models/Order';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/', authenticateJWT, async (req, res) => {
  const payments = await AppDataSource.getRepository(Payment).find({ relations: ['order'] });
  res.json(payments);
});

router.post('/', authenticateJWT, authorizeRoles('admin', 'cashier'), async (req, res) => {
  const repo = AppDataSource.getRepository(Payment);
  const paymentData = Array.isArray(req.body) ? req.body[0] : req.body;
  if (Array.isArray(paymentData)) {
    throw new Error('Payment creation does not support arrays');
  }
  // If status is completed and paidAt is not set, set it to now
  if (paymentData.status === 'completed' && !paymentData.paidAt) {
    paymentData.paidAt = new Date();
  }
  const newPayment = repo.create(paymentData) as unknown as Payment;
  await repo.save(newPayment);

  // Robustly extract orderId
  let orderId = newPayment.order?.id;
  if (!orderId && paymentData.order?.id) {
    orderId = paymentData.order.id;
  }
  if (!orderId && paymentData.orderId) {
    orderId = paymentData.orderId;
  }

  // Auto-update order status to 'completed' if payment is completed
  if (newPayment.status === 'completed' && orderId) {
    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOneBy({ id: orderId });
    if (order) {
      order.status = 'completed';
      await orderRepo.save(order);
    }
  }

  res.status(201).json(newPayment);
});

router.put('/:id', authenticateJWT, authorizeRoles('admin', 'cashier'), async (req, res) => {
  const repo = AppDataSource.getRepository(Payment);
  const payment = await repo.findOneBy({ id: Number(req.params.id) });
  if (!payment) return res.status(404).json({ message: 'Payment not found' });
  const wasCompleted = payment.status === 'completed';
  Object.assign(payment, req.body);
  // If status is now completed and paidAt is not set, set it to now
  if (payment.status === 'completed' && !payment.paidAt) {
    payment.paidAt = new Date();
  }
  await repo.save(payment);
  res.json(payment);
});

router.delete('/:id', authenticateJWT, authorizeRoles('admin', 'cashier'), async (req, res) => {
  const repo = AppDataSource.getRepository(Payment);
  const payment = await repo.findOneBy({ id: Number(req.params.id) });
  if (!payment) return res.status(404).json({ message: 'Payment not found' });
  await repo.remove(payment);
  res.json({ message: 'Payment deleted' });
});

export default router; 