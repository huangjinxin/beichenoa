import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FormsService } from './forms.service';

@ApiTags('forms')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('forms')
export class FormsController {
  constructor(private formsService: FormsService) {}

  @Get('templates')
  @ApiOperation({ summary: 'Get all form templates' })
  findAllTemplates() {
    return this.formsService.findAllTemplates();
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get form template' })
  findTemplate(@Param('id') id: string) {
    return this.formsService.findTemplate(id);
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create form template' })
  createTemplate(@Body() data: any) {
    return this.formsService.createTemplate(data);
  }

  @Get('submissions')
  @ApiOperation({ summary: 'Get all form submissions' })
  findAllSubmissions(@Query() query: any) {
    return this.formsService.findAllSubmissions(query);
  }

  @Post('submissions')
  @ApiOperation({ summary: 'Create form submission' })
  createSubmission(@Body() data: any, @Request() req: any) {
    return this.formsService.createSubmission(data, req.user.userId);
  }

  @Put('submissions/:id')
  @ApiOperation({ summary: 'Update form submission' })
  updateSubmission(@Param('id') id: string, @Body() data: any) {
    return this.formsService.updateSubmission(id, data);
  }
}
