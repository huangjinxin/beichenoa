import { IsString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum PositionType {
  PRINCIPAL = 'PRINCIPAL',
  VICE_PRINCIPAL = 'VICE_PRINCIPAL',
  DIRECTOR = 'DIRECTOR',
  FINANCE = 'FINANCE',
  TEACHER = 'TEACHER',
  NURSERY_TEACHER = 'NURSERY_TEACHER',
  LOGISTICS = 'LOGISTICS',
  FRONTLINE = 'FRONTLINE',
  OTHER = 'OTHER',
}

export class CreatePositionDto {
  @ApiProperty({ example: 'Principal' })
  @IsString()
  name: string;

  @ApiProperty({ enum: PositionType })
  @IsEnum(PositionType)
  type: PositionType;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  level: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
