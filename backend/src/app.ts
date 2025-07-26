import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import roomRoutes from './routes/roomRoutes';
import menuRoutes from './routes/menuRoutes';
import orderRoutes from './routes/orderRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import paymentRoutes from './routes/paymentRoutes';
import paymentMpesaRoutes from './routes/paymentMpesaRoutes';
import reportRoutes from './routes/reportRoutes';
import pmsRoutes from './routes/pmsRoutes';
import roomServiceRoutes from './routes/roomServiceRoutes';
import reservationRoutes from './routes/reservationRoutes';
import purchaseOrderRoutes from './routes/purchaseOrder';
import supplierRoutes from './routes/supplier';
import inventoryCountRoutes from './routes/inventoryCountRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { AppDataSource } from './data-source';

dotenv.config();

const app = express();

const allowedOrigin = process.env.FRONTEND_URL || '*';
app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));
app.use(express.json());
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payments/mpesa', paymentMpesaRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/pms', pmsRoutes);
app.use('/api/room-services', roomServiceRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/inventory-counts', inventoryCountRoutes);
app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 5000;
AppDataSource.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to the database', err);
    process.exit(1);
  });

export default app; 