import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AnnouncementsService } from './announcements.service';

@ApiTags('announcements')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private announcementsService: AnnouncementsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建公告（管理员）' })
  async create(
    @Body()
    body: {
      title: string;
      content: string;
      type?: string;
      priority?: number;
      campusId?: string;
      classIds?: string[];
      publishedAt?: string;
      expiredAt?: string;
    },
  ) {
    return this.announcementsService.create({
      ...body,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
      expiredAt: body.expiredAt ? new Date(body.expiredAt) : undefined,
    });
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询公告列表' })
  async findAll(
    @Query('campusId') campusId?: string,
    @Query('classId') classId?: string,
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.announcementsService.findAll({
      campusId,
      classId,
      type,
      isActive: isActive ? isActive === 'true' : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的公告（教师/家长端）' })
  async findMy(@Request() req: any) {
    return this.announcementsService.findByUser(req.user.sub, req.user.role);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取公告详情' })
  async findOne(@Param('id') id: string) {
    return this.announcementsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新公告' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.announcementsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除公告' })
  async remove(@Param('id') id: string) {
    return this.announcementsService.remove(id);
  }
}
