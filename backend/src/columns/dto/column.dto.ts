import { IsString, MinLength, IsNumber, IsOptional, IsArray, ValidateNested, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

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

export class ColumnReorderItem {
  @IsMongoId()
  id: string;

  @IsNumber()
  position: number;
}

export class ReorderColumnsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnReorderItem)
  updates: ColumnReorderItem[];

  @IsOptional()
  @IsMongoId()
  board_id?: string;
}
