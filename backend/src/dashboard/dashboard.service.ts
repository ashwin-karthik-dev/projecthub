import { Injectable } from '@nestjs/common';
import { ProjectStatus, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  projectsInProgress: number;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /** Aggregated statistics scoped to the authenticated user only. */
  async getStats(ownerId: string): Promise<DashboardStats> {
    const [
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      projectsInProgress,
    ] = await this.prisma.$transaction([
      this.prisma.project.count({ where: { ownerId } }),
      this.prisma.task.count({ where: { ownerId } }),
      this.prisma.task.count({
        where: { ownerId, status: TaskStatus.COMPLETED },
      }),
      this.prisma.task.count({
        where: { ownerId, status: TaskStatus.PENDING },
      }),
      this.prisma.project.count({
        where: { ownerId, status: ProjectStatus.IN_PROGRESS },
      }),
    ]);

    return {
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      projectsInProgress,
    };
  }
}
