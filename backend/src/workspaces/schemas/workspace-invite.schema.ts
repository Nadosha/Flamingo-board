import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as crypto from 'crypto';

export type WorkspaceInviteDocument = WorkspaceInvite & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class WorkspaceInvite {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspace_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  invited_by: Types.ObjectId;

  @Prop({ unique: true, default: () => crypto.randomBytes(32).toString('hex') })
  token: string;

  @Prop({ default: null })
  email: string | null;

  @Prop({
    default: () => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d;
    },
  })
  expires_at: Date;
}

export const WorkspaceInviteSchema = SchemaFactory.createForClass(WorkspaceInvite);
WorkspaceInviteSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
