import { IsString, MinLength } from 'class-validator';

export class CreateLabelDto {
  @IsString()
  workspace_id: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  color: string;
}
