import { IsString, MinLength, IsNumber, IsOptional } from 'class-validator';

export class CreateColumnDto {
  @IsString()
  board_id: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsNumber()
  position: number;
}

export class UpdateColumnDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  position?: number;
}

export class ReorderColumnsDto {
  updates: Array<{ id: string; position: number }>;
  board_id?: string;
}
