import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  type!: string; // e.g., 'info', 'warning', 'error'

  @Column()
  message!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ default: false })
  read!: boolean;
} 