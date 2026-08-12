import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Redirect,
} from '@nestjs/common';
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
  @Redirect(undefined, 302)
  start(@Query() query: GoogleOAuthStartQueryDto) {
    return {
      url: this.googleOAuthService.createAuthorizationUrl(query.returnTo),
    };
  }

  @Get('callback')
  @Public()
  @Redirect(undefined, 302)
  callback(@Query() query: GoogleOAuthCallbackQueryDto) {
    return this.googleOAuthService
      .handleCallback(query.code, query.state)
      .then(({ redirectUrl }) => ({ url: redirectUrl }));
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
