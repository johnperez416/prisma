import { ProviderFlavors } from '../../_utils/providers'
import testMatrix from './_matrix'
// @ts-ignore
import type { Prisma as PrismaNamespace, PrismaClient } from './node_modules/@prisma/client'

declare let prisma: PrismaClient
declare let Prisma: typeof PrismaNamespace

testMatrix.setupTestSuite(
  ({ provider, providerFlavor }) => {
    // TODO the buffer returned by the driver adapter seems to be an ArrayBufferView, not a Node.js Buffer
    skipTestIf(providerFlavor === ProviderFlavors.JS_PLANETSCALE)('Buffer ($queryRaw)', async () => {
      if (provider === 'mysql') {
        await prisma.$queryRaw`INSERT INTO \`Entry\` (\`id\`, \`binary\`) VALUES ('1', ${Buffer.from('hello')})`
      } else {
        await prisma.$queryRaw`INSERT INTO "Entry" ("id", "binary") VALUES ('1', ${Buffer.from('hello')})`
      }

      const record = await prisma.entry.findUnique({
        where: {
          id: '1',
        },
      })

      expect(record?.binary).toEqual(Buffer.from('hello'))
    })

    // TODO the buffer returned by the driver adapter seems to be an ArrayBufferView, not a Node.js Buffer
    skipTestIf(providerFlavor === ProviderFlavors.JS_PLANETSCALE)('Buffer ($executeRaw)', async () => {
      if (provider === 'mysql') {
        await prisma.$executeRaw`INSERT INTO \`Entry\` (\`id\`, \`binary\`) VALUES ('2', ${Buffer.from('hello')})`
      } else {
        await prisma.$executeRaw`INSERT INTO "Entry" ("id", "binary") VALUES ('2', ${Buffer.from('hello')})`
      }

      const record = await prisma.entry.findUnique({
        where: {
          id: '2',
        },
      })

      expect(record?.binary).toEqual(Buffer.from('hello'))
    })

    // TODO the buffer returned by the driver adapter seems to be an ArrayBufferView, not a Node.js Buffer
    skipTestIf(providerFlavor === ProviderFlavors.JS_PLANETSCALE)('Buffer ($queryRaw + Prisma.sql)', async () => {
      if (provider === 'mysql') {
        await prisma.$queryRaw(
          Prisma.sql`INSERT INTO \`Entry\` (\`id\`, \`binary\`) VALUES ('3', ${Buffer.from('hello')})`,
        )
      } else {
        await prisma.$queryRaw(Prisma.sql`INSERT INTO "Entry" ("id", "binary") VALUES ('3', ${Buffer.from('hello')})`)
      }

      const record = await prisma.entry.findUnique({
        where: {
          id: '3',
        },
      })

      expect(record?.binary).toEqual(Buffer.from('hello'))
    })

    // TODO the buffer returned by the driver adapter seems to be an ArrayBufferView, not a Node.js Buffer
    skipTestIf(providerFlavor === ProviderFlavors.JS_PLANETSCALE)('Buffer ($executeRaw + Prisma.sql)', async () => {
      if (provider === 'mysql') {
        await prisma.$executeRaw(
          Prisma.sql`INSERT INTO \`Entry\` (\`id\`, \`binary\`) VALUES ('4', ${Buffer.from('hello')})`,
        )
      } else {
        await prisma.$executeRaw(Prisma.sql`INSERT INTO "Entry" ("id", "binary") VALUES ('4', ${Buffer.from('hello')})`)
      }

      const record = await prisma.entry.findUnique({
        where: {
          id: '4',
        },
      })

      expect(record?.binary).toEqual(Buffer.from('hello'))
    })
  },
  {
    optOut: {
      from: ['mongodb'],
      reason: '$queryRaw only works on SQL based providers',
    },
    skipDataProxy: {
      runtimes: ['edge'],
      reason: `
        This test is broken with the edge client. It needs to be updated to
        send ArrayBuffers and expect them as results, and the client might need
        to be fixed to return ArrayBuffers and not polyfilled Buffers in
        query results.
      `,
    },
  },
)