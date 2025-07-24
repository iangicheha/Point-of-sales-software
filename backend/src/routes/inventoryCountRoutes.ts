import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Inventory } from '../models/Inventory';
import { InventoryCount, InventoryCountItem } from '../models/InventoryCount';
import { User } from '../models/User';

const router = Router();

// List all inventory counts
router.get('/', async (req, res) => {
  const repo = AppDataSource.getRepository(InventoryCount);
  const counts = await repo.find({ relations: ['items', 'performedBy'] });
  res.json(counts);
});

// Start a new inventory count
router.post('/', async (req, res) => {
  const { comment, userId } = req.body;
  const inventoryRepo = AppDataSource.getRepository(Inventory);
  const countRepo = AppDataSource.getRepository(InventoryCount);
  const itemRepo = AppDataSource.getRepository(InventoryCountItem);
  const userRepo = AppDataSource.getRepository(User);
  try {
    const items = await inventoryRepo.find();
    const count = new InventoryCount();
    count.status = 'In Progress';
    count.comment = comment;
    if (userId) {
      const user = await userRepo.findOne({ where: { id: userId } });
      if (user) count.performedBy = user;
    }
    count.items = [];
    await countRepo.save(count);
    for (const inv of items) {
      const countItem = new InventoryCountItem();
      countItem.count = count;
      countItem.itemName = inv.name;
      countItem.expectedQty = inv.quantity;
      countItem.countedQty = 0;
      countItem.variance = 0;
      await itemRepo.save(countItem);
      count.items.push(countItem);
    }
    await countRepo.save(count);
    res.status(201).json(count);
  } catch (error) {
    res.status(400).json({ message: 'Failed to start inventory count', error });
  }
});

// Finalize a count
router.put('/:id/finalize', async (req, res) => {
  const { id } = req.params;
  const { counted } = req.body; // { itemId: countedQty }
  const countRepo = AppDataSource.getRepository(InventoryCount);
  const itemRepo = AppDataSource.getRepository(InventoryCountItem);
  const inventoryRepo = AppDataSource.getRepository(Inventory);
  try {
    const count = await countRepo.findOneOrFail({ where: { id }, relations: ['items'] });
    for (const item of count.items) {
      const countedQty = counted[item.id];
      item.countedQty = countedQty;
      item.variance = countedQty - item.expectedQty;
      // Update inventory
      const inv = await inventoryRepo.findOne({ where: { name: item.itemName } });
      if (inv) inv.quantity = countedQty;
      if (inv) await inventoryRepo.save(inv);
      await itemRepo.save(item);
    }
    count.status = 'Completed';
    await countRepo.save(count);
    res.json(count);
  } catch (error) {
    res.status(400).json({ message: 'Failed to finalize inventory count', error });
  }
});

export default router; 