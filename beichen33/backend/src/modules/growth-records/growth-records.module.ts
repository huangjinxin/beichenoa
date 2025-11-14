import { Module } from '@nestjs/common';
import { GrowthRecordsController } from './growth-records.controller';
import { GrowthRecordsService } from './growth-records.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [GrowthRecordsController],
  providers: [GrowthRecordsService, PrismaService],
})
export class GrowthRecordsModule {}
