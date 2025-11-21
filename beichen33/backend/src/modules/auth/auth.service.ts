import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';
import * as pinyin from 'pinyin';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * 将中文名字转换为拼音
   * @param name 中文名字
   * @returns 拼音全拼（小写，无空格）
   */
  private nameToPinyin(name: string): string {
    // @ts-ignore
    const pinyinArray = pinyin(name, {
      style: 'normal',
      heteronym: false,
    });
    // 拼接所有拼音，转小写
    return pinyinArray.map((item: any) => item[0]).join('').toLowerCase();
  }

  /**
   * 生成邮箱地址
   * @param name 中文名字
   * @returns email地址（名字全拼@guchengbeiyou.cn）
   */
  private generateEmail(name: string): string {
    const pinyinName = this.nameToPinyin(name);
    return `${pinyinName}@guchengbeiyou.cn`;
  }

  /**
   * 检查邮箱是否已存在，如果存在则添加数字后缀
   * @param baseEmail 基础邮箱
   * @returns 可用的邮箱地址
   */
  private async getUniqueEmail(baseEmail: string): Promise<string> {
    let email = baseEmail;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!existing) {
        return email;
      }

      // 邮箱已存在，添加数字后缀
      const [localPart, domain] = baseEmail.split('@');
      email = `${localPart}${counter}@${domain}`;
      counter++;
    }
  }

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
        throw new UnauthorizedException('用户名或密码错误');
      }

      // 检查审核状态
      if (user.approvalStatus === 'PENDING') {
        throw new UnauthorizedException('您的账号正在审核中，请等待管理员审核通过后再登录');
      }

      if (user.approvalStatus === 'REJECTED') {
        throw new UnauthorizedException('您的账号审核未通过，如有疑问请联系管理员');
      }

      // 检查账号是否被禁用
      if (!user.isActive) {
        throw new UnauthorizedException('您的账号已被禁用，请联系管理员');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('[AUTH] Password valid:', isPasswordValid);

      if (!isPasswordValid) {
        console.log('[AUTH] Password mismatch');
        throw new UnauthorizedException('用户名或密码错误');
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

  /**
   * 用户注册（自助注册）
   * @param data 注册数据
   */
  async register(data: {
    name: string;
    idCard: string;
    gender: string;
    birthday: string;
    phone?: string;
    address?: string;
    password?: string;
  }) {
    try {
      console.log('[AUTH] Registration attempt:', { name: data.name, idCard: data.idCard });

      // 1. 检查身份证号是否已被注册
      const existingUserByIdCard = await this.prisma.user.findUnique({
        where: { idCard: data.idCard },
      });

      if (existingUserByIdCard) {
        throw new BadRequestException('该身份证号已被注册');
      }

      // 2. 自动生成邮箱（名字全拼@guchengbeiyou.cn）
      const baseEmail = this.generateEmail(data.name);
      const email = await this.getUniqueEmail(baseEmail);

      console.log('[AUTH] Generated email:', email);

      // 3. 密码处理（默认123456）
      const password = data.password || '123456';
      const hashedPassword = await bcrypt.hash(password, 10);

      // 4. 创建用户（状态为待审核）
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: data.name,
          idCard: data.idCard,
          gender: data.gender,
          birthday: new Date(data.birthday),
          phone: data.phone,
          // 审核相关字段
          approvalStatus: 'PENDING', // 待审核
          // role 在审核通过时由管理员分配
          // campusId 在审核通过时由管理员分配
        },
      });

      console.log('[AUTH] User registered successfully:', user.id);

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        idCard: user.idCard,
        approvalStatus: user.approvalStatus,
        message: '注册成功！请等待管理员审核。审核通过后，您可以使用邮箱或身份证号登录。',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('[AUTH] Registration error:', error);
      throw new InternalServerErrorException('注册失败，请稍后重试');
    }
  }
}
