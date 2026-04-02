import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { CardsService } from "./cards.service";
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
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  CurrentUser,
  AuthUser,
} from "../auth/decorators/current-user.decorator";

@Controller("cards")
@UseGuards(JwtAuthGuard)
export class CardsController {
  constructor(private cardsService: CardsService) {}

  @Post()
  createCard(@CurrentUser() user: AuthUser, @Body() dto: CreateCardDto) {
    return this.cardsService.createCard(user.id, dto);
  }

  @Patch("reorder")
  reorderCards(@Body() dto: ReorderCardsDto) {
    return this.cardsService.reorderCards(dto, dto.board_id);
  }

  @Get(":id")
  getCard(@Param("id") id: string) {
    return this.cardsService.getCardWithRelations(id);
  }

  @Patch(":id")
  updateCard(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateCardDto,
  ) {
    return this.cardsService.updateCard(id, user.id, dto);
  }

  @Patch(":id/move")
  moveCard(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: MoveCardDto,
  ) {
    return this.cardsService.moveCard(id, user.id, dto);
  }

  @Delete(":id")
  deleteCard(@Param("id") id: string) {
    return this.cardsService.deleteCard(id);
  }

  @Post(":id/comments")
  addComment(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: AddCommentDto,
  ) {
    return this.cardsService.addComment(id, user.id, dto);
  }

  @Post(":id/assignees")
  addAssignee(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: ToggleAssigneeDto,
  ) {
    return this.cardsService.addAssignee(id, user.id, dto);
  }

  @Delete(":id/assignees/:userId")
  removeAssignee(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("userId") userId: string,
  ) {
    return this.cardsService.removeAssignee(id, user.id, { user_id: userId });
  }

  @Post(":id/labels")
  addLabel(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: ToggleLabelDto,
  ) {
    return this.cardsService.addLabel(id, user.id, dto);
  }

  @Delete(":id/labels/:labelId")
  removeLabel(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("labelId") labelId: string,
  ) {
    return this.cardsService.removeLabel(id, user.id, { label_id: labelId });
  }

  @Patch(":id/subtasks/:index/toggle")
  toggleSubtask(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("index") index: string,
  ) {
    return this.cardsService.toggleSubtask(id, user.id, parseInt(index, 10));
  }

  @Get(":id/chat-history")
  getChatHistory(@Param("id") id: string) {
    return this.cardsService.getChatHistory(id);
  }

  @Post(":id/chat-history")
  appendChatMessage(
    @Param("id") id: string,
    @Body() dto: AppendChatMessageDto,
  ) {
    return this.cardsService.appendChatMessage(id, dto);
  }
}
