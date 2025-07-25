import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Room } from '../models/Room';
import { Reservation } from '../models/Reservation';
import { In } from 'typeorm';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/', authenticateJWT, async (req, res) => {
  const roomRepo = AppDataSource.getRepository(Room);
  const reservationRepo = AppDataSource.getRepository(Reservation);
  const rooms = await roomRepo.find();
  // For each room, if occupied, fetch the active reservation and add reservationId
  const roomsWithReservation = await Promise.all(
    rooms.map(async (room) => {
      let reservationId = undefined;
      if (room.status === 'occupied') {
        const activeReservation = await reservationRepo.findOne({
          where: {
            room: { id: room.id },
            status: In(['reserved', 'checked_in'])
          },
          order: { createdAt: 'DESC' }
        });
        if (activeReservation) reservationId = activeReservation.id;
      }
      return { ...room, reservationId };
    })
  );
  res.json(roomsWithReservation);
});

router.post('/', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const repo = AppDataSource.getRepository(Room);
  const room = repo.create(req.body);
  await repo.save(room);
  res.status(201).json(room);
});

router.put('/:id', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const repo = AppDataSource.getRepository(Room);
  const room = await repo.findOneBy({ id: Number(req.params.id) });
  if (!room) return res.status(404).json({ message: 'Room not found' });
  Object.assign(room, req.body);
  await repo.save(room);
  res.json(room);
});

router.delete('/:id', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const repo = AppDataSource.getRepository(Room);
  const room = await repo.findOneBy({ id: Number(req.params.id) });
  if (!room) return res.status(404).json({ message: 'Room not found' });
  await repo.remove(room);
  res.json({ message: 'Room deleted' });
});

export default router; 