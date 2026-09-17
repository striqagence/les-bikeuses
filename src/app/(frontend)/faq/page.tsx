import type { Metadata } from 'next'

import configPromise from '@payload-config'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import React from 'react'

import RichText from '@/components/RichText'
import { THEMES } from './themes'

export const revalidate = 600

type Noeud = Record<string, unknown>
type Question = { id: string; titre: string; reponse: Noeud[] }

const texteDe = (n: Noeud): string =>
  typeof n.text === 'string'
    ? n.text
    : ((n.children ?? []) as Noeud[]).map(texteDe).join('')

/** Ancre stable, lisible dans la barre d'adresse. */
const ancre = (t: string): string =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

/**
 * Découpe le contenu rédigé en questions.
 *
 * Un titre de niveau deux ouvre une question, tout ce qui suit lui appartient
 * jusqu'au suivant — y compris les sous-titres, qui structurent certaines
 * réponses longues. C'est la forme que prend la FAQ dans l'éditeur ; la page
 * s'y conforme plutôt que d'imposer un modèle que personne ne remplirait.
 */
const decouper = (enfants: Noeud[]): Question[] => {
  const questions: Question[] = []
  const vus = new Map<string, number>()

  for (const noeud of enfants) {
    const estQuestion = noeud.type === 'heading' && noeud.tag === 'h2'

    if (estQuestion) {
      // « Question : » devant chaque intitulé d'une foire aux questions est un
      // pléonasme, et il repousse la vraie question de quinze caractères.
      const titre = texteDe(noeud).replace(/^\s*question\s*:\s*/i, '').trim()
      const base = ancre(titre)
      const n = vus.get(base) ?? 0
      vus.set(base, n + 1)
      questions.push({ id: n ? `${base}-${n + 1}` : base, titre, reponse: [] })
      continue
    }

    questions[questions.length - 1]?.reponse.push(noeud)
  }

  return questions.filter((q) => q.titre)
}

const chargerFaq = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })
    const r = await payload.find({
      collection: 'pages',
      depth: 1,
      limit: 1,
      pagination: false,
      where: { slug: { equals: 'faq' } },
    })

    const page = r.docs[0]
    const bloc = (page?.layout ?? []).find(
      (b) => (b as { blockType?: string }).blockType === 'content',
    ) as { columns?: { richText?: { root?: { children?: Noeud[] } } }[] } | undefined

    const enfants = bloc?.columns?.[0]?.richText?.root?.children ?? []
    return { questions: decouper(enfants), titre: page?.title ?? 'Foire aux questions' }
  },
  ['faq-questions'],
  { revalidate: 600 },
)

export default async function Faq() {
  const { questions } = await chargerFaq()

  // Chaque question rejoint le premier thème dont le motif la reconnaît ; le
  // dernier thème, sans motif, recueille le reste.
  const groupes = THEMES.map((theme) => ({
    ...theme,
    questions: questions.filter(
      (q) => THEMES.find((t) => !t.motif || t.motif.test(q.titre))?.cle === theme.cle,
    ),
  })).filter((g) => g.questions.length)

  return (
    <div className="halo container pt-8 pb-20 md:pt-14">
      <header className="max-w-[58ch]">
        <p className="eyebrow">Aide</p>
        <h1 className="wonk mt-3 text-4xl leading-[1.02] font-medium md:text-6xl">
          Vos questions, nos réponses
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          {questions.length} réponses sur les tailles, les retours, le paiement et la communauté.
          Dépliez celle qui vous concerne.
        </p>
      </header>

      <div className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-16">
        {/* Sommaire : treize questions à la suite se parcourent mal sans repère. */}
        <nav aria-label="Les thèmes" className="lg:sticky lg:top-24">
          <p className="mono-label mb-3 text-primary">Thèmes</p>
          <ul className="flex list-none flex-wrap gap-2 p-0 lg:flex-col lg:gap-0">
            {groupes.map((g) => (
              <li key={g.cle}>
                <a
                  className="mono-label inline-flex rounded-pilule border border-border px-3.5 py-2 transition-colors hover:border-primary hover:text-primary lg:border-0 lg:px-0 lg:py-1.5"
                  href={`#${g.cle}`}
                >
                  {g.titre}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-12">
          {groupes.map((groupe) => (
            <section className="scroll-mt-24" id={groupe.cle} key={groupe.cle}>
              <h2 className="wonk text-2xl leading-tight font-medium md:text-3xl">
                {groupe.titre}
              </h2>

              <ul className="mt-5 flex list-none flex-col gap-3 p-0">
                {groupe.questions.map((q) => (
                  <li key={q.id}>
                    {/* `details` natif : l'accordéon fonctionne sans script, et
                        la recherche du navigateur ouvre la bonne réponse. */}
                    <details
                      className="group rounded-panneau border border-border bg-card transition-colors open:border-primary/40 hover:border-primary/40"
                      id={q.id}
                    >
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-5 p-5 font-semibold md:p-6 [&::-webkit-details-marker]:hidden">
                        {q.titre}
                        <span
                          aria-hidden="true"
                          className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-pilule border border-border text-primary transition-transform group-open:rotate-45"
                        >
                          +
                        </span>
                      </summary>

                      <div className="border-t border-border px-5 pt-4 pb-5 md:px-6 md:pb-6">
                        <RichText
                          className="max-w-none"
                          data={
                            {
                              root: {
                                type: 'root',
                                children: q.reponse,
                                direction: 'ltr',
                                format: '',
                                indent: 0,
                                version: 1,
                              },
                            } as never
                          }
                          enableGutter={false}
                        />
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <aside className="rounded-panneau border border-primary/40 bg-accent p-6 md:p-8">
            <p className="mono-label text-primary">Vous ne trouvez pas ?</p>
            <p className="wonk mt-2 text-xl font-medium">Le journal répond plus longuement</p>
            <p className="mt-2 max-w-[52ch] text-sm text-muted-foreground">
              Guides de tailles, homologations, choix d’une première machine : les articles
              entrent dans le détail que cette page survole.
            </p>
            <Link
              className="mono-label mt-5 inline-flex items-center gap-2 rounded-pilule bg-primary px-5 py-3 text-primary-foreground transition-opacity hover:opacity-90"
              href="/posts"
            >
              Lire le journal <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </div>
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Questions fréquentes | Les Bikeuses',
  description:
    'Tailles, retours, échanges, paiement sécurisé et communauté : les réponses aux questions que se posent les motardes avant de commander.',
}
