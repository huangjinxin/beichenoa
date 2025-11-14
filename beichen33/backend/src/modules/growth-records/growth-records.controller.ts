import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { GrowthRecordsService } from './growth-records.service';

@ApiTags('growth-records')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('growth-records')
export class GrowthRecordsController {
  constructor(private growthRecordsService: GrowthRecordsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all growth records' })
  findAll(@Query() query: any) {
    return this.growthRecordsService.findAll(query);
  }

  @Get('timeline/:studentId')
  @ApiOperation({ summary: 'Get student growth timeline' })
  findTimeline(@Param('studentId') studentId: string) {
    return this.growthRecordsService.findTimeline(studentId);
  }

  @Post()
  @ApiOperation({ summary: 'Create growth record' })
  create(@Body() data: any, @Request() req: any) {
    return this.growthRecordsService.create(data, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update growth record' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.growthRecordsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete growth record' })
  remove(@Param('id') id: string) {
    return this.growthRecordsService.remove(id);
  }
}
