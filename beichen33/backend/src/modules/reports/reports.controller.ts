import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get system overview' })
  getOverview() {
    return this.reportsService.getOverview();
  }

  @Get('students')
  @ApiOperation({ summary: 'Get student statistics' })
  getStudentStats(@Query('classId') classId?: string) {
    return this.reportsService.getStudentStats(classId);
  }
}
