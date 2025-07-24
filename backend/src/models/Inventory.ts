import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity!: number;

  @Column({ length: 20 })
  unit!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  minThreshold!: number;

  @Column({ length: 50, default: 'General' })
  category!: string;
} 