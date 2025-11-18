import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StudentsModule } from './modules/students/students.module';
import { ClassesModule } from './modules/classes/classes.module';
import { GrowthRecordsModule } from './modules/growth-records/growth-records.module';
import { CanteenModule } from './modules/canteen/canteen.module';
import { FormsModule } from './modules/forms/forms.module';
import { ReportsModule } from './modules/reports/reports.module';
import { CampusModule } from './modules/campus/campus.module';
import { PositionsModule } from './modules/positions/positions.module';
import { RecordsModule } from './modules/records/records.module';
import { PrismaService } from './prisma.service';
import { HealthController } from './health.controller';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    StudentsModule,
    ClassesModule,
    GrowthRecordsModule,
    CanteenModule,
    FormsModule,
    ReportsModule,
    CampusModule,
    PositionsModule,
    RecordsModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class AppModule {}
