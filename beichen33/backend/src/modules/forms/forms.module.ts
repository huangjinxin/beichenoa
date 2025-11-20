import { Module } from '@nestjs/common';
import { FormsController, FormsPublicController } from './forms.controller';
import { FormsService } from './forms.service';
import { EntityBindingService } from './entity-binding.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [FormsController, FormsPublicController],
  providers: [FormsService, EntityBindingService, PrismaService],
  exports: [EntityBindingService],
})
export class FormsModule {}
