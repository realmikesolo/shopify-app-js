import fs from 'fs';
import {execSync} from 'child_process';

import {batteryOfTests} from '@shopify/shopify-app-session-storage-test-utils';
import {PrismaClient} from '@prisma/client';

import {MissingSessionTableError, PrismaSessionStorage} from '../prisma';

describe('PrismaSessionStorage', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Reset the database prior to the tests
    clearTestDatabase();

    execSync('npx prisma migrate dev --name init --preview-feature');

    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.session.deleteMany();
    await prisma.mySession.deleteMany();
  });

  // Using the default table name
  batteryOfTests(async () => new PrismaSessionStorage<PrismaClient>(prisma));

  // Using a custom table name
  batteryOfTests(
    async () =>
      new PrismaSessionStorage<PrismaClient>(prisma, {tableName: 'mySession'}),
  );
});

describe('PrismaSessionStorage when with no database set up', () => {
  beforeAll(async () => {
    clearTestDatabase();
  });

  it('throws an appropriate error when Prisma migrations were not run', async () => {
    const prisma = new PrismaClient();
    const storage = new PrismaSessionStorage<PrismaClient>(prisma);

    try {
      await storage.findSessionsByShop('shop.myshopify.com');

      // This should never be reached
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(MissingSessionTableError);

      const {cause} = error;
      expect(cause.message).toContain(
        'The table `main.Session` does not exist in the current database.',
      );
    }
  });
});

function clearTestDatabase() {
  const testDbPath = `${__dirname}/../../prisma/test.db`;
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
}
