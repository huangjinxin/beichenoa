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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DutyReportService } from './duty-report.service';

@ApiTags('records/duty-report')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('records/duty-report')
export class DutyReportController {
  constructor(private service: DutyReportService) {}

  @Post()
  @ApiOperation({ summary: 'Create duty report record' })
  create(@Body() dto: any, @Req() req: any) {
    return this.service.create(dto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all duty report records' })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get duty report record by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update duty report record' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete duty report record' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
