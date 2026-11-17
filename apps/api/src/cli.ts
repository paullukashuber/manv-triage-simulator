import { randomBytes } from 'node:crypto'
import { realpathSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { z } from 'zod'
import { createAuth, isRole, MIN_PASSWORD_LENGTH, ROLES, type Auth, type Role } from './auth/auth.ts'
import { loadConfig, type Config } from './config.ts'
import { createDb, migrateDb, type Db } from './db/client.ts'

export type CliDeps = { db: Db; config: Config; stdout: (s: string) => void }

const USAGE = `Verwendung: node dist/cli.js <Befehl> [Optionen]

  create-admin   --email <E-Mail> --name <Name> [--password <Passwort>]
  create-user    --email <E-Mail> --name <Name> --role ${ROLES.join('|')} [--password <Passwort>]
  set-role       --email <E-Mail> --role ${ROLES.join('|')}
  reset-password --email <E-Mail> [--password <Passwort>]

Fehlt die Option --password, wird ein zufälliges Passwort erzeugt und einmal angezeigt.
`

const PASSWORD_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

/** 20 characters from a 64-symbol URL-safe alphabet; 64 divides 256, so every symbol is equally likely. */
export function generatePassword(): string {
  return Array.from(randomBytes(20), (b) => PASSWORD_ALPHABET[b & 63]).join('')
}

class CliError extends Error {}

type Options = { email?: string; name?: string; role?: string; password?: string }

function required(options: Options, key: keyof Options): string {
  const value = options[key]?.trim()
  if (!value) throw new CliError(`--${key} fehlt.`)
  return value
}

function email(options: Options): string {
  const value = required(options, 'email').toLowerCase()
  if (!z.email().safeParse(value).success) throw new CliError(`Ungültige E-Mail-Adresse: ${value}`)
  return value
}

function role(options: Options): Role {
  const value = required(options, 'role')
  if (!isRole(value)) throw new CliError(`Unbekannte Rolle „${value}“. Erlaubt: ${ROLES.join(', ')}.`)
  return value
}

/** The given password (checked against the sign-in minimum) or a freshly generated one. */
function password(options: Options, stdout: CliDeps['stdout']): string {
  if (options.password !== undefined) {
    if (options.password.length < MIN_PASSWORD_LENGTH)
      throw new CliError(`Das Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein.`)
    return options.password
  }
  const generated = generatePassword()
  stdout(`Erzeugtes Passwort: ${generated}\n`)
  stdout('Bitte jetzt notieren und sicher weitergeben – es wird nicht erneut angezeigt.\n')
  return generated
}

async function findUser(auth: Auth, address: string) {
  const ctx = await auth.$context
  const found = await ctx.internalAdapter.findUserByEmail(address)
  if (!found) throw new CliError(`Kein Konto mit der E-Mail-Adresse ${address} gefunden.`)
  return { ctx, user: found.user }
}

async function createUser(auth: Auth, options: Options, userRole: Role, stdout: CliDeps['stdout']) {
  const address = email(options)
  const name = required(options, 'name')
  const ctx = await auth.$context
  if (await ctx.internalAdapter.findUserByEmail(address))
    throw new CliError(`Es gibt bereits ein Konto mit der E-Mail-Adresse ${address}.`)
  // Server-side call without headers: better-auth skips the admin-session check.
  await auth.api.createUser({ body: { email: address, name, role: userRole, password: password(options, stdout) } })
  stdout(`Konto angelegt: ${address} (${userRole})\n`)
}

async function setRole(auth: Auth, options: Options, stdout: CliDeps['stdout']) {
  const address = email(options)
  const newRole = role(options)
  const { ctx, user } = await findUser(auth, address)
  await ctx.internalAdapter.updateUser(user.id, { role: newRole })
  stdout(`Rolle von ${address} ist jetzt ${newRole}.\n`)
}

async function resetPassword(auth: Auth, options: Options, stdout: CliDeps['stdout']) {
  const address = email(options)
  const { ctx, user } = await findUser(auth, address)
  const hash = await ctx.password.hash(password(options, stdout))
  if (await ctx.internalAdapter.findCredentialAccount(user.id)) {
    await ctx.internalAdapter.updatePassword(user.id, hash)
  } else {
    await ctx.internalAdapter.createAccount({ userId: user.id, providerId: 'credential', accountId: user.id, password: hash })
  }
  await ctx.internalAdapter.deleteUserSessions(user.id)
  stdout(`Passwort von ${address} geändert; bestehende Sitzungen wurden beendet.\n`)
}

type Command = (auth: Auth, options: Options, stdout: CliDeps['stdout']) => Promise<void>

const COMMANDS: Record<string, Command> = {
  'create-admin': (auth, options, stdout) => createUser(auth, options, 'admin', stdout),
  'create-user': (auth, options, stdout) => createUser(auth, options, role(options), stdout),
  'set-role': setRole,
  'reset-password': resetPassword,
}

export async function runCli(argv: string[], { db, config, stdout }: CliDeps): Promise<number> {
  try {
    const { positionals, values } = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        email: { type: 'string' },
        name: { type: 'string' },
        role: { type: 'string' },
        password: { type: 'string' },
      },
    })
    const [command, ...rest] = positionals
    const handler = command !== undefined && Object.hasOwn(COMMANDS, command) ? COMMANDS[command] : undefined
    if (!handler) {
      stdout(command ? `Unbekannter Befehl: ${command}\n\n${USAGE}` : USAGE)
      return 1
    }
    if (rest.length > 0) throw new CliError(`Unerwartete Argumente: ${rest.join(' ')}`)
    await handler(createAuth({ db, config }), values, stdout)
    return 0
  } catch (error) {
    // parseArgs throws TypeErrors with a code for unknown or malformed options.
    const isArgError = error instanceof TypeError && 'code' in error
    if (!(error instanceof CliError) && !isArgError) throw error
    stdout(`Fehler: ${error.message}\n`)
    return 1
  }
}

async function main(): Promise<void> {
  const config = loadConfig(process.env)
  const { db, close } = createDb(config.databaseUrl)
  try {
    await migrateDb(db)
    process.exitCode = await runCli(process.argv.slice(2), { db, config, stdout: (s) => process.stdout.write(s) })
  } finally {
    await close()
  }
}

const entry = process.argv[1]
if (entry && import.meta.url === pathToFileURL(realpathSync(entry)).href) {
  main().catch((error: unknown) => {
    console.error('Fehler:', error)
    process.exitCode = 1
  })
}
