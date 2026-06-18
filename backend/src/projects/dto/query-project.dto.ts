import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus, Prisma } from '@prisma/client';
import { Transform } from 'class-transformer';
import { trimString } from '../../common/transforms';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryProjectDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search projects by name' })
  @IsOptional()
  @IsString()
  @Transform(trimString)
  search?: string;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({
    enum: ['name', 'createdAt', 'startDate', 'endDate', 'status'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['name', 'createdAt', 'startDate', 'endDate', 'status'])
  sortBy: keyof Prisma.ProjectOrderByWithRelationInput = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: Prisma.SortOrder = 'desc';
}
