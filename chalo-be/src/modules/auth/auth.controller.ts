import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  Res,
  UnauthorizedException,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../../common/decorators/public.decorator';
import type { Request as ExpressRequest, Response } from 'express';
import { AUTH_COOKIES, clearAuthCookies, readRequestCookie, setAuthCookies } from './auth-cookie';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Login success',
    schema: { example: { code: 200, message: 'success', data: { user: { id: 1, username: 'admin', role: 'ADMIN', permission: ['menu:write'] } } } },
  })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.authService.login(dto.username, dto.password);
    setAuthCookies(response, session, session.user.role, process.env.NODE_ENV === 'production');
    return { user: session.user };
  }

  @Post('register')
  @Public()
  @ApiOkResponse({
    description: 'Register success',
    schema: {
      example: {
        code: 201,
        message: 'success',
        data: {
          user: { id: 5, username: 'customer01', fullName: 'Nguyễn Văn Khách', avatar: null, role: 'CUSTOMER', permission: [] },
        },
      },
    },
  })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.authService.register(dto);
    setAuthCookies(response, session, session.user.role, process.env.NODE_ENV === 'production');
    return { user: session.user };
  }

  @Post('refresh-token')
  @Public()
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Refresh token success',
    schema: { example: { code: 200, message: 'success', data: { user: { id: 1, role: 'ADMIN' } } } },
  })
  async refresh(
    @Request() request: ExpressRequest,
    @Body() dto: Partial<RefreshTokenDto> | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken =
      readRequestCookie(request.headers.cookie, AUTH_COOKIES.refresh) ?? dto?.refreshToken;
    if (!refreshToken) throw new UnauthorizedException('Thiếu refresh token');
    const session = await this.authService.refresh(refreshToken);
    setAuthCookies(response, session, session.user.role, process.env.NODE_ENV === 'production');
    return { user: session.user };
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Logout success',
    schema: { example: { code: 200, message: 'success', data: null } },
  })
  async logout(
    @Request() req: ExpressRequest & { user: { id: number } },
    @Res({ passthrough: true }) response: Response,
  ) {
    clearAuthCookies(response, process.env.NODE_ENV === 'production');
    return this.authService.logout(req.user.id);
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({
    description: 'Current user info',
    schema: { example: { code: 200, message: 'success', data: { id: 1, username: 'admin', fullName: 'Admin', role: 'ADMIN', permission: ['menu:write'] } } },
  })
  me(@Request() req: ExpressRequest & { user: { id: number } }) {
    return this.authService.me(req.user.id);
  }
}
