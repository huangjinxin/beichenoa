import { Module } from '@nestjs/common';
import { CampusController } from './campus.controller';
import { CampusService } from './campus.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [CampusController],
  providers: [CampusService, PrismaService],
})
export class CampusModule {}
