import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Task } from '../../tasks/entities/task.entity';

export enum SignupStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
}

@Entity('signups')
export class Signup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  domain: string;

  @Column({ nullable: true })
  email: string;

  @Column({
    type: 'enum',
    enum: SignupStatus,
    default: SignupStatus.PENDING,
  })
  status: SignupStatus;

  @Column({ nullable: true })
  error: string;

  @Column({ nullable: true })
  screenshotUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.signups)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  taskId: string;

  @ManyToOne(() => Task, (task) => task.signups, { nullable: true })
  @JoinColumn({ name: 'taskId' })
  task: Task;
}

