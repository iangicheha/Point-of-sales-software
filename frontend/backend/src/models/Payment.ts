import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Order } from './Order';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Order)
  order!: Order;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column({ length: 20 })
  method!: string; // mpesa, card, cash, wallet

  @Column({ length: 20 })
  status!: string; // pending, completed, failed

  @Column({ length: 100, nullable: true })
  transactionRef!: string;

  @Column({ type: 'timestamp', nullable: true })
  paidAt!: Date;
} 