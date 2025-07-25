import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Notification } from '../models/Notification';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

// Get all notifications (optionally filter by unread/type)
router.get('/', authenticateJWT, async (req, res) => {
  const repo = AppDataSource.getRepository(Notification);
  const notifications = await repo.find({ order: { createdAt: 'DESC' } });
  res.json(notifications);
});

// Create a new notification
router.post('/', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const repo = AppDataSource.getRepository(Notification);
  const { type, message } = req.body;
  if (!type || !message) return res.status(400).json({ message: 'type and message required' });
  const notification = repo.create({ type, message });
  await repo.save(notification);
  res.status(201).json(notification);
});

// Mark notification as read
router.put('/:id/read', authenticateJWT, async (req, res) => {
  const repo = AppDataSource.getRepository(Notification);
  const notification = await repo.findOneBy({ id: Number(req.params.id) });
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  notification.read = true;
  await repo.save(notification);
  res.json(notification);
});

// Delete a single notification
router.delete('/:id', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const repo = AppDataSource.getRepository(Notification);
  const notification = await repo.findOneBy({ id: Number(req.params.id) });
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  await repo.remove(notification);
  res.json({ message: 'Notification deleted' });
});

// Delete all notifications
router.delete('/', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const repo = AppDataSource.getRepository(Notification);
  await repo.clear();
  res.json({ message: 'All notifications deleted' });
});

export default router; 