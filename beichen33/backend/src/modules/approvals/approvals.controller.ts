import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ApprovalsService } from './approvals.service';
import { Request } from 'express';

@ApiTags('approvals')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('approvals')
export class ApprovalsController {
  constructor(private approvalsService: ApprovalsService) {}

  // ==================== 审批流程管理 ====================

  @Get('flows')
  @ApiOperation({ summary: '获取审批流程列表' })
  findAllFlows(@Query() query: any) {
    return this.approvalsService.findAllFlows(query);
  }

  @Get('flows/:id')
  @ApiOperation({ summary: '获取审批流程详情' })
  findFlow(@Param('id') id: string) {
    return this.approvalsService.findFlow(id);
  }

  @Get('flows/template/:templateId')
  @ApiOperation({ summary: '获取表单模板关联的审批流程' })
  findFlowsByTemplate(@Param('templateId') templateId: string) {
    return this.approvalsService.findFlowsByTemplate(templateId);
  }

  @Post('flows')
  @ApiOperation({ summary: '创建审批流程' })
  createFlow(@Body() data: any) {
    return this.approvalsService.createFlow(data);
  }

  @Put('flows/:id')
  @ApiOperation({ summary: '更新审批流程' })
  updateFlow(@Param('id') id: string, @Body() data: any) {
    return this.approvalsService.updateFlow(id, data);
  }

  @Delete('flows/:id')
  @ApiOperation({ summary: '删除审批流程' })
  deleteFlow(@Param('id') id: string) {
    return this.approvalsService.deleteFlow(id);
  }

  // ==================== 审批节点管理 ====================

  @Post('flows/:flowId/nodes')
  @ApiOperation({ summary: '添加审批节点' })
  addNode(@Param('flowId') flowId: string, @Body() data: any) {
    return this.approvalsService.addNode(flowId, data);
  }

  @Put('nodes/:nodeId')
  @ApiOperation({ summary: '更新审批节点' })
  updateNode(@Param('nodeId') nodeId: string, @Body() data: any) {
    return this.approvalsService.updateNode(nodeId, data);
  }

  @Delete('nodes/:nodeId')
  @ApiOperation({ summary: '删除审批节点' })
  deleteNode(@Param('nodeId') nodeId: string) {
    return this.approvalsService.deleteNode(nodeId);
  }

  @Put('flows/:flowId/nodes/reorder')
  @ApiOperation({ summary: '重新排序节点' })
  reorderNodes(@Param('flowId') flowId: string, @Body() data: { nodeIds: string[] }) {
    return this.approvalsService.reorderNodes(flowId, data.nodeIds);
  }

  // ==================== 流程绑定 ====================

  @Post('flows/:flowId/bind/:templateId')
  @ApiOperation({ summary: '绑定审批流程到表单模板' })
  bindFlowToTemplate(
    @Param('flowId') flowId: string,
    @Param('templateId') templateId: string,
  ) {
    return this.approvalsService.bindFlowToTemplate(flowId, templateId);
  }

  @Delete('flows/:flowId/unbind')
  @ApiOperation({ summary: '解除流程与模板的绑定' })
  unbindFlowFromTemplate(@Param('flowId') flowId: string) {
    return this.approvalsService.unbindFlowFromTemplate(flowId);
  }

  // ==================== 审批人选项 ====================

  @Get('approvers')
  @ApiOperation({ summary: '获取可选审批人列表' })
  getApproverOptions(@Query() query: any) {
    return this.approvalsService.getApproverOptions(query);
  }

  @Get('roles')
  @ApiOperation({ summary: '获取角色列表' })
  getRoleOptions() {
    return this.approvalsService.getRoleOptions();
  }

  @Get('positions')
  @ApiOperation({ summary: '获取职位列表' })
  getPositionOptions() {
    return this.approvalsService.getPositionOptions();
  }

  @Get('users/by-role/:role')
  @ApiOperation({ summary: '根据角色获取用户列表' })
  getUsersByRole(@Param('role') role: string) {
    return this.approvalsService.getUsersByRole(role);
  }

  @Get('users/by-position/:positionId')
  @ApiOperation({ summary: '根据职位获取用户列表' })
  getUsersByPosition(@Param('positionId') positionId: string) {
    return this.approvalsService.getUsersByPosition(positionId);
  }

  @Get('users/superior/:userId')
  @ApiOperation({ summary: '获取用户的上级' })
  getSuperior(@Param('userId') userId: string) {
    return this.approvalsService.getSuperior(userId);
  }

  // ==================== 审批任务管理 ====================

  @Get('tasks/pending')
  @ApiOperation({ summary: '获取我的待审批任务' })
  getMyPendingTasks(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.approvalsService.getMyPendingTasks(userId);
  }

  @Get('tasks/completed')
  @ApiOperation({ summary: '获取我的已审批任务' })
  getMyCompletedTasks(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.approvalsService.getMyCompletedTasks(userId);
  }

  @Post('tasks/:taskId/process')
  @ApiOperation({ summary: '处理审批任务' })
  processApprovalTask(
    @Param('taskId') taskId: string,
    @Req() req: Request,
    @Body() data: { action: 'APPROVE' | 'REJECT' | 'RETURN'; comment?: string },
  ) {
    const userId = (req.user as any).id;
    return this.approvalsService.processApprovalTask(taskId, userId, data.action, data.comment);
  }

  @Post('submissions/:submissionId/start')
  @ApiOperation({ summary: '启动审批流程' })
  startApprovalFlow(
    @Param('submissionId') submissionId: string,
    @Body() data: { flowId: string },
  ) {
    return this.approvalsService.startApprovalFlow(submissionId, data.flowId);
  }

  @Get('submissions/:submissionId/history')
  @ApiOperation({ summary: '获取审批历史' })
  getApprovalHistory(@Param('submissionId') submissionId: string) {
    return this.approvalsService.getApprovalHistory(submissionId);
  }
}
