import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IngredientsService } from './ingredients.service';

@ApiTags('canteen/ingredients')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('canteen/ingredients')
export class IngredientsController {
  constructor(private ingredientsService: IngredientsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all ingredients' })
  findAll(@Query('search') search?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.ingredientsService.findAll(search, pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ingredient by id' })
  findOne(@Param('id') id: string) {
    return this.ingredientsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create ingredient' })
  create(@Body() data: any) {
    return this.ingredientsService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update ingredient' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.ingredientsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete ingredient' })
  remove(@Param('id') id: string) {
    return this.ingredientsService.remove(id);
  }
}
