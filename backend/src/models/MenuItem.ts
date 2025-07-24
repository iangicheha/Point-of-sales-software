import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 50 })
  category!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column({ default: true })
  isAvailable!: boolean;

  @Column({ default: false })
  isDeleted!: boolean;
} 