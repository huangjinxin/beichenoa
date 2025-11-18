import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { DailyObservationController } from './daily-observation.controller';
import { DailyObservationService } from './daily-observation.service';
import { DutyReportController } from './duty-report.controller';
import { DutyReportService } from './duty-report.service';

@Module({
  controllers: [DailyObservationController, DutyReportController],
  providers: [DailyObservationService, DutyReportService, PrismaService],
  exports: [DailyObservationService, DutyReportService],
})
export class RecordsModule {}
