import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Column, ColumnDocument } from './schemas/column.schema';
import { CreateColumnDto, UpdateColumnDto, ReorderColumnsDto } from './dto/column.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class ColumnsService {
  constructor(
    @InjectModel(Column.name) private columnModel: Model<ColumnDocument>,
    private realtimeGateway: RealtimeGateway,
  ) {}

  async getColumnsByBoard(boardId: string) {
    const cols = await this.columnModel
      .find({ board_id: new Types.ObjectId(boardId) })
      .sort({ position: 1 })
      .exec();
    return cols.map((c) => this.serialize(c));
  }

  async createColumn(dto: CreateColumnDto) {
    const col = await this.columnModel.create({
      board_id: new Types.ObjectId(dto.board_id),
      name: dto.name,
      position: dto.position,
    });
    this.realtimeGateway.broadcastBoardUpdate(dto.board_id);
    return this.serialize(col);
  }

  async updateColumn(columnId: string, dto: UpdateColumnDto) {
    const col = await this.columnModel.findByIdAndUpdate(columnId, dto, { new: true });
    if (!col) throw new NotFoundException('Column not found');
    this.realtimeGateway.broadcastBoardUpdate(col.board_id.toString());
    return this.serialize(col);
  }

  async deleteColumn(columnId: string) {
    const col = await this.columnModel.findById(columnId).exec();
    await this.columnModel.deleteOne({ _id: columnId });
    if (col) this.realtimeGateway.broadcastBoardUpdate(col.board_id.toString());
    return { success: true };
  }

  async reorderColumns(dto: ReorderColumnsDto) {
    const ops = dto.updates.map(({ id, position }) =>
      this.columnModel.updateOne({ _id: id }, { position }),
    );
    await Promise.all(ops);
    if (dto.board_id) this.realtimeGateway.broadcastBoardUpdate(dto.board_id);
    return { success: true };
  }

  serialize(col: ColumnDocument) {
    return {
      id: col._id.toString(),
      board_id: col.board_id.toString(),
      name: col.name,
      position: col.position,
      created_at: (col as any).created_at,
    };
  }
}
