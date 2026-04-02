import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ default: null })
  full_name: string | null;

  @Prop({ default: null })
  avatar_url: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Virtual id field
UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
