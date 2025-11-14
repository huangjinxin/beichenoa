import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { StudentsService } from './students.service';

@ApiTags('students')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('students')
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all students' })
  findAll(@Query('classId') classId?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.studentsService.findAll(classId, pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student by id' })
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create student' })
  create(@Body() data: any) {
    return this.studentsService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update student' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.studentsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete student' })
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
