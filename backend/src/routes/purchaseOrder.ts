import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { PurchaseOrder, PurchaseOrderStatus } from '../models/PurchaseOrder';
import { Supplier } from '../models/Supplier';
import { PurchaseOrderItem } from '../models/PurchaseOrderItem';
import { MenuItem } from '../models/MenuItem';
import { Inventory } from '../models/Inventory';
import multer from 'multer';
import path from 'path';
import { VendorReturn, VendorReturnItem } from '../models/VendorReturn';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const upload = multer({ dest: path.join(__dirname, '../../uploads/') });

const router = Router();

// Get all purchase orders
router.get('/', async (req, res) => {
  const poRepository = AppDataSource.getRepository(PurchaseOrder);
  const purchaseOrders = await poRepository.find({ relations: ['supplier', 'items'] });
  res.json(purchaseOrders);
});

// Get a single purchase order by ID
router.get('/:id', async (req, res) => {
  const poRepository = AppDataSource.getRepository(PurchaseOrder);
  const purchaseOrder = await poRepository.findOne({ where: { id: req.params.id }, relations: ['supplier', 'items', 'items.item'] });
  if (purchaseOrder) {
    res.json(purchaseOrder);
  } else {
    res.status(404).send('Purchase Order not found');
  }
});

// Create a new purchase order
router.post('/', async (req, res) => {
  const { supplierId, items, notes, status } = req.body;
  const poRepository = AppDataSource.getRepository(PurchaseOrder);
  const supplierRepository = AppDataSource.getRepository(Supplier);
  const menuItemRepository = AppDataSource.getRepository(MenuItem);

  try {
    const supplier = await supplierRepository.findOneOrFail({ where: { id: supplierId } });

    let subtotal = 0;
    const orderItems: PurchaseOrderItem[] = [];

    for (const itemData of items) {
      const item = await menuItemRepository.findOneOrFail({ where: { id: itemData.id } });
      const total = itemData.quantity * itemData.price;
      subtotal += total;

      const orderItem = new PurchaseOrderItem();
      orderItem.item = item;
      orderItem.quantity = itemData.quantity;
      orderItem.price = itemData.price;
      orderItem.total = total;
      orderItems.push(orderItem);
    }

    const tax = subtotal * 0.16; // 16% VAT
    const total = subtotal + tax;

    const newPO = new PurchaseOrder();
    newPO.supplier = supplier;
    newPO.items = orderItems;
    newPO.notes = notes;
    newPO.orderDate = new Date();
    newPO.status = status || PurchaseOrderStatus.DRAFT;
    newPO.subtotal = subtotal;
    newPO.tax = tax;
    newPO.total = total;
    // newPO.createdBy = req.user; // Assuming user is on req

    const savedPO = await poRepository.save(newPO);
    res.status(201).json(savedPO);
  } catch (error) {
    res.status(400).json({ message: 'Error creating purchase order', error });
  }
});

// Update an existing purchase order
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { supplierId, items, notes, status } = req.body;
  const poRepository = AppDataSource.getRepository(PurchaseOrder);
  const supplierRepository = AppDataSource.getRepository(Supplier);
  const menuItemRepository = AppDataSource.getRepository(MenuItem);
  const poItemRepository = AppDataSource.getRepository(PurchaseOrderItem);

  try {
    const purchaseOrder = await poRepository.findOneOrFail({ where: { id }, relations: ['items'] });
    const supplier = await supplierRepository.findOneOrFail({ where: { id: supplierId } });

    // Remove old items
    await poItemRepository.remove(purchaseOrder.items);

    let subtotal = 0;
    const orderItems: PurchaseOrderItem[] = [];

    for (const itemData of items) {
      const item = await menuItemRepository.findOneOrFail({ where: { id: itemData.id } });
      const total = itemData.quantity * itemData.price;
      subtotal += total;

      const orderItem = new PurchaseOrderItem();
      orderItem.item = item;
      orderItem.quantity = itemData.quantity;
      orderItem.price = itemData.price;
      orderItem.total = total;
      orderItem.purchaseOrder = purchaseOrder;
      orderItems.push(orderItem);
    }
    
    await poItemRepository.save(orderItems);

    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    purchaseOrder.supplier = supplier;
    purchaseOrder.notes = notes;
    purchaseOrder.status = status || purchaseOrder.status;
    purchaseOrder.subtotal = subtotal;
    purchaseOrder.tax = tax;
    purchaseOrder.total = total;

    const savedPO = await poRepository.save(purchaseOrder);
    res.json(savedPO);
  } catch (error) {
    res.status(400).json({ message: 'Error updating purchase order', error });
  }
});

// Update PO status
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const poRepository = AppDataSource.getRepository(PurchaseOrder);
  const inventoryRepository = AppDataSource.getRepository(Inventory);

  try {
    const purchaseOrder = await poRepository.findOneOrFail({ where: { id }, relations: ['items', 'items.item'] });

    if (status === PurchaseOrderStatus.COMPLETED && purchaseOrder.status !== PurchaseOrderStatus.COMPLETED) {
      for (const poItem of purchaseOrder.items) {
        const itemName = poItem.item.name;
        let inventoryItem = await inventoryRepository.findOne({ where: { name: itemName } });

        if (inventoryItem) {
          inventoryItem.quantity = Number(inventoryItem.quantity) + poItem.quantity;
        } else {
          inventoryItem = new Inventory();
          inventoryItem.name = itemName;
          inventoryItem.quantity = poItem.quantity;
          inventoryItem.unit = 'units'; // or derive from item
          inventoryItem.minThreshold = 10;
          inventoryItem.category = poItem.item.category;
        }
        await inventoryRepository.save(inventoryItem);
      }
    }

    purchaseOrder.status = status;
    const savedPO = await poRepository.save(purchaseOrder);
    res.json(savedPO);
  } catch (error) {
    res.status(400).json({ message: 'Error updating purchase order status', error });
  }
});

// Approve a purchase order
router.patch('/:id/approve', async (req, res) => {
  const { id } = req.params;
  const poRepository = AppDataSource.getRepository(PurchaseOrder);
  try {
    const po = await poRepository.findOneOrFail({ where: { id } });
    if (po.status !== PurchaseOrderStatus.PENDING_APPROVAL) {
      return res.status(400).json({ message: 'Only POs pending approval can be approved.' });
    }
    po.status = PurchaseOrderStatus.APPROVED;
    await poRepository.save(po);
    res.json(po);
  } catch (error) {
    res.status(400).json({ message: 'Error approving purchase order', error });
  }
});

// Reject a purchase order
router.patch('/:id/reject', async (req, res) => {
  const { id } = req.params;
  const poRepository = AppDataSource.getRepository(PurchaseOrder);
  try {
    const po = await poRepository.findOneOrFail({ where: { id } });
    if (po.status !== PurchaseOrderStatus.PENDING_APPROVAL) {
      return res.status(400).json({ message: 'Only POs pending approval can be rejected.' });
    }
    po.status = PurchaseOrderStatus.REJECTED;
    await poRepository.save(po);
    res.json(po);
  } catch (error) {
    res.status(400).json({ message: 'Error rejecting purchase order', error });
  }
});

// Partial receiving endpoint
router.post('/:id/receive', async (req, res) => {
  const { id } = req.params;
  const { received } = req.body; // { itemId: quantity }
  const poRepository = AppDataSource.getRepository(PurchaseOrder);
  const poItemRepository = AppDataSource.getRepository(PurchaseOrderItem);
  const inventoryRepository = AppDataSource.getRepository(Inventory);
  try {
    const po = await poRepository.findOneOrFail({ where: { id }, relations: ['items', 'items.item'] });
    let allReceived = true;
    for (const item of po.items) {
      const receivedQty = received[item.id] || 0;
      if (receivedQty > 0) {
        // Update inventory
        const itemName = item.item.name;
        let inventoryItem = await inventoryRepository.findOne({ where: { name: itemName } });
        if (inventoryItem) {
          inventoryItem.quantity = Number(inventoryItem.quantity) + receivedQty;
        } else {
          inventoryItem = new Inventory();
          inventoryItem.name = itemName;
          inventoryItem.quantity = receivedQty;
          inventoryItem.unit = 'units';
          inventoryItem.minThreshold = 10;
          inventoryItem.category = item.item.category;
        }
        await inventoryRepository.save(inventoryItem);
      }
      // Track received quantity
      item.receivedQty = (item.receivedQty || 0) + receivedQty;
      if (item.receivedQty < item.quantity) allReceived = false;
      await poItemRepository.save(item);
    }
    // Update PO status
    if (allReceived) {
      po.status = PurchaseOrderStatus.COMPLETED;
    } else {
      po.status = PurchaseOrderStatus.PARTIALLY_RECEIVED;
    }
    await poRepository.save(po);
    res.json(po);
  } catch (error) {
    res.status(400).json({ message: 'Error receiving items', error });
  }
});

// Create a vendor return for a purchase order
router.post('/:id/vendor-return', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const poRepo = AppDataSource.getRepository(PurchaseOrder);
  const vrRepo = AppDataSource.getRepository(VendorReturn);
  const vriRepo = AppDataSource.getRepository(VendorReturnItem);
  const inventoryRepo = AppDataSource.getRepository(Inventory);

  const po = await poRepo.findOne({ where: { id: req.params.id }, relations: ['supplier'] });
  if (!po) return res.status(404).json({ message: 'Purchase order not found' });

  const { items, reason } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'No items to return' });
  }

  // Create VendorReturn
  const vendorReturn = vrRepo.create({
    purchaseOrder: po,
    supplier: po.supplier,
    reason,
    items: []
  });
  await vrRepo.save(vendorReturn);

  // Create VendorReturnItems and update inventory
  for (const item of items) {
    const vri = vriRepo.create({
      vendorReturn,
      itemName: item.itemName,
      quantity: item.quantity
    });
    await vriRepo.save(vri);
    // Update inventory (add back returned quantity)
    const inv = await inventoryRepo.findOne({ where: { name: item.itemName } });
    if (inv) {
      inv.quantity = Number(inv.quantity) - Number(item.quantity);
      await inventoryRepo.save(inv);
    }
  }

  res.status(201).json({ message: 'Vendor return created' });
});

// List vendor returns for a purchase order
router.get('/:id/vendor-returns', authenticateJWT, async (req, res) => {
  const vrRepo = AppDataSource.getRepository(VendorReturn);
  const vriRepo = AppDataSource.getRepository(VendorReturnItem);
  const returns = await vrRepo.find({
    where: { purchaseOrder: { id: req.params.id } },
    relations: ['items', 'supplier']
  });
  res.json(returns);
});

// Upload attachment for a PO
router.post('/:id/attachments', upload.single('file'), async (req, res) => {
  const file = (req as any).file;
  res.json({ filename: file.filename, originalname: file.originalname });
});

// List attachments for a PO (placeholder, lists files in uploads dir)
router.get('/:id/attachments', async (req, res) => {
  // TODO: List only files for this PO if you track in DB
  const fs = require('fs');
  const dir = path.join(__dirname, '../../uploads/');
  const files = fs.readdirSync(dir);
  res.json(files);
});

// Download attachment
router.get('/:id/attachments/:filename', (req, res) => {
  const file = path.join(__dirname, '../../uploads/', req.params.filename);
  res.download(file);
});


export default router; 