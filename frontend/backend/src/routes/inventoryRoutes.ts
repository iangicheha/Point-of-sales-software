import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Inventory } from '../models/Inventory';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';
import { Notification } from '../models/Notification';

const router = Router();

router.get('/', authenticateJWT, async (req, res) => {
  const items = await AppDataSource.getRepository(Inventory).find();
  res.json(items);
});

router.post('/', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const repo = AppDataSource.getRepository(Inventory);
  const item = repo.create(req.body);
  await repo.save(item);
  res.status(201).json(item);
});

router.put('/:id', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const repo = AppDataSource.getRepository(Inventory);
  const notificationRepo = AppDataSource.getRepository(Notification);
  const item = await repo.findOneBy({ id: Number(req.params.id) });
  if (!item) return res.status(404).json({ message: 'Inventory item not found' });
  Object.assign(item, req.body);
  await repo.save(item);
  // If item is now below minThreshold, create notification
  if (Number(item.quantity) < Number(item.minThreshold)) {
    await notificationRepo.save(notificationRepo.create({
      type: 'warning',
      message: `Low stock: ${item.name} (${item.quantity})`
    }));
  }
  res.json(item);
});

router.delete('/:id', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const repo = AppDataSource.getRepository(Inventory);
  const item = await repo.findOneBy({ id: Number(req.params.id) });
  if (!item) return res.status(404).json({ message: 'Inventory item not found' });
  await repo.remove(item);
  res.json({ message: 'Inventory item deleted' });
});

// Bulk update inventory items
router.put('/bulk', async (req, res) => {
  const { items } = req.body;
  const inventoryRepository = AppDataSource.getRepository(Inventory);
  try {
    const results = [];
    for (const update of items) {
      const item = await inventoryRepository.findOne({ where: { id: update.id } });
      if (!item) continue;
      Object.assign(item, update);
      await inventoryRepository.save(item);
      results.push(item);
    }
    res.json({ updated: results.length });
  } catch (error) {
    res.status(400).json({ message: 'Bulk update failed', error });
  }
});

export default router; 