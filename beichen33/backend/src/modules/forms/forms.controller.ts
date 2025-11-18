import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FormsService } from './forms.service';

@ApiTags('forms')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('forms')
export class FormsController {
  constructor(private formsService: FormsService) {}

  // ==================== 模板管理 ====================

  @Get('templates')
  @ApiOperation({ summary: '获取所有表单模板' })
  findAllTemplates(@Query() query: any) {
    return this.formsService.findAllTemplates(query);
  }

  @Get('templates/presets')
  @ApiOperation({ summary: '获取预置模板列表' })
  getPresetTemplates() {
    return this.formsService.getPresetTemplates();
  }

  @Get('templates/:id')
  @ApiOperation({ summary: '获取表单模板详情' })
  findTemplate(@Param('id') id: string) {
    return this.formsService.findTemplate(id);
  }

  @Post('templates')
  @ApiOperation({ summary: '创建表单模板' })
  createTemplate(@Body() data: any) {
    return this.formsService.createTemplate(data);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: '更新表单模板' })
  updateTemplate(@Param('id') id: string, @Body() data: any) {
    return this.formsService.updateTemplate(id, data);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: '删除表单模板' })
  deleteTemplate(@Param('id') id: string) {
    return this.formsService.deleteTemplate(id);
  }

  @Post('templates/from-preset')
  @ApiOperation({ summary: '从预置模板创建' })
  createFromPreset(@Body() data: { presetId: string; title?: string }) {
    return this.formsService.createFromPreset(data.presetId, data.title);
  }

  @Post('templates/init-presets')
  @ApiOperation({ summary: '初始化预置模板' })
  initPresetTemplates() {
    return this.formsService.initPresetTemplates();
  }

  // ==================== 表单提交 ====================

  @Get('submissions')
  @ApiOperation({ summary: '获取表单提交列表' })
  findAllSubmissions(@Query() query: any) {
    return this.formsService.findAllSubmissions(query);
  }

  @Get('submissions/:id')
  @ApiOperation({ summary: '获取表单提交详情' })
  findSubmission(@Param('id') id: string) {
    return this.formsService.findSubmission(id);
  }

  @Post('submissions')
  @ApiOperation({ summary: '创建表单提交' })
  createSubmission(@Body() data: any, @Request() req: any) {
    return this.formsService.createSubmission(data, req.user.userId);
  }

  @Put('submissions/:id')
  @ApiOperation({ summary: '更新表单提交' })
  updateSubmission(@Param('id') id: string, @Body() data: any) {
    return this.formsService.updateSubmission(id, data);
  }

  // ==================== 审批功能 ====================

  @Post('submissions/:id/approve')
  @ApiOperation({ summary: '审批表单提交（通过/驳回/退回）' })
  approveSubmission(
    @Param('id') id: string,
    @Body() data: { action: 'APPROVE' | 'REJECT' | 'RETURN'; comment?: string },
    @Request() req: any,
  ) {
    return this.formsService.approveSubmission(id, req.user.userId, data.action, data.comment);
  }

  @Get('approvals/pending')
  @ApiOperation({ summary: '获取我的待审批列表' })
  getMyPendingApprovals(@Query() query: any, @Request() req: any) {
    return this.formsService.getMyPendingApprovals(req.user.userId, query);
  }

  @Get('approvals/approved')
  @ApiOperation({ summary: '获取我已审批的列表' })
  getMyApprovedList(@Query() query: any, @Request() req: any) {
    return this.formsService.getMyApprovedList(req.user.userId, query);
  }

  // ==================== 实时计算 ====================

  @Post('calculate/row')
  @ApiOperation({ summary: '计算单行明细' })
  calculateRowTotal(@Body() data: { row: any; columns: any[] }) {
    return this.formsService.calculateRowTotal(data.row, data.columns);
  }
}
