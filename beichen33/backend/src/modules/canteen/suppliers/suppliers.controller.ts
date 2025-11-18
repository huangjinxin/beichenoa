import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SuppliersService } from './suppliers.service';

@ApiTags('canteen/suppliers')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('canteen/suppliers')
export class SuppliersController {
  constructor(private suppliersService: SuppliersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all suppliers' })
  async findAll(@Query() query: any) {
    return this.suppliersService.findAll(query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get supplier categories' })
  async getCategories() {
    return this.suppliersService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier by ID' })
  async findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create supplier' })
  async create(@Body() dto: any) {
    return this.suppliersService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update supplier' })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.suppliersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete supplier' })
  async remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}
