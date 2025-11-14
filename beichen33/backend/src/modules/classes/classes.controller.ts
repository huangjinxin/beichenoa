import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ClassesService } from './classes.service';

@ApiTags('classes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('classes')
export class ClassesController {
  constructor(private classesService: ClassesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all classes' })
  findAll() {
    return this.classesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get class by id' })
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create class' })
  create(@Body() data: any) {
    return this.classesService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update class' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.classesService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete class' })
  remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }
}
