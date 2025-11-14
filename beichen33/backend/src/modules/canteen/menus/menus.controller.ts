import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MenusService } from './menus.service';

@ApiTags('canteen/menus')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('canteen/menus')
export class MenusController {
  constructor(private menusService: MenusService) {}

  @Get()
  @ApiOperation({ summary: 'Get menus by date' })
  findByDate(@Query('date') date: string) {
    return this.menusService.findByDate(date);
  }

  @Get(':id/nutrition')
  @ApiOperation({ summary: 'Get menu nutrition analysis' })
  getNutrition(@Param('id') id: string) {
    return this.menusService.getNutrition(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create menu' })
  create(@Body() data: any) {
    return this.menusService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update menu' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.menusService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete menu' })
  remove(@Param('id') id: string) {
    return this.menusService.remove(id);
  }
}
