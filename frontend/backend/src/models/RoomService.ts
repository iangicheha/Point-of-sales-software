import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Room } from './Room';

@Entity('room_services')
export class RoomService {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Room, room => room.services)
  room!: Room;

  @Column({ length: 20 })
  type!: string; // room_service, housekeeping, maintenance

  @Column({ length: 20 })
  status!: string; // pending, in_progress, completed, cancelled

  @Column({ type: 'timestamp' })
  requestedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date;

  @Column({ type: 'text', nullable: true })
  notes!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 