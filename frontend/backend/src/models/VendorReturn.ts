import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Supplier } from './Supplier';
import { PurchaseOrder } from './PurchaseOrder';

@Entity()
export class VendorReturn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PurchaseOrder, { nullable: false })
  purchaseOrder: PurchaseOrder;

  @ManyToOne(() => Supplier, { nullable: false })
  supplier: Supplier;

  @Column({ nullable: true })
  reason: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => VendorReturnItem, item => item.vendorReturn, { cascade: true })
  items: VendorReturnItem[];
}

@Entity()
export class VendorReturnItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => VendorReturn, vendorReturn => vendorReturn.items)
  vendorReturn: VendorReturn;

  @Column()
  itemName: string;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;
} 