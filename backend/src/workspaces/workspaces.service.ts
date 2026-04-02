import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Workspace, WorkspaceDocument } from './schemas/workspace.schema';
import { WorkspaceMember, WorkspaceMemberDocument } from './schemas/workspace-member.schema';
import { WorkspaceInvite, WorkspaceInviteDocument } from './schemas/workspace-invite.schema';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(WorkspaceMember.name) private memberModel: Model<WorkspaceMemberDocument>,
    @InjectModel(WorkspaceInvite.name) private inviteModel: Model<WorkspaceInviteDocument>,
  ) {}

  async getUserWorkspaces(userId: string) {
    const memberships = await this.memberModel
      .find({ user_id: new Types.ObjectId(userId) })
      .populate('workspace_id')
      .sort({ joined_at: -1 })
      .exec();

    return memberships.map((m) => {
      const ws = m.workspace_id as any;
      return {
        role: m.role,
        workspace: ws
          ? {
              id: ws._id.toString(),
              name: ws.name,
              slug: ws.slug,
              owner_id: ws.owner_id?.toString(),
              created_at: ws.created_at,
            }
          : null,
      };
    });
  }

  async createWorkspace(userId: string, dto: CreateWorkspaceDto) {
    const baseSlug = slugify(dto.name);
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

    const workspace = await this.workspaceModel.create({
      name: dto.name,
      slug,
      owner_id: new Types.ObjectId(userId),
    });

    await this.memberModel.create({
      workspace_id: workspace._id,
      user_id: new Types.ObjectId(userId),
      role: 'owner',
    });

    return {
      id: workspace._id.toString(),
      name: workspace.name,
      slug: workspace.slug,
      owner_id: userId,
    };
  }

  async deleteWorkspace(workspaceId: string, userId: string) {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) throw new NotFoundException('Workspace not found');
    if (workspace.owner_id.toString() !== userId) throw new ForbiddenException();

    await this.workspaceModel.deleteOne({ _id: workspaceId });
    await this.memberModel.deleteMany({ workspace_id: new Types.ObjectId(workspaceId) });
    await this.inviteModel.deleteMany({ workspace_id: new Types.ObjectId(workspaceId) });
    return { success: true };
  }

  async createInvite(workspaceId: string, userId: string, appUrl: string) {
    const member = await this.memberModel.findOne({
      workspace_id: new Types.ObjectId(workspaceId),
      user_id: new Types.ObjectId(userId),
      role: { $in: ['owner', 'admin'] },
    });
    if (!member) throw new ForbiddenException('Only owners and admins can invite');

    const invite = await this.inviteModel.create({
      workspace_id: new Types.ObjectId(workspaceId),
      invited_by: new Types.ObjectId(userId),
    });

    const url = `${appUrl}/invite/${invite.token}`;
    return { url, token: invite.token };
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.inviteModel.findOne({ token });
    if (!invite) throw new BadRequestException('Invalid or expired invite link');
    if (new Date(invite.expires_at) < new Date())
      throw new BadRequestException('Invite link has expired');

    const workspaceId = invite.workspace_id;

    const existing = await this.memberModel.findOne({
      workspace_id: workspaceId,
      user_id: new Types.ObjectId(userId),
    });

    if (!existing) {
      await this.memberModel.create({
        workspace_id: workspaceId,
        user_id: new Types.ObjectId(userId),
        role: 'member',
      });
    }

    return { workspace_id: workspaceId.toString() };
  }

  async assertMember(workspaceId: string, userId: string) {
    const member = await this.memberModel.findOne({
      workspace_id: new Types.ObjectId(workspaceId),
      user_id: new Types.ObjectId(userId),
    });
    if (!member) throw new ForbiddenException('Not a workspace member');
    return member;
  }

  async getWorkspaceMembers(workspaceId: string) {
    return this.memberModel
      .find({ workspace_id: new Types.ObjectId(workspaceId) })
      .populate('user_id', 'email full_name avatar_url')
      .exec();
  }
}
