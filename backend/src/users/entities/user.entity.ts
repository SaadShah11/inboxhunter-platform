import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Agent } from '../../agents/entities/agent.entity';
import { Task } from '../../tasks/entities/task.entity';
import { Signup } from '../../signups/entities/signup.entity';
import { Credential } from '../../credentials/entities/credential.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ nullable: true })
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 'user' })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Agent, (agent) => agent.user)
  agents: Agent[];

  @OneToMany(() => Task, (task) => task.user)
  tasks: Task[];

  @OneToMany(() => Signup, (signup) => signup.user)
  signups: Signup[];

  @OneToMany(() => Credential, (credential) => credential.user)
  credentials: Credential[];
}

