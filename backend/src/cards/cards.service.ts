import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Card, CardDocument } from "./schemas/card.schema";
import {
  CardActivity,
  CardActivityDocument,
} from "./schemas/card-activity.schema";
import {
  CreateCardDto,
  UpdateCardDto,
  MoveCardDto,
  ReorderCardsDto,
  AddCommentDto,
  ToggleAssigneeDto,
  ToggleLabelDto,
  AppendChatMessageDto,
} from "./dto/card.dto";
import { BoardsService } from "../boards/boards.service";
import { Label, LabelDocument } from "../labels/schemas/label.schema";
import { User, UserDocument } from "../users/schemas/user.schema";
import { RealtimeGateway } from "../realtime/realtime.gateway";

@Injectable()
export class CardsService {
  constructor(
    @InjectModel(Card.name) private cardModel: Model<CardDocument>,
    @InjectModel(CardActivity.name)
    private activityModel: Model<CardActivityDocument>,
    @InjectModel(Label.name) private labelModel: Model<LabelDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private boardsService: BoardsService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  private async getBoardIdForColumn(
    columnId: Types.ObjectId | string,
  ): Promise<string | null> {
    const ColumnModel = (this.cardModel.db as any).model("Column");
    const col = await ColumnModel.findById(columnId).exec();
    return col ? col.board_id.toString() : null;
  }

  private async getBoardIdForCard(card: CardDocument): Promise<string | null> {
    return this.getBoardIdForColumn(card.column_id);
  }

  async createCard(userId: string, dto: CreateCardDto) {
    const card = await this.cardModel.create({
      column_id: new Types.ObjectId(dto.column_id),
      title: dto.title,
      position: dto.position,
      created_by: new Types.ObjectId(userId),
      ...(dto.priority ? { priority: dto.priority } : {}),
    });

    await this.activityModel.create({
      card_id: card._id,
      user_id: new Types.ObjectId(userId),
      type: "card_created",
      content: `Created card "${dto.title}"`,
    });

    const boardId = await this.getBoardIdForColumn(card.column_id);
    if (boardId) this.realtimeGateway.broadcastBoardUpdate(boardId);

    return this.serializeCard(card, [], []);
  }

  async updateCard(cardId: string, userId: string, dto: UpdateCardDto) {
    const updates: any = { ...dto };
    if (dto.column_id) updates.column_id = new Types.ObjectId(dto.column_id);
    if (dto.due_date !== undefined) {
      updates.due_date = dto.due_date ? new Date(dto.due_date) : null;
      delete updates.due_date;
      updates.due_date = dto.due_date ? new Date(dto.due_date) : null;
    }

    const card = await this.cardModel.findByIdAndUpdate(cardId, updates, {
      new: true,
    });
    if (!card) throw new NotFoundException("Card not found");

    if (dto.description !== undefined) {
      await this.activityModel.create({
        card_id: card._id,
        user_id: new Types.ObjectId(userId),
        type: "card_updated",
        content: "Updated card description",
      });
    }

    const boardId = await this.getBoardIdForCard(card);
    if (boardId) this.realtimeGateway.broadcastBoardUpdate(boardId);

    return this.enrichCard(card);
  }

  async moveCard(cardId: string, userId: string, dto: MoveCardDto) {
    const card = await this.cardModel.findByIdAndUpdate(
      cardId,
      {
        column_id: new Types.ObjectId(dto.target_column_id),
        position: dto.target_position,
      },
      { new: true },
    );
    if (!card) throw new NotFoundException("Card not found");

    if (dto.source_column_id !== dto.target_column_id) {
      await this.activityModel.create({
        card_id: card._id,
        user_id: new Types.ObjectId(userId),
        type: "card_moved",
        content: "Moved card to another column",
        metadata: {
          from_column: dto.source_column_id,
          to_column: dto.target_column_id,
        },
      });
    }

    const boardId = await this.getBoardIdForColumn(dto.target_column_id);
    if (boardId) this.realtimeGateway.broadcastBoardUpdate(boardId);

    return { success: true };
  }

  async reorderCards(dto: ReorderCardsDto, boardId?: string) {
    const ops = dto.updates.map(({ id, position, column_id }) =>
      this.cardModel.updateOne(
        { _id: new Types.ObjectId(id) },
        { position, column_id: new Types.ObjectId(column_id) },
      ),
    );
    await Promise.all(ops);
    if (boardId) this.realtimeGateway.broadcastBoardUpdate(boardId);
    return { success: true };
  }

  async deleteCard(cardId: string) {
    const card = await this.cardModel.findById(cardId).exec();
    const boardId = card ? await this.getBoardIdForCard(card) : null;
    await this.cardModel.deleteOne({ _id: cardId });
    await this.activityModel.deleteMany({
      card_id: new Types.ObjectId(cardId),
    });
    if (boardId) this.realtimeGateway.broadcastBoardUpdate(boardId);
    return { success: true };
  }

  async getCardWithRelations(cardId: string) {
    const card = await this.cardModel.findById(cardId).exec();
    if (!card) return null;
    return this.enrichCard(card);
  }

  async addComment(cardId: string, userId: string, dto: AddCommentDto) {
    await this.activityModel.create({
      card_id: new Types.ObjectId(cardId),
      user_id: new Types.ObjectId(userId),
      type: "card_commented",
      content: dto.content,
    });
    return { success: true };
  }

  async addAssignee(cardId: string, userId: string, dto: ToggleAssigneeDto) {
    const oid = new Types.ObjectId(dto.user_id);
    const card = await this.cardModel.findByIdAndUpdate(
      cardId,
      { $addToSet: { assignee_ids: oid } },
      { new: true },
    );
    await this.activityModel.create({
      card_id: new Types.ObjectId(cardId),
      user_id: new Types.ObjectId(userId),
      type: "assignee_added",
      content: "Added assignee",
      metadata: { assignee_id: dto.user_id },
    });
    if (card) {
      const boardId = await this.getBoardIdForCard(card);
      if (boardId) this.realtimeGateway.broadcastBoardUpdate(boardId);
    }
    return { success: true };
  }

  async removeAssignee(cardId: string, userId: string, dto: ToggleAssigneeDto) {
    const oid = new Types.ObjectId(dto.user_id);
    const card = await this.cardModel.findByIdAndUpdate(
      cardId,
      { $pull: { assignee_ids: oid } },
      { new: true },
    );
    if (card) {
      const boardId = await this.getBoardIdForCard(card);
      if (boardId) this.realtimeGateway.broadcastBoardUpdate(boardId);
    }
    return { success: true };
  }

  async addLabel(cardId: string, userId: string, dto: ToggleLabelDto) {
    const oid = new Types.ObjectId(dto.label_id);
    const card = await this.cardModel.findByIdAndUpdate(
      cardId,
      { $addToSet: { label_ids: oid } },
      { new: true },
    );
    await this.activityModel.create({
      card_id: new Types.ObjectId(cardId),
      user_id: new Types.ObjectId(userId),
      type: "label_added",
      content: "Added a label",
      metadata: { label_id: dto.label_id },
    });
    if (card) {
      const boardId = await this.getBoardIdForCard(card);
      if (boardId) this.realtimeGateway.broadcastBoardUpdate(boardId);
    }
    return { success: true };
  }

  async removeLabel(cardId: string, userId: string, dto: ToggleLabelDto) {
    const oid = new Types.ObjectId(dto.label_id);
    const card = await this.cardModel.findByIdAndUpdate(
      cardId,
      { $pull: { label_ids: oid } },
      { new: true },
    );
    if (card) {
      const boardId = await this.getBoardIdForCard(card);
      if (boardId) this.realtimeGateway.broadcastBoardUpdate(boardId);
    }
    return { success: true };
  }

  async getBoardWithColumns(boardId: string) {
    const board = await this.boardsService.getBoardById(boardId);

    const { Column } = await import("../columns/schemas/column.schema");
    const ColumnModel: Model<any> = (this.cardModel.db as any).model("Column");

    const columns = await ColumnModel.find({
      board_id: new Types.ObjectId(boardId),
    })
      .sort({ position: 1 })
      .exec();

    const columnIds = columns.map((c) => c._id);
    const cards = await this.cardModel
      .find({ column_id: { $in: columnIds } })
      .sort({ position: 1 })
      .exec();

    // Collect all unique assignee and label ids
    const allAssigneeIds = [
      ...new Set(
        cards.flatMap((c) => c.assignee_ids.map((id) => id.toString())),
      ),
    ];
    const allLabelIds = [
      ...new Set(cards.flatMap((c) => c.label_ids.map((id) => id.toString()))),
    ];

    const [users, labels] = await Promise.all([
      allAssigneeIds.length
        ? this.userModel
            .find({
              _id: { $in: allAssigneeIds.map((id) => new Types.ObjectId(id)) },
            })
            .exec()
        : [],
      allLabelIds.length
        ? this.labelModel
            .find({
              _id: { $in: allLabelIds.map((id) => new Types.ObjectId(id)) },
            })
            .exec()
        : [],
    ]);

    const usersMap = new Map<string, UserDocument>(
      users.map((u) => [u._id.toString(), u] as [string, UserDocument]),
    );
    const labelsMap = new Map<string, LabelDocument>(
      labels.map((l) => [l._id.toString(), l] as [string, LabelDocument]),
    );

    const columnsWithCards = columns.map((col) => {
      const colCards = cards
        .filter((c) => c.column_id.toString() === col._id.toString())
        .map((card) =>
          this.serializeCard(
            card,
            card.assignee_ids
              .map((id) => usersMap.get(id.toString()))
              .filter(Boolean) as UserDocument[],
            card.label_ids
              .map((id) => labelsMap.get(id.toString()))
              .filter(Boolean) as LabelDocument[],
          ),
        );

      return {
        id: col._id.toString(),
        board_id: col.board_id.toString(),
        name: col.name,
        position: col.position,
        created_at: col.created_at,
        cards: colCards,
      };
    });

    return {
      id: board._id.toString(),
      name: board.name,
      workspace_id: board.workspace_id.toString(),
      color: board.color,
      description: board.description,
      created_by: board.created_by.toString(),
      created_at: (board as any).created_at,
      columns: columnsWithCards,
    };
  }

  async getBoardMembers(boardId: string) {
    const board = await this.boardsService.getBoardById(boardId);
    const WorkspaceMember = (this.cardModel.db as any).model("WorkspaceMember");
    const members = await WorkspaceMember.find({
      workspace_id: new Types.ObjectId(board.workspace_id.toString()),
    })
      .populate("user_id", "email full_name avatar_url")
      .exec();

    return members.map((m: any) => ({
      user_id: m.user_id?._id?.toString() ?? m.user_id?.toString(),
      role: m.role,
      profile: m.user_id
        ? {
            id: m.user_id._id?.toString() ?? m.user_id.toString(),
            full_name: m.user_id.full_name ?? null,
            avatar_url: m.user_id.avatar_url ?? null,
          }
        : null,
    }));
  }

  async getBoardLabels(boardId: string) {
    const board = await this.boardsService.getBoardById(boardId);
    const labels = await this.labelModel
      .find({ workspace_id: board.workspace_id })
      .exec();
    return labels.map((l) => ({
      id: l._id.toString(),
      name: l.name,
      color: l.color,
    }));
  }

  private async enrichCard(card: CardDocument) {
    const assigneeIds = card.assignee_ids ?? [];
    const lblIds = card.label_ids ?? [];

    const [users, labels, activities] = await Promise.all([
      assigneeIds.length
        ? this.userModel.find({ _id: { $in: assigneeIds } }).exec()
        : [],
      lblIds.length
        ? this.labelModel.find({ _id: { $in: lblIds } }).exec()
        : [],
      this.activityModel
        .find({ card_id: card._id })
        .populate("user_id", "full_name avatar_url")
        .sort({ created_at: -1 })
        .exec(),
    ]);

    const usersMap = new Map<string, UserDocument>(
      users.map((u) => [u._id.toString(), u] as [string, UserDocument]),
    );
    const labelsMap = new Map<string, LabelDocument>(
      labels.map((l) => [l._id.toString(), l] as [string, LabelDocument]),
    );

    return {
      ...this.serializeCard(
        card,
        assigneeIds
          .map((id) => usersMap.get(id.toString()))
          .filter(Boolean) as UserDocument[],
        lblIds
          .map((id) => labelsMap.get(id.toString()))
          .filter(Boolean) as LabelDocument[],
      ),
      card_activities: activities.map((a) => {
        const profile = a.user_id as any;
        return {
          id: a._id.toString(),
          type: a.type,
          content: a.content,
          created_at: (a as any).created_at,
          profile: profile
            ? {
                full_name: profile.full_name ?? null,
                avatar_url: profile.avatar_url ?? null,
              }
            : null,
        };
      }),
    };
  }

  serializeCard(
    card: CardDocument,
    assignees: UserDocument[],
    labels: LabelDocument[],
  ) {
    return {
      id: card._id.toString(),
      column_id: card.column_id.toString(),
      title: card.title,
      description: card.description,
      position: card.position,
      due_date: card.due_date ? (card.due_date as Date).toISOString() : null,
      created_by: card.created_by.toString(),
      created_at: (card as any).created_at,
      updated_at: (card as any).updated_at,
      assignees: assignees.map((u) => ({
        user_id: u._id.toString(),
        profile: {
          id: u._id.toString(),
          full_name: u.full_name,
          avatar_url: u.avatar_url,
        },
      })),
      labels: labels.map((l) => ({
        label_id: l._id.toString(),
        label: {
          id: l._id.toString(),
          name: l.name,
          color: l.color,
        },
      })),
      priority: card.priority ?? null,
      subtasks: (card.subtasks ?? []).map((s) => ({
        title: s.title,
        done: s.done,
      })),
    };
  }

  async toggleSubtask(cardId: string, userId: string, index: number) {
    const card = await this.cardModel.findById(cardId).exec();
    if (!card) throw new NotFoundException("Card not found");
    const subtasks = card.subtasks ?? [];
    if (index < 0 || index >= subtasks.length)
      throw new NotFoundException("Subtask not found");
    subtasks[index].done = !subtasks[index].done;
    card.markModified("subtasks");
    await card.save();
    const boardId = await this.getBoardIdForCard(card);
    if (boardId) this.realtimeGateway.broadcastBoardUpdate(boardId);
    return this.enrichCard(card);
  }

  async getChatHistory(cardId: string) {
    const card = await this.cardModel
      .findById(cardId)
      .select("chatHistory")
      .exec();
    if (!card) throw new NotFoundException("Card not found");
    return (card.chatHistory ?? []).map((m) => ({
      role: m.role,
      content: m.content,
      created_at: m.created_at,
    }));
  }

  async appendChatMessage(cardId: string, dto: AppendChatMessageDto) {
    const card = await this.cardModel.findById(cardId).exec();
    if (!card) throw new NotFoundException("Card not found");
    card.chatHistory = card.chatHistory ?? [];
    card.chatHistory.push({
      role: dto.role,
      content: dto.content,
      created_at: new Date(),
    } as any);
    card.markModified("chatHistory");
    await card.save();
    return { ok: true };
  }
}
