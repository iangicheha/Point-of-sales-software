import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Reservation } from '../models/Reservation';
import { Room } from '../models/Room';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

// List all reservations
router.get('/', authenticateJWT, async (req, res) => {
  const reservations = await AppDataSource.getRepository(Reservation).find({
    relations: ['room'],
    order: { createdAt: 'DESC' }
  });
  res.json(reservations);
});

// Create a reservation
router.post('/', authenticateJWT, async (req, res) => {
  const { roomId, guestName, checkIn, checkOut, contactInfo, specialRequests } = req.body;
  const roomRepo = AppDataSource.getRepository(Room);
  const reservationRepo = AppDataSource.getRepository(Reservation);
  const room = await roomRepo.findOneBy({ id: roomId });
  if (!room) return res.status(404).json({ message: 'Room not found' });
  // Optionally check for overlapping reservations here
  const reservation = reservationRepo.create({
    room,
    guestName,
    checkIn,
    checkOut,
    contactInfo,
    specialRequests,
    status: 'reserved'
  });
  await reservationRepo.save(reservation);
  // Update room status
  room.status = 'occupied';
  await roomRepo.save(room);
  res.status(201).json(reservation);
});

// Update/cancel a reservation
router.put('/:id', authenticateJWT, async (req, res) => {
  const reservationRepo = AppDataSource.getRepository(Reservation);
  const roomRepo = AppDataSource.getRepository(Room);
  const reservation = await reservationRepo.findOne({
    where: { id: parseInt(req.params.id) },
    relations: ['room']
  });
  if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
  const { status, checkIn, checkOut, specialRequests } = req.body;
  if (status) reservation.status = status;
  if (checkIn) reservation.checkIn = checkIn;
  if (checkOut) reservation.checkOut = checkOut;
  if (specialRequests) reservation.specialRequests = specialRequests;
  await reservationRepo.save(reservation);
  // Update room status if reservation is cancelled or checked out
  if (status === 'cancelled' || status === 'checked_out') {
    reservation.room.status = 'vacant';
    await roomRepo.save(reservation.room);
  }
  res.json(reservation);
});

export default router; 