import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PurchaseService } from './purchase.service';

@ApiTags('canteen/purchase')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('canteen/purchase')
export class PurchaseController {
  constructor(private purchaseService: PurchaseService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate purchase plan from menus' })
  async generatePurchasePlan(@Body() dto: any, @Request() req: any) {
    return this.purchaseService.generatePurchasePlan(dto, req.user.userId);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all purchase plans' })
  async findAll(@Query() query: any) {
    return this.purchaseService.findAll(query);
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get purchase plan by ID' })
  async findOne(@Param('id') id: string) {
    return this.purchaseService.findOne(id);
  }

  @Post('plans/:id/confirm')
  @ApiOperation({ summary: 'Confirm purchase plan' })
  async confirmPlan(@Param('id') id: string) {
    return this.purchaseService.updateStatus(id, 'CONFIRMED');
  }

  @Post('plans/:id/order')
  @ApiOperation({ summary: 'Mark purchase plan as ordered' })
  async orderPlan(@Param('id') id: string) {
    return this.purchaseService.updateStatus(id, 'ORDERED');
  }

  @Post('plans/:id/complete')
  @ApiOperation({ summary: 'Mark purchase plan as completed' })
  async completePlan(@Param('id') id: string) {
    return this.purchaseService.updateStatus(id, 'COMPLETED');
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Delete purchase plan' })
  async deletePlan(@Param('id') id: string) {
    return this.purchaseService.deletePlan(id);
  }
}
