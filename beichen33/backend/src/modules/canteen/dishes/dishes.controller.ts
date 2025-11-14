import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DishesService } from './dishes.service';

@ApiTags('canteen/dishes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('canteen/dishes')
export class DishesController {
  constructor(private dishesService: DishesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all dishes' })
  findAll(@Query('category') category?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.dishesService.findAll(category, pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dish by id with nutrition' })
  findOne(@Param('id') id: string) {
    return this.dishesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create dish' })
  create(@Body() data: any) {
    return this.dishesService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update dish' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.dishesService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete dish' })
  remove(@Param('id') id: string) {
    return this.dishesService.remove(id);
  }
}
