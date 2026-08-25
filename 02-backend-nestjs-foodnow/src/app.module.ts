import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './core/database/prisma.module';
import { QueueModule } from './core/cache/queue.module';
import { EventBusModule } from './core/events/event-bus.module';

@Module({
  imports: [ConfigModule, PrismaModule, QueueModule, EventBusModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
