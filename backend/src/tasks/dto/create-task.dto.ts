import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { trimString } from '../../common/transforms';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Design homepage mockup' })
  @IsString()
  @IsNotEmpty({ message: 'Task name is required' })
  @MaxLength(150)
  @Transform(trimString)
  name: string;

  @ApiPropertyOptional({ example: 'Use the new brand palette' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ description: 'Owning project id' })
  @IsUUID('4', { message: 'projectId must be a valid id' })
  projectId: string;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TaskPriority, { message: 'priority must be LOW, MEDIUM or HIGH' })
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.PENDING })
  @IsOptional()
  @IsEnum(TaskStatus, {
    message: 'status must be PENDING, IN_PROGRESS or COMPLETED',
  })
  status?: TaskStatus;

  @ApiPropertyOptional({ example: '2026-02-15T00:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'dueDate must be a valid ISO date' })
  dueDate?: string;
}
