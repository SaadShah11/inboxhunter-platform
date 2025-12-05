import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum LinkStatus {
  PENDING = 'pending',      // Not yet processed
  SIGNED_UP = 'signed_up',  // Successfully signed up
  FAILED = 'failed',        // Signup failed
  SKIPPED = 'skipped',      // Manually skipped
}

@Entity('scraped_links')
export class ScrapedLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  url: string;

  @Column({ nullable: true })
  domain: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  advertiserName: string;

  @Column({ nullable: true })
  source: string;  // 'meta_ads', 'manual', 'csv'

  @Column({ nullable: true })
  searchKeyword: string;  // What keyword was used to find this

  @Column({
    type: 'enum',
    enum: LinkStatus,
    default: LinkStatus.PENDING,
  })
  status: LinkStatus;

  @Column({ nullable: true })
  lastError: string;

  @Column({ nullable: true })
  signedUpAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}

