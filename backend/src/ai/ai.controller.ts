import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AiService } from "./ai.service";
import { DecomposeCardDto, ChatMessageDto } from "./dto/ai.dto";

@Controller("ai")
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("boards/:boardId/prioritize")
  prioritize(@Param("boardId") boardId: string) {
    return this.aiService.prioritizeBoard(boardId);
  }

  @Post("cards/:cardId/decompose")
  decompose(
    @Param("cardId") cardId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: DecomposeCardDto,
  ) {
    return this.aiService.decomposeCard(cardId, user.id, {
      clarificationAnswer: dto.clarificationAnswer,
      createCards: dto.createCards,
    });
  }

  @Post("boards/:boardId/standup")
  standup(@Param("boardId") boardId: string) {
    return this.aiService.generateStandup(boardId);
  }

  @Post("cards/:cardId/chat")
  chat(
    @Param("cardId") cardId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ChatMessageDto,
  ) {
    return this.aiService.cardChat(
      cardId,
      user.id,
      dto.message,
      dto.history ?? [],
    );
  }
}
