import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AttendanceService } from './attendance.service';

@ApiTags('attendance')
@Controller('attendance')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('record')
  @ApiOperation({ summary: '创建考勤记录（教师批量点名）' })
  async createAttendanceRecord(
    @Request() req: any,
    @Body()
    body: {
      date: string;
      classId: string;
      attendances: Array<{
        studentId: string;
        status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
        note?: string;
      }>;
    },
  ) {
    return this.attendanceService.createAttendanceRecord({
      date: new Date(body.date),
      classId: body.classId,
      createdBy: req.user.sub,
      attendances: body.attendances,
    });
  }

  @Get('class/:classId/date/:date')
  @ApiOperation({ summary: '查询班级某日考勤记录' })
  async getAttendanceByClassAndDate(
    @Param('classId') classId: string,
    @Param('date') date: string,
  ) {
    return this.attendanceService.getAttendanceByClassAndDate(classId, new Date(date));
  }

  @Get('records')
  @ApiOperation({ summary: '查询考勤记录列表' })
  async getAttendanceRecords(
    @Query('teacherId') teacherId?: string,
    @Query('classId') classId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.attendanceService.getAttendanceRecords({
      teacherId,
      classId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('student/:studentId/history')
  @ApiOperation({ summary: '查询学生考勤历史' })
  async getStudentAttendanceHistory(
    @Param('studentId') studentId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.getStudentAttendanceHistory(
      studentId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新单个学生考勤状态' })
  async updateAttendance(
    @Param('id') id: string,
    @Body() body: { status: string; note?: string },
  ) {
    return this.attendanceService.updateAttendance(id, body.status, body.note);
  }
}
