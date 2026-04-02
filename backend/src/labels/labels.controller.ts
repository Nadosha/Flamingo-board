import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('labels')
@UseGuards(JwtAuthGuard)
export class LabelsController {
  constructor(private labelsService: LabelsService) {}

  @Get()
  getByWorkspace(@Query('workspace_id') workspaceId: string) {
    return this.labelsService.getByWorkspace(workspaceId);
  }

  @Post()
  create(@Body() dto: CreateLabelDto) {
    return this.labelsService.create(dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.labelsService.delete(id);
  }
}
