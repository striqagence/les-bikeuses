import { postgresAdapter } from '@payloadcms/db-postgres'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Avis } from './collections/Avis'
import { Products } from './collections/Products'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Deux poolers Supabase, deux usages.
 *
 * Runtime (`DATABASE_URL`, Transaction pooler, port 6543) : le mode
 * transaction rend la connexion au pool à la fin de chaque transaction, si
 * bien que des dizaines d'instances Vercel se partagent le même petit pool.
 * En mode session (port 5432), chaque instance monopolise ses connexions
 * jusqu'à sa mort : à 15 connexions pour tout le projet, trois instances
 * suffisaient à tout faire tomber en EMAXCONNSESSION.
 *
 * Migrations (`DATABASE_URL_SESSION`, Session pooler, port 5432) : elles ont
 * besoin d'un état de session stable (verrous consultatifs, `SET`), que le
 * mode transaction ne garantit pas. C'est la raison de la mise en garde de
 * DEPLOIEMENT.md contre le port 6543 — on la respecte en isolant ce seul cas.
 *
 * Repli sur `DATABASE_URL` si la variable de session n'est pas renseignée :
 * la configuration reste valide tant que les deux poolers ne sont pas séparés.
 */
const enMigration = process.argv.some(
  (arg) => arg === 'migrate' || arg.startsWith('migrate:'),
)

const connexionPostgres = (): string | undefined =>
  enMigration
    ? (process.env.DATABASE_URL_SESSION ?? process.env.DATABASE_URL)
    : process.env.DATABASE_URL

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: connexionPostgres(),
      // Calibré sur le pool Supabase, porté à 40 le 2026-08-25 (l'instance
      // Micro plafonne à 60 connexions, et Supabase alerte au-delà de 80 %).
      // À 5 par instance, huit instances Vercel tiennent en parallèle.
      //
      // Ne pas descendre à 1 : la requête des pages ouvre plusieurs jointures
      // latérales et réclame une seconde connexion, qui n'arriverait jamais.
      // C'est ce qui a fait échouer un build en « timeout exceeded when
      // trying to connect » alors que le pool n'était pourtant plus saturé.
      max: Number(process.env.DATABASE_POOL_MAX ?? 3),
      // Restitution rapide : en mode session, une connexion inactive reste
      // accaparée par son instance. Dix secondes suffisaient à saturer les 40
      // du projet dès que plusieurs instances tournaient en parallèle.
      idleTimeoutMillis: 3_000,
      // Les migrations attendent plus longtemps qu'une requête du site : elles
      // tournent au build, pendant que les instances en service détiennent
      // encore leurs connexions. Échouer au bout de quinze secondes faisait
      // tomber le déploiement entier alors qu'une connexion se libérait
      // quelques secondes plus tard.
      connectionTimeoutMillis: enMigration ? 90_000 : 15_000,
    },
  }),
  collections: [Pages, Posts, Products, Avis, Media, Categories, Users],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer],
  plugins,
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
})
