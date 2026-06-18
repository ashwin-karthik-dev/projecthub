import {
  PrismaClient,
  ProjectStatus,
  Role,
  TaskPriority,
  TaskStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seeds a demo (member) user with sample projects/tasks, plus an admin user
 * for demonstrating role-based access control.
 *
 * Demo login:   demo@example.com   /  Demo@1234   (MEMBER)
 * Admin login:  admin@example.com  /  Admin@1234  (ADMIN)
 */
async function main() {
  const email = 'demo@example.com';
  const passwordHash = await bcrypt.hash('Demo@1234', 12);

  // Admin user (for RBAC demo).
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { role: Role.ADMIN },
    create: {
      fullName: 'Admin User',
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('Admin@1234', 12),
      role: Role.ADMIN,
    },
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { fullName: 'Demo User', email, passwordHash, role: Role.MEMBER },
  });

  // Start clean for the demo user so re-seeding is idempotent.
  await prisma.task.deleteMany({ where: { ownerId: user.id } });
  await prisma.project.deleteMany({ where: { ownerId: user.id } });

  const website = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Revamp the company marketing website',
      status: ProjectStatus.IN_PROGRESS,
      startDate: new Date('2026-01-05'),
      endDate: new Date('2026-03-30'),
      ownerId: user.id,
      tasks: {
        create: [
          {
            name: 'Wireframe homepage',
            description: 'Low-fidelity layout for the new homepage',
            priority: TaskPriority.HIGH,
            status: TaskStatus.COMPLETED,
            dueDate: new Date('2026-01-15'),
            ownerId: user.id,
          },
          {
            name: 'Implement hero section',
            priority: TaskPriority.MEDIUM,
            status: TaskStatus.IN_PROGRESS,
            dueDate: new Date('2026-02-10'),
            ownerId: user.id,
          },
          {
            name: 'SEO audit',
            priority: TaskPriority.LOW,
            status: TaskStatus.PENDING,
            ownerId: user.id,
          },
        ],
      },
    },
  });

  await prisma.project.create({
    data: {
      name: 'Mobile App Launch',
      description: 'Ship v1 of the mobile app to the stores',
      status: ProjectStatus.NOT_STARTED,
      ownerId: user.id,
      tasks: {
        create: [
          {
            name: 'Set up CI pipeline',
            priority: TaskPriority.HIGH,
            status: TaskStatus.PENDING,
            ownerId: user.id,
          },
          {
            name: 'Draft store listing',
            priority: TaskPriority.MEDIUM,
            status: TaskStatus.PENDING,
            ownerId: user.id,
          },
        ],
      },
    },
  });

  console.log(`Seeded demo user (${email}) with sample data.`);
  console.log(`First project id: ${website.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
