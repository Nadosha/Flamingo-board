import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class DecomposeCardDto {
  @IsOptional()
  @IsString()
  clarificationAnswer?: string;

  @IsOptional()
  @IsBoolean()
  createCards?: boolean;
}

export class ChatMessageDto {
  @IsString()
  message: string;

  @IsOptional()
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}
