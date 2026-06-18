import { ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { trimString } from '../../common/transforms';
import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryTaskDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search tasks by name' })
  @IsOptional()
  @IsString()
  @Transform(trimString)
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by owning project' })
  @IsOptional()
  @IsUUID('4')
  projectId?: string;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({
    enum: ['name', 'createdAt', 'dueDate', 'priority', 'status'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['name', 'createdAt', 'dueDate', 'priority', 'status'])
  sortBy: keyof Prisma.TaskOrderByWithRelationInput = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: Prisma.SortOrder = 'desc';
}
