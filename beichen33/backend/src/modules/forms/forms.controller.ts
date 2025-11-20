import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FormsService } from './forms.service';
import { EntityBindingService } from './entity-binding.service';

@ApiTags('forms')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('forms')
export class FormsController {
  constructor(
    private formsService: FormsService,
    private entityBindingService: EntityBindingService,
  ) {}

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

  @Post('templates/:id/share')
  @ApiOperation({ summary: '生成分享链接' })
  generateShareLink(@Param('id') id: string) {
    return this.formsService.generateShareLink(id);
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

  // ==================== 审批功能（旧系统已废弃，等待新系统实现） ====================
  // TODO: 使用新的审批流程系统 (ApprovalFlow, ApprovalNode, ApprovalTask)

  /*
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
  */

  // ==================== 实时计算 ====================

  @Post('calculate/row')
  @ApiOperation({ summary: '计算单行明细' })
  calculateRowTotal(@Body() data: { row: any; columns: any[] }) {
    return this.formsService.calculateRowTotal(data.row, data.columns);
  }

  // ==================== 数据联动 ====================

  @Get('entities/search')
  @ApiOperation({ summary: '统一实体搜索' })
  searchEntities(@Query() query: any, @Request() req: any) {
    return this.entityBindingService.searchEntities({
      entityType: query.entityType,
      keyword: query.keyword,
      filters: query.filters ? JSON.parse(query.filters) : undefined,
      campusId: req.user.campusId,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
    });
  }

  @Get('entities/students')
  @ApiOperation({ summary: '搜索学生' })
  searchStudents(@Query() query: any, @Request() req: any) {
    return this.entityBindingService.searchEntities({
      entityType: 'student',
      keyword: query.keyword,
      filters: query.classId ? { classId: query.classId } : undefined,
      campusId: req.user.campusId,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
    });
  }

  @Get('entities/teachers')
  @ApiOperation({ summary: '搜索教师' })
  searchTeachers(@Query() query: any, @Request() req: any) {
    return this.entityBindingService.searchEntities({
      entityType: 'teacher',
      keyword: query.keyword,
      campusId: req.user.campusId,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
    });
  }

  @Get('entities/classes')
  @ApiOperation({ summary: '搜索班级' })
  searchClasses(@Query() query: any, @Request() req: any) {
    return this.entityBindingService.searchEntities({
      entityType: 'class',
      keyword: query.keyword,
      campusId: req.user.campusId,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 50,
    });
  }

  @Post('validate/unique')
  @ApiOperation({ summary: '唯一性校验' })
  validateUnique(@Body() data: any, @Request() req: any) {
    return this.entityBindingService.validateUnique({
      entityType: data.entityType,
      field: data.field,
      value: data.value,
      excludeId: data.excludeId,
      campusId: req.user.campusId,
    });
  }

  @Post('validate/batch')
  @ApiOperation({ summary: '批量数据校验' })
  validateBatch(@Body() data: any, @Request() req: any) {
    return this.entityBindingService.validateBatch({
      templateId: data.templateId,
      data: data.data,
      campusId: req.user.campusId,
    });
  }

  // ==================== 实体绑定配置 ====================

  @Get('templates/:id/entity-bindings')
  @ApiOperation({ summary: '获取模板的实体绑定配置' })
  getEntityBindings(@Param('id') templateId: string) {
    return this.entityBindingService.getEntityBindings(templateId);
  }

  @Post('templates/:id/entity-bindings')
  @ApiOperation({ summary: '创建实体绑定配置' })
  createEntityBinding(@Param('id') templateId: string, @Body() data: any) {
    return this.entityBindingService.createEntityBinding(templateId, data);
  }

  @Put('entity-bindings/:id')
  @ApiOperation({ summary: '更新实体绑定配置' })
  updateEntityBinding(@Param('id') id: string, @Body() data: any) {
    return this.entityBindingService.updateEntityBinding(id, data);
  }

  @Delete('entity-bindings/:id')
  @ApiOperation({ summary: '删除实体绑定配置' })
  deleteEntityBinding(@Param('id') id: string) {
    return this.entityBindingService.deleteEntityBinding(id);
  }

  // ==================== 数据同步 ====================

  @Post('submissions/:id/sync-entities')
  @ApiOperation({ summary: '执行数据同步到各模块' })
  syncEntities(@Param('id') submissionId: string) {
    return this.entityBindingService.syncEntitiesToModules(submissionId);
  }

  @Post('submissions/:id/process-fields')
  @ApiOperation({ summary: '处理表单提交 - 基于字段模式创建实体' })
  processSubmissionByFieldModes(@Param('id') submissionId: string) {
    return this.entityBindingService.processSubmissionByFieldModes(submissionId);
  }

  @Get('submissions/:id/entity-links')
  @ApiOperation({ summary: '获取表单提交的实体关联记录' })
  getEntityLinks(@Param('id') submissionId: string) {
    return this.entityBindingService.getEntityLinks(submissionId);
  }
}

// ==================== 公开接口（无需认证） ====================

@ApiTags('forms-public')
@Controller('forms/share')
export class FormsPublicController {
  constructor(private formsService: FormsService) {}

  @Get(':token')
  @ApiOperation({ summary: '通过分享token获取表单模板' })
  async getTemplateByShareToken(@Param('token') token: string) {
    const template = await this.formsService.getTemplateByShareToken(token);
    if (!template) {
      throw new HttpException('分享链接无效或已过期', HttpStatus.NOT_FOUND);
    }
    return template;
  }

  @Post(':token/submit')
  @ApiOperation({ summary: '通过分享token提交表单（匿名）' })
  async submitByShareToken(@Param('token') token: string, @Body() data: any) {
    return this.formsService.submitByShareToken(token, data);
  }
}
