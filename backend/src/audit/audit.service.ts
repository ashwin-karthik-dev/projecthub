import { Injectable, Logger } from '@nestjs/common';
import { AuditAction, AuditEntity, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResult } from '../common/dto/pagination.dto';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { QueryAuditDto } from './dto/query-audit.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an audit entry. Failures are swallowed (logged only) so auditing
   * can never break the primary operation.
   */
  async record(
    userId: string,
    action: AuditAction,
    entity: AuditEntity,
    entityId: string,
    metadata?: Prisma.InputJsonValue,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: { userId, action, entity, entityId, metadata },
      });
    } catch (err) {
      this.logger.warn(
        `Failed to write audit log (${action} ${entity} ${entityId}): ${String(err)}`,
      );
    }
  }

  /** Members see only their own audit trail; admins can see everyone's. */
  async findMany(
    user: AuthUser,
    query: QueryAuditDto,
  ): Promise<PaginatedResult<Prisma.AuditLogGetPayload<object>>> {
    const where: Prisma.AuditLogWhereInput = {
      ...(user.role === Role.ADMIN
        ? query.userId
          ? { userId: query.userId }
          : {}
        : { userId: user.id }),
      ...(query.entity ? { entity: query.entity } : {}),
      ...(query.action ? { action: query.action } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.auditLog.count({ where }),
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
}
