import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ColumnDocument = Column & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Column {
  @Prop({ type: Types.ObjectId, ref: 'Board', required: true })
  board_id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: 0 })
  position: number;
}

export const ColumnSchema = SchemaFactory.createForClass(Column);
ColumnSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
