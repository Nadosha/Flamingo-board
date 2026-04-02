import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ColumnsService } from './columns.service';
import { ColumnsController } from './columns.controller';
import { Column, ColumnSchema } from './schemas/column.schema';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Column.name, schema: ColumnSchema }]), RealtimeModule],
  controllers: [ColumnsController],
  providers: [ColumnsService],
  exports: [ColumnsService, MongooseModule],
})
export class ColumnsModule {}
