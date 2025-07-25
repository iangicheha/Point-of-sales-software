import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Room } from './Room';
import { MenuItem } from './MenuItem';
import { User } from './User';
import { Payment } from './Payment';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 20 })
  type!: string; // room, restaurant, takeaway, delivery

  @ManyToOne(() => Room, { nullable: true })
  room!: Room;

  @ManyToOne(() => User, { nullable: true })
  createdBy!: User;

  @Column({ length: 10, nullable: true })
  tableNumber!: string;

  @Column({ length: 100, nullable: true })
  customerName!: string;

  @Column({ length: 20 })
  status!: string; // pending, preparing, served, paid

  @Column({ length: 20, default: 'indoor' })
  location!: string; // 'indoor' or 'outdoor'

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => OrderItem, item => item.order)
  items!: OrderItem[];

  @OneToMany(() => Payment, payment => payment.order)
  payments!: Payment[];
}

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Order, order => order.items)
  order!: Order;

  @ManyToOne(() => MenuItem)
  menuItem!: MenuItem;

  @Column()
  quantity!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;
} 