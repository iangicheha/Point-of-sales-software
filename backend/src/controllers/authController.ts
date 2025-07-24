import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function register(req: Request, res: Response) {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const repo = AppDataSource.getRepository(User);
  const existing = await repo.findOneBy({ email });
  if (existing) return res.status(409).json({ message: 'Email already registered' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = repo.create({ name, email, passwordHash, role });
  await repo.save(user);
  res.status(201).json({ message: 'User registered' });
}

export async function login(req: Request, res: Response) {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ message: 'Missing credentials' });
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOneBy({ name });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: '8h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
} 