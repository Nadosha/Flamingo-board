import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WorkspaceMemberDocument = WorkspaceMember & Document;

@Schema({ timestamps: { createdAt: 'joined_at', updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class WorkspaceMember {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspace_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ enum: ['owner', 'admin', 'member'], default: 'member' })
  role: string;
}

export const WorkspaceMemberSchema = SchemaFactory.createForClass(WorkspaceMember);
WorkspaceMemberSchema.index({ workspace_id: 1, user_id: 1 }, { unique: true });
WorkspaceMemberSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
