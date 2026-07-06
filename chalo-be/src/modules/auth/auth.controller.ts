import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Login success',
    schema: { example: { code: 200, message: 'success', data: { accessToken: 'eyJ...', refreshToken: 'eyJ...', user: { id: 1, username: 'admin', role: 'ADMIN', permission: ['menu:write'] } } } },
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
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
          accessToken: 'eyJ...',
          refreshToken: 'eyJ...',
          user: { id: 5, username: 'customer01', fullName: 'Nguyễn Văn Khách', avatar: null, role: 'CUSTOMER', permission: [] },
        },
      },
    },
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('refresh-token')
  @Public()
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Refresh token success',
    schema: { example: { code: 200, message: 'success', data: { accessToken: 'eyJ...', refreshToken: 'eyJ...' } } },
  })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Logout success',
    schema: { example: { code: 200, message: 'success', data: null } },
  })
  logout(@Request() req: Express.Request & { user: { id: number } }) {
    return this.authService.logout(req.user.id);
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({
    description: 'Current user info',
    schema: { example: { code: 200, message: 'success', data: { id: 1, username: 'admin', fullName: 'Admin', role: 'ADMIN', permission: ['menu:write'] } } },
  })
  me(@Request() req: Express.Request & { user: { id: number } }) {
    return this.authService.me(req.user.id);
  }
}
