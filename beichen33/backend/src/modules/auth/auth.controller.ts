import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  @Get('debug/users')
  @ApiOperation({ summary: 'Debug: List all users' })
  async debugUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      take: 10,
    });
    return { count: users.length, users };
  }

  @Post('login')
  @ApiOperation({ summary: 'User login (支持邮箱或身份证号)' })
  login(@Body() body: { identifier: string; password: string }) {
    return this.authService.login(body.identifier, body.password);
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  register(@Body() body: { email: string; password: string; name: string; role: string }) {
    return this.authService.register(body.email, body.password, body.name, body.role);
  }
}
