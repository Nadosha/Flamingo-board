import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, IsMongoId, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class SubtaskDto {
  @IsString()
  title: string;

  @IsBoolean()
  done: boolean;
}

export class AppendChatMessageDto {
  @IsEnum(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  content: string;
}

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubtaskDto)
  subtasks?: SubtaskDto[];
}

export class MoveCardDto {
  @IsString()
  target_column_id: string;

  @IsNumber()
  target_position: number;

  @IsString()
  source_column_id: string;
}

export class CardReorderItem {
  @IsMongoId()
  id: string;

  @IsNumber()
  position: number;

  @IsMongoId()
  column_id: string;
}

export class ReorderCardsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CardReorderItem)
  updates: CardReorderItem[];

  @IsOptional()
  @IsMongoId()
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
