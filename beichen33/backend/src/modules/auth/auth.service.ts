import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(identifier: string, password: string) {
    try {
      console.log('[AUTH] Login attempt:', { identifier });

      // 支持邮箱或身份证号登录
      let user = await this.prisma.user.findUnique({
        where: { email: identifier },
        include: { campus: true, position: true, classes: true },
      });

      // 如果邮箱未找到，尝试使用身份证号查找
      if (!user && identifier) {
        user = await this.prisma.user.findFirst({
          where: { idCard: identifier },
          include: { campus: true, position: true, classes: true },
        });
      }

      console.log('[AUTH] User found:', user ? `${user.email} (${user.id})` : 'NOT FOUND');

      if (!user) {
        console.log('[AUTH] User not found in database');
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('[AUTH] Password valid:', isPasswordValid);

      if (!isPasswordValid) {
        console.log('[AUTH] Password mismatch');
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = { sub: user.id, email: user.email, role: user.role };
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          campus: user.campus,
          position: user.position,
          classes: user.classes, // 返回教师所带班级
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Login failed');
    }
  }

  async register(email: string, password: string, name: string, role: string, campusId?: string) {
    try {
      const existingUser = await this.prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new BadRequestException('User already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      let finalCampusId = campusId;
      if (!finalCampusId) {
        const firstCampus = await this.prisma.campus.findFirst();
        if (!firstCampus) {
          const defaultCampus = await this.prisma.campus.create({
            data: { name: 'Default Campus', address: 'Default Address' },
          });
          finalCampusId = defaultCampus.id;
        } else {
          finalCampusId = firstCampus.id;
        }
      }

      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role as any,
          campusId: finalCampusId,
        },
      });
      return { id: user.id, email: user.email, name: user.name, role: user.role };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Registration failed');
    }
  }
}
