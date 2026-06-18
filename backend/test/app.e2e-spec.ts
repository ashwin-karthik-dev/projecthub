import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Integration (end-to-end) tests. These exercise the real HTTP layer and a
 * real database, covering authentication, validation, ownership isolation,
 * role-based access control and audit logging.
 *
 * Requires a reachable database (DATABASE_URL). Created users are removed in
 * afterAll (cascade deletes their projects, tasks and audit logs).
 */
describe('ProjectHub API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let http: App;

  const unique = Date.now();
  const userA = {
    fullName: 'Alice A',
    email: `alice_${unique}@example.com`,
    password: 'Secret@123',
  };
  const userB = {
    fullName: 'Bob B',
    email: `bob_${unique}@example.com`,
    password: 'Secret@123',
  };

  let tokenA = '';
  let tokenB = '';
  let projectId = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Mirror production bootstrap so tests hit the same behaviour as main.ts.
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [userA.email, userB.email] } },
    });
    await app.close();
  });

  describe('Auth', () => {
    it('registers user A and returns a token without the password hash', async () => {
      const res = await request(http)
        .post('/api/auth/register')
        .send(userA)
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.role).toBe('MEMBER');
      expect(res.body.user).not.toHaveProperty('passwordHash');
      tokenA = res.body.accessToken;
    });

    it('registers user B', async () => {
      const res = await request(http)
        .post('/api/auth/register')
        .send(userB)
        .expect(201);
      tokenB = res.body.accessToken;
    });

    it('rejects invalid registration input (400)', async () => {
      await request(http)
        .post('/api/auth/register')
        .send({ fullName: '', email: 'not-an-email', password: 'short' })
        .expect(400);
    });

    it('rejects a duplicate email (409)', async () => {
      await request(http).post('/api/auth/register').send(userA).expect(409);
    });

    it('rejects login with a wrong password (401)', async () => {
      await request(http)
        .post('/api/auth/login')
        .send({ email: userA.email, password: 'wrong-password' })
        .expect(401);
    });

    it('blocks protected routes without a token (401)', async () => {
      await request(http).get('/api/projects').expect(401);
    });
  });

  describe('Projects & Tasks', () => {
    it('creates a project for user A', async () => {
      const res = await request(http)
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'E2E Project', status: 'IN_PROGRESS' })
        .expect(201);
      expect(res.body.id).toBeDefined();
      projectId = res.body.id;
    });

    it('creates a task under the project', async () => {
      await request(http)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'E2E Task',
          projectId,
          priority: 'HIGH',
          status: 'PENDING',
        })
        .expect(201);
    });

    it('reflects the new data in the dashboard', async () => {
      const res = await request(http)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      expect(res.body.totalProjects).toBe(1);
      expect(res.body.totalTasks).toBe(1);
      expect(res.body.pendingTasks).toBe(1);
    });

    it('filters tasks by priority', async () => {
      const res = await request(http)
        .get('/api/tasks?priority=HIGH')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      expect(res.body.meta.total).toBe(1);
      expect(res.body.data[0].priority).toBe('HIGH');
    });
  });

  describe('Authorization (ownership isolation)', () => {
    it('hides another user’s project (404 on read)', async () => {
      await request(http)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('forbids updating another user’s project (404)', async () => {
      await request(http)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'hacked' })
        .expect(404);
    });

    it('forbids deleting another user’s project (404)', async () => {
      await request(http)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });
  });

  describe('Role-Based Access Control', () => {
    it('denies a member access to admin routes (403)', async () => {
      await request(http)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(403);
    });

    it('allows an admin after promotion (200)', async () => {
      // Promote user A to ADMIN, then re-login to mint a token carrying the role.
      await prisma.user.update({
        where: { email: userA.email },
        data: { role: 'ADMIN' },
      });
      const login = await request(http)
        .post('/api/auth/login')
        .send({ email: userA.email, password: userA.password })
        .expect(200);
      const adminToken = login.body.accessToken;
      expect(login.body.user.role).toBe('ADMIN');

      await request(http)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      await request(http)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Audit Logs', () => {
    it('records create actions for the acting user', async () => {
      const res = await request(http)
        .get('/api/audit-logs?entity=PROJECT&action=CREATE')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].action).toBe('CREATE');
      expect(res.body.data[0].entity).toBe('PROJECT');
    });
  });
});
