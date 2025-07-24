import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './models/User';
import { Room } from './models/Room';
import { MenuItem } from './models/MenuItem';
import { Order, OrderItem } from './models/Order';
import { Inventory } from './models/Inventory';
import { Payment } from './models/Payment';
import { Reservation } from './models/Reservation';
import { RoomService } from './models/RoomService';
import { Supplier } from './models/Supplier';
import { PurchaseOrder } from './models/PurchaseOrder';
import { PurchaseOrderItem } from './models/PurchaseOrderItem';
import { InventoryCount, InventoryCountItem } from './models/InventoryCount';
import { VendorReturn, VendorReturnItem } from './models/VendorReturn';
import { Notification } from './models/Notification';

envLoad();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true, // set to false in production
  logging: false,
  entities: [User, Room, MenuItem, Order, OrderItem, Inventory, Payment, Reservation, RoomService, Supplier, PurchaseOrder, PurchaseOrderItem, InventoryCount, InventoryCountItem, VendorReturn, VendorReturnItem, Notification],
  migrations: [],
  subscribers: [],
});

function envLoad() {
  // Load .env if not already loaded
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('dotenv').config();
  }
} 