import { getPayload } from 'payload'
import { headers } from 'next/headers'
import config from '@payload-config'

import { basculerNavigation } from '@/endpoints/navigation'

export const maxDuration = 60

export async function POST(): Promise<Response> {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) return new Response('Action forbidden.', { status: 403 })

  try {
    return Response.json(await basculerNavigation(payload))
  } catch (e) {
    payload.logger.error({ err: e, message: 'Bascule de navigation en échec' })
    return new Response('Erreur pendant la bascule.', { status: 500 })
  }
}
