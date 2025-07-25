import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './User';

@Entity()
export class InventoryCount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'In Progress' })
  status: string; // In Progress, Completed

  @Column({ nullable: true })
  comment: string;

  @ManyToOne(() => User, { nullable: true })
  performedBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => InventoryCountItem, item => item.count, { cascade: true })
  items: InventoryCountItem[];
}

@Entity()
export class InventoryCountItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => InventoryCount, count => count.items)
  count: InventoryCount;

  @Column()
  itemName: string;

  @Column('decimal', { precision: 10, scale: 2 })
  expectedQty: number;

  @Column('decimal', { precision: 10, scale: 2 })
  countedQty: number;

  @Column('decimal', { precision: 10, scale: 2 })
  variance: number;
} 