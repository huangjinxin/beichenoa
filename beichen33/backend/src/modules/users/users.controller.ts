import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll(@Query('role') role?: string) {
    return this.usersService.findAll(role);
  }

  @Post()
  @ApiOperation({ summary: 'Create user' })
  create(@Body() data: any) {
    return this.usersService.create(data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Get('pending/list')
  @ApiOperation({ summary: '获取待审核用户列表' })
  findPending() {
    return this.usersService.findPendingUsers();
  }

  @Get('statistics/summary')
  @ApiOperation({ summary: '获取用户统计数据' })
  getStatistics() {
    return this.usersService.getStatistics();
  }

  @Post(':id/approve')
  @ApiOperation({ summary: '审核通过用户' })
  approveUser(
    @Param('id') id: string,
    @Body() data: { role: string; campusId: string; adminId: string; note?: string },
  ) {
    return this.usersService.approveUser(id, data);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: '拒绝用户注册' })
  rejectUser(
    @Param('id') id: string,
    @Body() data: { adminId: string; note: string },
  ) {
    return this.usersService.rejectUser(id, data);
  }
}
