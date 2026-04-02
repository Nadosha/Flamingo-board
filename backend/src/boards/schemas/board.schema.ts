import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BoardDocument = Board & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Board {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspace_id: Types.ObjectId;

  @Prop({ default: '#0079bf' })
  color: string;

  @Prop({ default: null })
  description: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  created_by: Types.ObjectId;
}

export const BoardSchema = SchemaFactory.createForClass(Board);
BoardSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
