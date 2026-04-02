import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ColumnsService } from './columns.service';
import { CreateColumnDto, UpdateColumnDto, ReorderColumnsDto } from './dto/column.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('columns')
@UseGuards(JwtAuthGuard)
export class ColumnsController {
  constructor(private columnsService: ColumnsService) {}

  @Get()
  getColumns(@Query('board_id') boardId: string) {
    return this.columnsService.getColumnsByBoard(boardId);
  }

  @Post()
  createColumn(@Body() dto: CreateColumnDto) {
    return this.columnsService.createColumn(dto);
  }

  @Patch('reorder')
  reorderColumns(@Body() dto: ReorderColumnsDto) {
    return this.columnsService.reorderColumns(dto);
  }

  @Patch(':id')
  updateColumn(@Param('id') id: string, @Body() dto: UpdateColumnDto) {
    return this.columnsService.updateColumn(id, dto);
  }

  @Delete(':id')
  deleteColumn(@Param('id') id: string) {
    return this.columnsService.deleteColumn(id);
  }
}
