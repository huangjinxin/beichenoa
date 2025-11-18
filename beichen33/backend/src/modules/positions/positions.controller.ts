import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ValidationPipe, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PositionsService } from './positions.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';

@ApiTags('positions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('positions')
export class PositionsController {
  constructor(private positionsService: PositionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all positions' })
  findAll() {
    return this.positionsService.findAll();
  }

  @Get('hierarchy')
  @ApiOperation({ summary: 'Get position hierarchy tree' })
  findHierarchy() {
    return this.positionsService.findHierarchy();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get position by id' })
  findOne(@Param('id') id: string) {
    return this.positionsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create position' })
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Body() dto: CreatePositionDto) {
    return this.positionsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update position' })
  @UsePipes(new ValidationPipe({ transform: true }))
  update(@Param('id') id: string, @Body() dto: UpdatePositionDto) {
    return this.positionsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete position' })
  remove(@Param('id') id: string) {
    return this.positionsService.remove(id);
  }
}
