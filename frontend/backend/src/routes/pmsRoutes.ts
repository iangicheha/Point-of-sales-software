import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';
import { syncRoomsFromPMS } from '../services/pmsService';

const router = Router();

router.post('/sync', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    const count = await syncRoomsFromPMS();
    res.json({ message: `Synced ${count} rooms from PMS.` });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router; 