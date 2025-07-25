import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './User';
import { Supplier } from './Supplier';
import { PurchaseOrderItem } from './PurchaseOrderItem';

export enum PurchaseOrderStatus {
  DRAFT = 'Draft',
  PENDING_APPROVAL = 'Pending Approval',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  SUBMITTED = 'Submitted',
  PARTIALLY_RECEIVED = 'Partially Received',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

@Entity()
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderDate: Date;

  @Column({
    type: 'enum',
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.DRAFT,
  })
  status: PurchaseOrderStatus;

  @ManyToOne(() => Supplier, supplier => supplier.purchaseOrders)
  supplier: Supplier;

  @OneToMany(() => PurchaseOrderItem, item => item.purchaseOrder, { cascade: true })
  items: PurchaseOrderItem[];

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2 })
  tax: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => User)
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 