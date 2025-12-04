import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignupsService } from './signups.service';
import { SignupsController } from './signups.controller';
import { Signup } from './entities/signup.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Signup])],
  controllers: [SignupsController],
  providers: [SignupsService],
  exports: [SignupsService],
})
export class SignupsModule {}

