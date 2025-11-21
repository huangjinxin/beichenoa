import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, Length, Matches, IsEnum } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ description: '注册身份类型', enum: ['TEACHER', 'STUDENT'] })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['TEACHER', 'STUDENT'], { message: '角色类型必须是 TEACHER 或 STUDENT' })
  roleType: 'TEACHER' | 'STUDENT';

  @ApiProperty({ description: '姓名' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '身份证号', example: '510123199001011234' })
  @IsString()
  @IsNotEmpty()
  @Length(18, 18, { message: '身份证号必须为18位' })
  @Matches(/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/, {
    message: '身份证号格式不正确'
  })
  idCard: string;

  @ApiProperty({ description: '性别（从身份证自动解析）', example: '男' })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({ description: '出生日期（从身份证自动解析）', example: '1990-01-01' })
  @IsDateString()
  @IsNotEmpty()
  birthday: string;

  @ApiProperty({ description: '校区ID' })
  @IsString()
  @IsNotEmpty()
  campusId: string;

  @ApiProperty({ description: '班级ID' })
  @IsString()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({ description: '职位ID（教师必填）', required: false })
  @IsString()
  @IsOptional()
  positionId?: string;

  @ApiProperty({ description: '手机号（教师必填）', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;

  @ApiProperty({ description: '密码（默认为123456）', required: false })
  @IsString()
  @IsOptional()
  password?: string;
}
