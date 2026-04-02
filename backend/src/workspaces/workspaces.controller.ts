import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { Request } from 'express';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Get()
  getUserWorkspaces(@CurrentUser() user: AuthUser) {
    return this.workspacesService.getUserWorkspaces(user.id);
  }

  @Post()
  createWorkspace(@CurrentUser() user: AuthUser, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.createWorkspace(user.id, dto);
  }

  @Delete(':id')
  deleteWorkspace(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.workspacesService.deleteWorkspace(id, user.id);
  }

  @Post(':id/invite')
  createInvite(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const appUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    return this.workspacesService.createInvite(id, user.id, appUrl);
  }

  @Post('invites/:token/accept')
  acceptInvite(@CurrentUser() user: AuthUser, @Param('token') token: string) {
    return this.workspacesService.acceptInvite(token, user.id);
  }
}
