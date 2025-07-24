import axios from 'axios';
import { AppDataSource } from '../data-source';
import { Room } from '../models/Room';

const PMS_API_URL = process.env.PMS_API_URL;
const PMS_API_KEY = process.env.PMS_API_KEY;

export async function syncRoomsFromPMS() {
  if (!PMS_API_URL || !PMS_API_KEY) throw new Error('PMS API config missing');
  // Example: GET /rooms from PMS
  const res = await axios.get(`${PMS_API_URL}/rooms`, {
    headers: { 'Authorization': `Bearer ${PMS_API_KEY}` }
  });
  const rooms = res.data.rooms || res.data; // adapt to PMS response
  // Upsert rooms in local DB
  const repo = AppDataSource.getRepository(Room);
  for (const r of rooms) {
    let room = await repo.findOneBy({ number: r.number });
    if (!room) {
      room = repo.create({ number: r.number, type: r.type, status: r.status });
    } else {
      room.type = r.type;
      room.status = r.status;
    }
    await repo.save(room);
  }
  return rooms.length;
} 