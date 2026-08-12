import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class GoogleOAuthStartQueryDto {
  @IsOptional()
  @IsString()
  returnTo?: string;
}

export class GoogleOAuthCallbackQueryDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  state: string;
}

export class GoogleOAuthExchangeDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{40,}$/)
  code: string;
}
