import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { BoardDetailController } from '../boards/board-detail.controller';
import { Card, CardSchema } from './schemas/card.schema';
import { CardActivity, CardActivitySchema } from './schemas/card-activity.schema';
import { BoardsModule } from '../boards/boards.module';
import { UsersModule } from '../users/users.module';
import { LabelsModule } from '../labels/labels.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Card.name, schema: CardSchema },
      { name: CardActivity.name, schema: CardActivitySchema },
    ]),
    BoardsModule,
    UsersModule,
    LabelsModule,
    RealtimeModule,
  ],
  controllers: [CardsController, BoardDetailController],
  providers: [CardsService],
  exports: [CardsService, MongooseModule],
})
export class CardsModule {}
