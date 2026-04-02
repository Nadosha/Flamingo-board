import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('boards')
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(private boardsService: BoardsService) {}

  @Get()
  getBoards(@CurrentUser() user: AuthUser, @Query('workspace_id') workspaceId: string) {
    return this.boardsService.getBoards(workspaceId, user.id);
  }

  @Post()
  createBoard(@CurrentUser() user: AuthUser, @Body() dto: CreateBoardDto) {
    return this.boardsService.createBoard(user.id, dto);
  }

  @Delete(':id')
  deleteBoard(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.boardsService.deleteBoard(id, user.id);
  }
}
