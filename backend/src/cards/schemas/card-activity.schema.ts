import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CardActivityDocument = CardActivity & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class CardActivity {
  @Prop({ type: Types.ObjectId, ref: 'Card', required: true })
  card_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ required: true })
  type: string;

  @Prop({ default: null })
  content: string | null;

  @Prop({ type: Object, default: null })
  metadata: Record<string, any> | null;
}

export const CardActivitySchema = SchemaFactory.createForClass(CardActivity);
CardActivitySchema.virtual('id').get(function () {
  return this._id.toHexString();
});
