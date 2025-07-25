import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../models/User';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const users = await AppDataSource.getRepository(User).find();
  res.json(users);
});

router.post('/', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ message: 'Missing fields' });
  const repo = AppDataSource.getRepository(User);
  const existing = await repo.findOneBy({ email });
  if (existing) return res.status(409).json({ message: 'Email exists' });
  const passwordHash = await require('bcryptjs').hash(password, 10);
  const user = repo.create({ name, email, passwordHash, role });
  await repo.save(user);
  res.status(201).json(user);
});

router.put('/:id', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOneBy({ id: Number(req.params.id) });
  if (!user) return res.status(404).json({ message: 'User not found' });
  Object.assign(user, req.body);
  await repo.save(user);
  res.json(user);
});

router.delete('/:id', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOneBy({ id: Number(req.params.id) });
  if (!user) return res.status(404).json({ message: 'User not found' });
  await repo.remove(user);
  res.json({ message: 'User deleted' });
});

export default router; 