import { Router } from 'express';
import { initiateSTKPush } from '../services/mpesaService';
import { AppDataSource } from '../data-source';
import { Payment } from '../models/Payment';

const router = Router();

// Initiate M-Pesa payment (STK Push)
router.post('/initiate', async (req, res) => {
  const { amount, phone, orderId } = req.body;
  try {
    const resp = await initiateSTKPush({
      amount,
      phone,
      accountRef: `ORDER${orderId}`,
      transactionDesc: `Payment for order #${orderId}`,
    });
    res.json(resp);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// M-Pesa callback (webhook)
router.post('/callback', async (req, res) => {
  // M-Pesa will POST payment result here
  const body = req.body;
  // Example: extract payment info from callback
  const result = body.Body?.stkCallback;
  if (result?.ResultCode === 0) {
    // Success: update payment status
    const mpesaReceipt = result.CallbackMetadata?.Item?.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;
    const orderRef = result.MerchantRequestID || result.CheckoutRequestID;
    // Find payment by transactionRef or orderId (customize as needed)
    const repo = AppDataSource.getRepository(Payment);
    const payment = await repo.findOneBy({ transactionRef: orderRef });
    if (payment) {
      payment.status = 'completed';
      payment.transactionRef = mpesaReceipt;
      payment.paidAt = new Date();
      await repo.save(payment);
    }
  }
  res.json({ status: 'ok' });
});

export default router; 