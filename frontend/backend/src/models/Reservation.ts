import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Room } from './Room';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Room, room => room.id)
  room!: Room;

  @Column({ length: 100 })
  guestName!: string;

  @Column({ type: 'date' })
  checkIn!: Date;

  @Column({ type: 'date' })
  checkOut!: Date;

  @Column({ length: 100, nullable: true })
  contactInfo!: string;

  @Column({ type: 'text', nullable: true })
  specialRequests!: string;

  @Column({ length: 20, default: 'reserved' })
  status!: string; // reserved, checked_in, checked_out, cancelled

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 