import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LabelDocument = Label & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Label {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspace_id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '#0079bf' })
  color: string;
}

export const LabelSchema = SchemaFactory.createForClass(Label);
LabelSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
