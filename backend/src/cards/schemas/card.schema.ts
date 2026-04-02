import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CardDocument = Card & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Card {
  @Prop({ type: Types.ObjectId, ref: 'Column', required: true })
  column_id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: null })
  description: string | null;

  @Prop({ default: 0 })
  position: number;

  @Prop({ default: null })
  due_date: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  created_by: Types.ObjectId;

  // Embedded assignees: just user ids
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  assignee_ids: Types.ObjectId[];

  // Embedded label ids
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Label' }], default: [] })
  label_ids: Types.ObjectId[];

  @Prop({ type: String, enum: ['low', 'medium', 'high'], default: null })
  priority: 'low' | 'medium' | 'high' | null;
}

export const CardSchema = SchemaFactory.createForClass(Card);
CardSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
