import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NutritionService } from './nutrition.service';

@ApiTags('canteen/nutrition')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('canteen/nutrition')
export class NutritionController {
  constructor(private nutritionService: NutritionService) {}

  @Get('analyze')
  @ApiOperation({ summary: 'Get nutrition analysis' })
  analyze(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('grade') grade?: string,
  ) {
    return this.nutritionService.analyze(startDate, endDate, grade);
  }

  @Get('weekly-report')
  @ApiOperation({ summary: 'Get detailed weekly menu report' })
  weeklyReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('grade') grade?: string,
  ) {
    return this.nutritionService.getWeeklyReport(startDate, endDate, grade);
  }

  // ==================== 营养标准管理 ====================

  @Get('standards')
  @ApiOperation({ summary: 'Get all nutrition standards' })
  findAllStandards() {
    return this.nutritionService.findAllNutritionStandards();
  }

  @Get('standards/recommended')
  @ApiOperation({ summary: 'Get recommended nutrition standards' })
  getRecommendedStandards() {
    return this.nutritionService.getRecommendedStandards();
  }

  @Post('standards')
  @ApiOperation({ summary: 'Create or update nutrition standard' })
  upsertStandard(@Body() data: any) {
    return this.nutritionService.upsertNutritionStandard(data);
  }

  @Post('standards/apply-recommended')
  @ApiOperation({ summary: 'Apply recommended nutrition standards' })
  applyRecommendedStandards() {
    return this.nutritionService.applyRecommendedStandards();
  }
}
