import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { RoomService } from '../models/RoomService';
import { Room } from '../models/Room';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';
import { Notification } from '../models/Notification';

const router = Router();

// Get all room services
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const services = await AppDataSource.getRepository(RoomService).find({
      relations: ['room'],
      order: { requestedAt: 'DESC' }
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch room services' });
  }
});

// Get room services for a specific room
router.get('/room/:roomId', authenticateJWT, async (req, res) => {
  try {
    const services = await AppDataSource.getRepository(RoomService).find({
      where: { room: { id: parseInt(req.params.roomId) } },
      relations: ['room'],
      order: { requestedAt: 'DESC' }
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch room services' });
  }
});

// Create a new room service request
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { roomId, type, status, notes } = req.body;
    
    const room = await AppDataSource.getRepository(Room).findOneBy({ id: roomId });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const service = AppDataSource.getRepository(RoomService).create({
      room,
      type,
      status,
      requestedAt: new Date(),
      notes
    });

    await AppDataSource.getRepository(RoomService).save(service);
    
    // Update room status if necessary
    if (type === 'housekeeping') {
      room.status = 'cleaning';
      await AppDataSource.getRepository(Room).save(room);
    } else if (type === 'maintenance') {
      room.status = 'maintenance';
      await AppDataSource.getRepository(Room).save(room);
    }

    // Create notification for maintenance or housekeeping
    const notificationRepo = AppDataSource.getRepository(Notification);
    if (type === 'maintenance' || type === 'housekeeping') {
      await notificationRepo.save(notificationRepo.create({
        type: 'info',
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} requested: Room ${room.number}`
      }));
    }

    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create room service request' });
  }
});

// Update a room service request
router.put('/:id', authenticateJWT, authorizeRoles('admin', 'staff'), async (req, res) => {
  try {
    const service = await AppDataSource.getRepository(RoomService).findOne({
      where: { id: parseInt(req.params.id) },
      relations: ['room']
    });

    if (!service) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    const { status, notes } = req.body;
    
    // Update service
    Object.assign(service, {
      status,
      notes,
      ...(status === 'completed' ? { completedAt: new Date() } : {})
    });

    await AppDataSource.getRepository(RoomService).save(service);

    // Update room status when service is completed
    if (status === 'completed') {
      const room = service.room;
      if (service.type === 'housekeeping') {
        room.status = 'vacant';
        room.lastCleaned = new Date();
      } else if (service.type === 'maintenance') {
        room.status = 'vacant';
        room.maintenanceStatus = 'completed';
      }
      await AppDataSource.getRepository(Room).save(room);
    }

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update service request' });
  }
});

// Cancel a room service request
router.delete('/:id', authenticateJWT, authorizeRoles('admin', 'staff'), async (req, res) => {
  try {
    const service = await AppDataSource.getRepository(RoomService).findOne({
      where: { id: parseInt(req.params.id) },
      relations: ['room']
    });

    if (!service) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    service.status = 'cancelled';
    await AppDataSource.getRepository(RoomService).save(service);

    // Revert room status if it was changed due to this service
    const room = service.room;
    if ((service.type === 'housekeeping' && room.status === 'cleaning') ||
        (service.type === 'maintenance' && room.status === 'maintenance')) {
      room.status = 'vacant';
      await AppDataSource.getRepository(Room).save(room);
    }

    res.json({ message: 'Service request cancelled' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel service request' });
  }
});

export default router; 