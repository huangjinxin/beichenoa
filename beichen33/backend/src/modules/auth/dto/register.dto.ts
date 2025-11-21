import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, Length, Matches } from 'class-validator';

export class RegisterDto {
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

  @ApiProperty({ description: '性别', example: '男' })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({ description: '出生日期', example: '1990-01-01' })
  @IsDateString()
  @IsNotEmpty()
  birthday: string;

  @ApiProperty({ description: '手机号', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: '地址', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: '密码（默认为123456）', required: false })
  @IsString()
  @IsOptional()
  password?: string;
}
