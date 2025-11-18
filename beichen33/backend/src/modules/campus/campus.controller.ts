import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CampusService } from './campus.service';

@ApiTags('campus')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('campus')
export class CampusController {
  constructor(private campusService: CampusService) {}

  @Get()
  @ApiOperation({ summary: 'Get all campuses' })
  findAll() {
    return this.campusService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campus by id' })
  findOne(@Param('id') id: string) {
    return this.campusService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create campus' })
  create(@Body() data: any) {
    return this.campusService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update campus' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.campusService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete campus' })
  remove(@Param('id') id: string) {
    return this.campusService.remove(id);
  }
}
