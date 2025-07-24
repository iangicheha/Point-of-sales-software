import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Supplier } from '../models/Supplier';

const router = Router();

// Get all suppliers
router.get('/', async (req, res) => {
  const supplierRepository = AppDataSource.getRepository(Supplier);
  const suppliers = await supplierRepository.find();
  res.json(suppliers);
});

// Create a new supplier (optional, but good to have)
router.post('/', async (req, res) => {
  const supplierRepository = AppDataSource.getRepository(Supplier);
  try {
    const newSupplier = supplierRepository.create(req.body);
    const savedSupplier = await supplierRepository.save(newSupplier);
    res.status(201).json(savedSupplier);
  } catch (error) {
    res.status(400).json({ message: 'Error creating supplier', error });
  }
});

export default router; 