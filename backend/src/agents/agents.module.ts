import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { AgentsGateway } from './agents.gateway';
import { Agent } from './entities/agent.entity';
import { AgentLog } from './entities/agent-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Agent, AgentLog]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('agent.tokenExpiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AgentsController],
  providers: [AgentsService, AgentsGateway],
  exports: [AgentsService, AgentsGateway],
})
export class AgentsModule {}

