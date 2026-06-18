import { Test } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: {
    project: {
      findUnique: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      project: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { record: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(ProjectsService);
  });

  describe('findOne (authorization)', () => {
    it('returns the project when the caller owns it', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 'p1',
        ownerId: 'user-1',
      });
      await expect(service.findOne('user-1', 'p1')).resolves.toMatchObject({
        id: 'p1',
      });
    });

    it('throws NotFound when the project belongs to another user', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 'p1',
        ownerId: 'someone-else',
      });
      await expect(service.findOne('user-1', 'p1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws NotFound when the project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(service.findOne('user-1', 'missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create (validation)', () => {
    it('rejects a start date that is after the end date', async () => {
      await expect(
        service.create('user-1', {
          name: 'X',
          startDate: '2026-05-01',
          endDate: '2026-01-01',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('persists with the caller as owner', async () => {
      prisma.project.create.mockResolvedValue({ id: 'p1', ownerId: 'user-1' });
      await service.create('user-1', { name: 'New project' });
      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New project',
            ownerId: 'user-1',
          }),
        }),
      );
    });
  });
});
