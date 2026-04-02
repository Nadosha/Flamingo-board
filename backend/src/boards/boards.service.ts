import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Board, BoardDocument } from './schemas/board.schema';
import { CreateBoardDto } from './dto/create-board.dto';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class BoardsService {
  constructor(
    @InjectModel(Board.name) private boardModel: Model<BoardDocument>,
    private workspacesService: WorkspacesService,
  ) {}

  async getBoards(workspaceId: string, userId: string) {
    await this.workspacesService.assertMember(workspaceId, userId);
    const boards = await this.boardModel
      .find({ workspace_id: new Types.ObjectId(workspaceId) })
      .sort({ created_at: -1 })
      .exec();
    return boards.map((b) => this.serialize(b));
  }

  async createBoard(userId: string, dto: CreateBoardDto) {
    await this.workspacesService.assertMember(dto.workspace_id, userId);
    const board = await this.boardModel.create({
      name: dto.name,
      workspace_id: new Types.ObjectId(dto.workspace_id),
      color: dto.color ?? '#0079bf',
      description: dto.description ?? null,
      created_by: new Types.ObjectId(userId),
    });
    return this.serialize(board);
  }

  async deleteBoard(boardId: string, userId: string) {
    const board = await this.boardModel.findById(boardId);
    if (!board) throw new NotFoundException('Board not found');
    await this.workspacesService.assertMember(board.workspace_id.toString(), userId);
    await this.boardModel.deleteOne({ _id: boardId });
    return { success: true };
  }

  async getBoardById(boardId: string): Promise<BoardDocument> {
    const board = await this.boardModel.findById(boardId).exec();
    if (!board) throw new NotFoundException('Board not found');
    return board;
  }

  serialize(board: BoardDocument) {
    return {
      id: board._id.toString(),
      name: board.name,
      workspace_id: board.workspace_id.toString(),
      color: board.color,
      description: board.description,
      created_by: board.created_by.toString(),
      created_at: (board as any).created_at,
    };
  }
}
