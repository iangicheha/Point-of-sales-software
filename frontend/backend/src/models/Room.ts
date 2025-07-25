import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { RoomService } from './RoomService';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 10, unique: true })
  number!: string;

  @Column({ length: 50 })
  type!: string;

  @Column({ length: 20 })
  status!: string; // occupied, vacant, cleaning, maintenance

  @Column({ length: 100, nullable: true })
  guestName!: string;

  @Column({ nullable: true })
  reservationId!: number;

  @Column({ length: 20, nullable: true })
  maintenanceStatus!: string; // pending, in_progress, completed

  @Column({ type: 'timestamp', nullable: true })
  lastCleaned!: Date;

  @Column({ type: 'text', nullable: true })
  notes!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'text', nullable: true })
  facilities!: string; // comma-separated list

  @Column({ length: 50, nullable: true })
  bedType!: string;

  @Column({ type: 'boolean', default: false })
  balcony!: boolean;

  @Column({ type: 'boolean', default: false })
  view!: boolean;

  @Column({ type: 'boolean', default: false })
  airConditioning!: boolean;

  @Column({ type: 'boolean', default: false })
  flatScreenTV!: boolean;

  @Column({ type: 'boolean', default: false })
  freeWifi!: boolean;

  @Column({ type: 'boolean', default: false })
  electricKettle!: boolean;

  @Column({ type: 'boolean', default: false })
  wardrobe!: boolean;

  @Column({ type: 'boolean', default: false })
  clothesRack!: boolean;

  @Column({ type: 'boolean', default: false })
  fan!: boolean;

  @OneToMany(() => RoomService, service => service.room)
  services!: RoomService[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 