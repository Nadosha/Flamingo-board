import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).select('+password').exec();
  }

  async findByEmailPublic(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async create(data: { email: string; password: string; full_name?: string }): Promise<UserDocument> {
    const user = new this.userModel(data);
    return user.save();
  }

  async findManyByIds(ids: string[]): Promise<UserDocument[]> {
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    return this.userModel.find({ _id: { $in: objectIds } }).exec();
  }

  serializeUser(user: UserDocument) {
    return {
      id: user._id.toString(),
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
    };
  }
}
