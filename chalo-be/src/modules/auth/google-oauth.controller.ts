import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import {
  GoogleOAuthCallbackQueryDto,
  GoogleOAuthExchangeDto,
  GoogleOAuthStartQueryDto,
} from './dto/google-oauth.dto';
import { GoogleOAuthService } from './google-oauth.service';

@ApiTags('Auth')
@Controller('auth/google')
export class GoogleOAuthController {
  constructor(private readonly googleOAuthService: GoogleOAuthService) {}

  @Get('start')
  @Public()
  start(
    @Query() query: GoogleOAuthStartQueryDto,
    @Res() response: Response,
  ): void {
    response.redirect(
      302,
      this.googleOAuthService.createAuthorizationUrl(query.returnTo),
    );
  }

  @Get('callback')
  @Public()
  async callback(
    @Query() query: GoogleOAuthCallbackQueryDto,
    @Res() response: Response,
  ): Promise<void> {
    const { redirectUrl } = await this.googleOAuthService.handleCallback(
      query.code,
      query.state,
    );
    response.redirect(302, redirectUrl);
  }

  @Post('exchange')
  @Public()
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Exchange one-time OAuth code for login tokens',
  })
  exchange(@Body() dto: GoogleOAuthExchangeDto) {
    return this.googleOAuthService.exchange(dto.code);
  }
}
