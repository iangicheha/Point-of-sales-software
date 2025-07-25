import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { PurchaseOrder } from './PurchaseOrder';
import { MenuItem } from './MenuItem';

@Entity()
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PurchaseOrder, po => po.items)
  purchaseOrder: PurchaseOrder;

  @ManyToOne(() => MenuItem)
  item: MenuItem;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'int', default: 0 })
  receivedQty: number;
} 