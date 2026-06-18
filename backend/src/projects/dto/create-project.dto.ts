import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { trimString } from '../../common/transforms';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Website Redesign' })
  @IsString()
  @IsNotEmpty({ message: 'Project name is required' })
  @MaxLength(150)
  @Transform(trimString)
  name: string;

  @ApiPropertyOptional({ example: 'Revamp the marketing site' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    enum: ProjectStatus,
    default: ProjectStatus.NOT_STARTED,
  })
  @IsOptional()
  @IsEnum(ProjectStatus, {
    message: 'status must be one of NOT_STARTED, IN_PROGRESS, COMPLETED',
  })
  status?: ProjectStatus;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a valid ISO date' })
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'endDate must be a valid ISO date' })
  endDate?: string;
}
