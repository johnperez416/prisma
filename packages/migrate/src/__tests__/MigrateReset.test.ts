import prompt from 'prompts'

import { MigrateReset } from '../commands/MigrateReset'
import { createDefaultTestContext } from './__helpers__/context'

const ctx = createDefaultTestContext()

beforeEach(() => {
  process.env.PRISMA_MIGRATE_SKIP_GENERATE = '1'
})

describe('common', () => {
  it('wrong flag', async () => {
    const commandInstance = MigrateReset.new()
    const spy = jest.spyOn(commandInstance, 'help').mockImplementation(() => 'Help Me')

    await commandInstance.parse(['--something'], await ctx.config())
    expect(spy).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })
  it('help flag', async () => {
    const commandInstance = MigrateReset.new()
    const spy = jest.spyOn(commandInstance, 'help').mockImplementation(() => 'Help Me')

    await commandInstance.parse(['--help'], await ctx.config())
    expect(spy).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })
  it('should fail if no schema file', async () => {
    ctx.fixture('empty')
    const result = MigrateReset.new().parse([], await ctx.config())
    await expect(result).rejects.toThrowErrorMatchingInlineSnapshot(`
      "Could not find Prisma Schema that is required for this command.
      You can either provide it with \`--schema\` argument,
      set it in your Prisma Config file (e.g., \`prisma.config.ts\`),
      set it as \`prisma.schema\` in your package.json,
      or put it into the default location (\`./prisma/schema.prisma\`, or \`./schema.prisma\`.
      Checked following paths:

      schema.prisma: file not found
      prisma/schema.prisma: file not found

      See also https://pris.ly/d/prisma-schema-location"
    `)
  })
})

describe('reset', () => {
  it('should work (prompt)', async () => {
    ctx.fixture('reset')

    prompt.inject(['y']) // simulate user yes input

    const result = MigrateReset.new().parse([], await ctx.config())
    await expect(result).resolves.toMatchInlineSnapshot(`""`)
    expect(ctx.normalizedCapturedStdout()).toMatchInlineSnapshot(`
      "Prisma schema loaded from prisma/schema.prisma
      Datasource "my_db": SQLite database "dev.db" <location placeholder>



      Database reset successful

      The following migration(s) have been applied:

      migrations/
        └─ 20201231000000_init/
          └─ migration.sql
      "
    `)
  })

  it('should work (--force)', async () => {
    ctx.fixture('reset')

    const result = MigrateReset.new().parse(['--force'], await ctx.config())
    await expect(result).resolves.toMatchInlineSnapshot(`""`)
    expect(ctx.normalizedCapturedStdout()).toMatchInlineSnapshot(`
      "Prisma schema loaded from prisma/schema.prisma
      Datasource "my_db": SQLite database "dev.db" <location placeholder>


      Database reset successful

      The following migration(s) have been applied:

      migrations/
        └─ 20201231000000_init/
          └─ migration.sql
      "
    `)
  })

  it('should work with folder (--force)', async () => {
    ctx.fixture('schema-folder-sqlite-migration-exists')

    const result = MigrateReset.new().parse(['--force', '--schema=./prisma'], await ctx.config())
    await expect(result).resolves.toMatchInlineSnapshot(`""`)
    expect(ctx.normalizedCapturedStdout()).toMatchInlineSnapshot(`
      "Prisma schema loaded from prisma
      Datasource "my_db": SQLite database "dev.db" <location placeholder>


      Database reset successful

      The following migration(s) have been applied:

      migrations/
        └─ 20201231000000_init/
          └─ migration.sql
      "
    `)
  })

  it('with missing db', async () => {
    ctx.fixture('reset')
    ctx.fs.remove('prisma/dev.db')

    const result = MigrateReset.new().parse(['--force'], await ctx.config())
    await expect(result).resolves.toMatchInlineSnapshot(`""`)
    expect(ctx.normalizedCapturedStdout()).toMatchInlineSnapshot(`
      "Prisma schema loaded from prisma/schema.prisma
      Datasource "my_db": SQLite database "dev.db" <location placeholder>


      Database reset successful

      The following migration(s) have been applied:

      migrations/
        └─ 20201231000000_init/
          └─ migration.sql
      "
    `)
  })

  it('without the migrations directory should fail (prompt)', async () => {
    ctx.fixture('reset')
    ctx.fs.remove('prisma/migrations')

    prompt.inject(['y']) // simulate user yes input

    const result = MigrateReset.new().parse([], await ctx.config())
    await expect(result).resolves.toMatchInlineSnapshot(`""`)
    expect(ctx.normalizedCapturedStdout()).toMatchInlineSnapshot(`
      "Prisma schema loaded from prisma/schema.prisma
      Datasource "my_db": SQLite database "dev.db" <location placeholder>


      Database reset successful

      "
    `)
  })

  it('should be cancelled if user send n (prompt)', async () => {
    ctx.fixture('reset')

    prompt.inject([new Error()]) // simulate user cancellation

    const result = MigrateReset.new().parse([], await ctx.config())
    await expect(result).rejects.toMatchInlineSnapshot(`"process.exit: 130"`)
    expect(ctx.normalizedCapturedStdout()).toMatchInlineSnapshot(`
      "Prisma schema loaded from prisma/schema.prisma
      Datasource "my_db": SQLite database "dev.db" <location placeholder>


      Reset cancelled.
      "
    `)

    expect(ctx.recordedExitCode()).toEqual(130)
  })

  it('reset should error in unattended environment', async () => {
    ctx.fixture('reset')
    const result = MigrateReset.new().parse([], await ctx.config())
    await expect(result).rejects.toMatchInlineSnapshot(`
      "Prisma Migrate has detected that the environment is non-interactive. It is recommended to run this command in an interactive environment.

      Use --force to run this command without user interaction.
      See https://www.prisma.io/docs/reference/api-reference/command-reference#migrate-reset"
    `)
    expect(ctx.mocked['console.error'].mock.calls.join('\n')).toMatchInlineSnapshot(`""`)
  })

  it('reset - multiple seed files', async () => {
    ctx.fixture('seed-from-package-json/seed-sqlite-legacy')
    prompt.inject(['y']) // simulate user yes input

    const result = MigrateReset.new().parse([], await ctx.config())
    await expect(result).resolves.toMatchInlineSnapshot(`""`)
    expect(ctx.normalizedCapturedStdout()).toMatchInlineSnapshot(`
      "Prisma schema loaded from prisma/schema.prisma
      Datasource "db": SQLite database "dev.db" <location placeholder>


      Database reset successful

      "
    `)
  })

  it('reset - multiple seed files - --skip-seed', async () => {
    ctx.fixture('seed-from-package-json/seed-sqlite-legacy')
    prompt.inject(['y']) // simulate user yes input

    const result = MigrateReset.new().parse(['--skip-seed'], await ctx.config())
    await expect(result).resolves.toMatchInlineSnapshot(`""`)
  })

  test('reset - seed.js', async () => {
    ctx.fixture('seed-from-package-json/seed-sqlite-js')
    prompt.inject(['y']) // simulate user yes input

    const result = MigrateReset.new().parse([], await ctx.config())
    await expect(result).resolves.toMatchInlineSnapshot(`""`)

    expect(ctx.normalizedCapturedStdout()).toMatchInlineSnapshot(`
      "Prisma schema loaded from prisma/schema.prisma
      Datasource "db": SQLite database "dev.db" <location placeholder>


      Database reset successful


      Running seed command \`node prisma/seed.js\` ...

      The seed command has been executed.
      "
    `)
    expect(ctx.mocked['console.warn'].mock.calls.join('\n')).toMatchInlineSnapshot(`""`)
  })

  test('reset - seed.js - error should exit 1', async () => {
    ctx.fixture('seed-from-package-json/seed-sqlite-js')
    ctx.fs.write('prisma/seed.js', 'BROKEN_CODE_SHOULD_ERROR;')
    prompt.inject(['y']) // simulate user yes input

    const result = MigrateReset.new().parse([], await ctx.config())
    await expect(result).rejects.toMatchInlineSnapshot(`"process.exit: 1"`)

    expect(ctx.normalizedCapturedStdout()).toMatchInlineSnapshot(`
      "Prisma schema loaded from prisma/schema.prisma
      Datasource "db": SQLite database "dev.db" <location placeholder>


      Database reset successful


      Running seed command \`node prisma/seed.js\` ...
      "
    `)
    expect(ctx.mocked['console.warn'].mock.calls.join('\n')).toMatchInlineSnapshot(`""`)
    expect(ctx.mocked['console.error'].mock.calls.join('\n')).toMatchInlineSnapshot(`
      "
      An error occurred while running the seed command:
      Error: Command failed with exit code 1: node prisma/seed.js"
    `)
    expect(ctx.recordedExitCode()).toEqual(1)
  })

  test('reset - seed.ts', async () => {
    ctx.fixture('seed-from-package-json/seed-sqlite-ts')
    prompt.inject(['y']) // simulate user yes input

    const result = MigrateReset.new().parse([], await ctx.config())
    await expect(result).resolves.toMatchInlineSnapshot(`""`)

    expect(ctx.normalizedCapturedStdout()).toMatchInlineSnapshot(`
      "Prisma schema loaded from prisma/schema.prisma
      Datasource "db": SQLite database "dev.db" <location placeholder>


      Database reset successful


      Running seed command \`ts-node prisma/seed.ts\` ...

      The seed command has been executed.
      "
    `)
    expect(ctx.mocked['console.warn'].mock.calls.join('\n')).toMatchInlineSnapshot(`""`)
  }, 10_000)

  it('reset - legacy seed (no config in package.json)', async () => {
    ctx.fixture('seed-from-package-json/seed-sqlite-legacy')
    ctx.fs.remove('prisma/seed.js')
    ctx.fs.remove('prisma/seed.ts')
    // ctx.fs.remove('prisma/seed.sh')
    prompt.inject(['y']) // simulate user yes input

    const result = MigrateReset.new().parse([], await ctx.config())
    await expect(result).resolves.toMatchInlineSnapshot(`""`)

    expect(ctx.normalizedCapturedStdout()).toMatchInlineSnapshot(`
      "Prisma schema loaded from prisma/schema.prisma
      Datasource "db": SQLite database "dev.db" <location placeholder>


      Database reset successful

      "
    `)
    expect(ctx.mocked['console.warn'].mock.calls.join('\n')).toMatchInlineSnapshot(`""`)
  })

  it('should work with directUrl', async () => {
    ctx.fixture('reset-directurl')

    prompt.inject(['y']) // simulate user yes input

    const result = MigrateReset.new().parse([], await ctx.config())
    await expect(result).resolves.toMatchInlineSnapshot(`""`)
    expect(ctx.normalizedCapturedStdout()).toMatchInlineSnapshot(`
      "Prisma schema loaded from prisma/schema.prisma
      Datasource "my_db": SQLite database "dev.db" <location placeholder>



      Database reset successful

      The following migration(s) have been applied:

      migrations/
        └─ 20201231000000_init/
          └─ migration.sql
      "
    `)
  })
})
