import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StudentsModule } from './modules/students/students.module';
import { ClassesModule } from './modules/classes/classes.module';
import { GrowthRecordsModule } from './modules/growth-records/growth-records.module';
import { CanteenModule } from './modules/canteen/canteen.module';
import { FormsModule } from './modules/forms/forms.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PrismaService } from './prisma.service';

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
  ],
  providers: [PrismaService],
})
export class AppModule {}
