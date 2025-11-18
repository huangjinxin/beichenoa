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
import { DailyObservationService } from './daily-observation.service';

@ApiTags('records/daily-observation')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('records/daily-observation')
export class DailyObservationController {
  constructor(private service: DailyObservationService) {}

  @Post()
  @ApiOperation({ summary: 'Create daily observation record' })
  create(@Body() dto: any, @Req() req: any) {
    return this.service.create(dto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all daily observation records' })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get daily observation record by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update daily observation record' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete daily observation record' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
