import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class CreateCardDto {
  @IsString()
  column_id: string;

  @IsString()
  title: string;

  @IsNumber()
  position: number;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high';
}

export class UpdateCardDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  column_id?: string;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  due_date?: string | null;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', null])
  priority?: 'low' | 'medium' | 'high' | null;
}

export class MoveCardDto {
  @IsString()
  target_column_id: string;

  @IsNumber()
  target_position: number;

  @IsString()
  source_column_id: string;
}

export class ReorderCardsDto {
  updates: Array<{ id: string; position: number; column_id: string }>;
  board_id?: string;
}

export class AddCommentDto {
  @IsString()
  content: string;
}

export class ToggleAssigneeDto {
  @IsString()
  user_id: string;
}

export class ToggleLabelDto {
  @IsString()
  label_id: string;
}
