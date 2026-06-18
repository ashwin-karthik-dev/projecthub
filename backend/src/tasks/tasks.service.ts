import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditEntity, Prisma, Task } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PaginatedResult } from '../common/dto/pagination.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(ownerId: string, dto: CreateTaskDto): Promise<Task> {
    // Ensure the target project exists AND belongs to the current user.
    await this.assertProjectOwnership(ownerId, dto.projectId);

    const task = await this.prisma.task.create({
      data: {
        name: dto.name,
        description: dto.description,
        priority: dto.priority,
        status: dto.status,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        projectId: dto.projectId,
        ownerId,
      },
    });
    await this.audit.record(
      ownerId,
      AuditAction.CREATE,
      AuditEntity.TASK,
      task.id,
      { name: task.name },
    );
    return task;
  }

  async findAll(
    ownerId: string,
    query: QueryTaskDto,
  ): Promise<PaginatedResult<Task>> {
    const where: Prisma.TaskWhereInput = {
      ownerId,
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.search ? { name: { contains: query.search } } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.task.count({ where }),
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

  async findOne(ownerId: string, id: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task || task.ownerId !== ownerId) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async update(ownerId: string, id: string, dto: UpdateTaskDto): Promise<Task> {
    await this.findOne(ownerId, id);

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.dueDate !== undefined
          ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }
          : {}),
      },
    });
    await this.audit.record(ownerId, AuditAction.UPDATE, AuditEntity.TASK, id);
    return task;
  }

  async remove(ownerId: string, id: string): Promise<{ id: string }> {
    await this.findOne(ownerId, id);
    await this.prisma.task.delete({ where: { id } });
    await this.audit.record(ownerId, AuditAction.DELETE, AuditEntity.TASK, id);
    return { id };
  }

  private async assertProjectOwnership(
    ownerId: string,
    projectId: string,
  ): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (!project || project.ownerId !== ownerId) {
      throw new NotFoundException('Project not found');
    }
  }
}
