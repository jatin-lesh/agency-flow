import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@agency.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "password123";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Admin User";

  const existing = await db.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log("Admin already exists — skipping seed.");
    return;
  }

  const hashed = await bcrypt.hash(adminPassword, 12);
  const admin = await db.user.create({
    data: { name: adminName, email: adminEmail, password: hashed, role: "ADMIN" },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // Sample client
  const client = await db.client.create({
    data: { name: "Acme Corp", industry: "E-Commerce", website: "https://acme.com", visibility: "TEAM" },
  });

  // Sample POC
  await db.pOC.create({
    data: { name: "Jane Doe", email: "jane@acme.com", jobTitle: "CMO", isPrimary: true, clientId: client.id },
  });

  // Sample project
  const project = await db.project.create({
    data: { name: "Q3 Social Campaign", clientId: client.id, managerId: admin.id, visibility: "TEAM", description: "Full Q3 social media campaign across all platforms." },
  });

  // Sample tasks
  await db.task.createMany({
    data: [
      { title: "Define content calendar", projectId: project.id, creatorId: admin.id, status: "DONE", priority: "HIGH", visibility: "TEAM" },
      { title: "Create Instagram creatives", projectId: project.id, creatorId: admin.id, status: "IN_PROGRESS", priority: "HIGH", visibility: "TEAM" },
      { title: "LinkedIn copy review", projectId: project.id, creatorId: admin.id, status: "IN_REVIEW", priority: "MEDIUM", visibility: "MANAGER_ONLY" },
      { title: "Client approval on campaign brief", projectId: project.id, creatorId: admin.id, status: "TODO", priority: "URGENT", visibility: "CLIENT" },
    ],
  });

  console.log("✅ Sample data seeded.");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
