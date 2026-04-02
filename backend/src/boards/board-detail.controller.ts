import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CardsService } from '../cards/cards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('boards/:boardId')
@UseGuards(JwtAuthGuard)
export class BoardDetailController {
  constructor(private cardsService: CardsService) {}

  @Get()
  getBoardWithColumns(@Param('boardId') boardId: string) {
    return this.cardsService.getBoardWithColumns(boardId);
  }

  @Get('members')
  getBoardMembers(@Param('boardId') boardId: string) {
    return this.cardsService.getBoardMembers(boardId);
  }

  @Get('labels')
  getBoardLabels(@Param('boardId') boardId: string) {
    return this.cardsService.getBoardLabels(boardId);
  }
}
