import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Label, LabelDocument } from './schemas/label.schema';
import { CreateLabelDto } from './dto/create-label.dto';

@Injectable()
export class LabelsService {
  constructor(@InjectModel(Label.name) private labelModel: Model<LabelDocument>) {}

  async getByWorkspace(workspaceId: string) {
    const labels = await this.labelModel
      .find({ workspace_id: new Types.ObjectId(workspaceId) })
      .exec();
    return labels.map((l) => ({
      id: l._id.toString(),
      workspace_id: l.workspace_id.toString(),
      name: l.name,
      color: l.color,
    }));
  }

  async create(dto: CreateLabelDto) {
    const label = await this.labelModel.create({
      workspace_id: new Types.ObjectId(dto.workspace_id),
      name: dto.name.trim(),
      color: dto.color,
    });
    return { id: label._id.toString(), name: label.name, color: label.color };
  }

  async delete(labelId: string) {
    await this.labelModel.deleteOne({ _id: labelId });
    return { success: true };
  }
}
