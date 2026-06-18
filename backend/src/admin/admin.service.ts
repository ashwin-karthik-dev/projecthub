import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** All users with their project/task counts (admin only). */
  listUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { projects: true, tasks: true } },
      },
    });
  }

  /** Platform-wide statistics across every user (admin only). */
  async globalStats() {
    const [totalUsers, totalProjects, totalTasks] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.project.count(),
        this.prisma.task.count(),
      ]);
    return { totalUsers, totalProjects, totalTasks };
  }
}
