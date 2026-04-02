import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CardDocument = Card & Document;

@Schema({ _id: false })
export class Subtask {
  @Prop({ required: true })
  title: string;

  @Prop({ default: false })
  done: boolean;
}

export const SubtaskSchema = SchemaFactory.createForClass(Subtask);

@Schema({ _id: false, timestamps: false })
export class ChatMessage {
  @Prop({ required: true, enum: ['user', 'assistant'] })
  role: 'user' | 'assistant';

  @Prop({ required: true })
  content: string;

  @Prop({ default: () => new Date() })
  created_at: Date;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

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

  @Prop({ type: [SubtaskSchema], default: [] })
  subtasks: Subtask[];

  @Prop({ type: [ChatMessageSchema], default: [] })
  chatHistory: ChatMessage[];
}

export const CardSchema = SchemaFactory.createForClass(Card);
CardSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
