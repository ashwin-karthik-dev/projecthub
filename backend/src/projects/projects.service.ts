import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, AuditEntity, Prisma, Project } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PaginatedResult } from '../common/dto/pagination.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(ownerId: string, dto: CreateProjectDto): Promise<Project> {
    this.assertDateRange(dto.startDate, dto.endDate);
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        ownerId,
      },
    });
    await this.audit.record(
      ownerId,
      AuditAction.CREATE,
      AuditEntity.PROJECT,
      project.id,
      { name: project.name },
    );
    return project;
  }

  async findAll(
    ownerId: string,
    query: QueryProjectDto,
  ): Promise<PaginatedResult<Project & { _count: { tasks: number } }>> {
    const where: Prisma.ProjectWhereInput = {
      ownerId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { name: { contains: query.search } } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        include: { _count: { select: { tasks: true } } },
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(ownerId: string, id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { _count: { select: { tasks: true } } },
    });
    // Return 404 (not 403) for projects owned by someone else so we don't
    // disclose the existence of another user's resources.
    if (!project || project.ownerId !== ownerId) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async update(
    ownerId: string,
    id: string,
    dto: UpdateProjectDto,
  ): Promise<Project> {
    await this.findOne(ownerId, id);
    this.assertDateRange(dto.startDate, dto.endDate);

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.startDate !== undefined
          ? { startDate: dto.startDate ? new Date(dto.startDate) : null }
          : {}),
        ...(dto.endDate !== undefined
          ? { endDate: dto.endDate ? new Date(dto.endDate) : null }
          : {}),
      },
    });
    await this.audit.record(
      ownerId,
      AuditAction.UPDATE,
      AuditEntity.PROJECT,
      id,
    );
    return project;
  }

  async remove(ownerId: string, id: string): Promise<{ id: string }> {
    await this.findOne(ownerId, id);
    await this.prisma.project.delete({ where: { id } });
    await this.audit.record(
      ownerId,
      AuditAction.DELETE,
      AuditEntity.PROJECT,
      id,
    );
    return { id };
  }

  private assertDateRange(start?: string, end?: string): void {
    if (start && end && new Date(start) > new Date(end)) {
      throw new BadRequestException('startDate must be before endDate');
    }
  }
}
