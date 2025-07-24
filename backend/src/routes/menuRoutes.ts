import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { MenuItem } from '../models/MenuItem';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/', authenticateJWT, async (req, res) => {
  const items = await AppDataSource.getRepository(MenuItem).find({
    where: { isDeleted: false }
  });
  res.json(items);
});

router.post('/', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const repo = AppDataSource.getRepository(MenuItem);
  const item = repo.create(req.body);
  await repo.save(item);
  res.status(201).json(item);
});

router.put('/:id', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const repo = AppDataSource.getRepository(MenuItem);
  const item = await repo.findOneBy({ id: Number(req.params.id) });
  if (!item) return res.status(404).json({ message: 'Menu item not found' });
  Object.assign(item, req.body);
  await repo.save(item);
  res.json(item);
});

router.delete('/:id', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const repo = AppDataSource.getRepository(MenuItem);
  const item = await repo.findOneBy({ id: Number(req.params.id) });
  if (!item) return res.status(404).json({ message: 'Menu item not found' });
  
  // Soft delete: mark as deleted instead of removing from database
  item.isDeleted = true;
  item.isAvailable = false;
  await repo.save(item);
  
  res.json({ message: 'Menu item removed successfully' });
});

export default router; 