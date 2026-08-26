'use client'

import React, { useCallback, useRef, useState } from 'react'
import { toast } from '@payloadcms/ui'

type Rapport = {
  total: number
  dejaPresents: number
  importes: string[]
  ignores: { slug: string; raison: string }[]
  restants: number
}

/**
 * Import des articles de lesbikeuses.fr.
 *
 * Enchaîne les lots côté navigateur plutôt que de tout faire en une requête :
 * deux cents articles et leurs visuels dépassent de loin la durée maximale
 * d'une fonction. Chaque lot est autonome, l'opération reprend où elle en
 * était et peut être interrompue sans dégât.
 */
export const ImportButton: React.FC = () => {
  const [enCours, setEnCours] = useState(false)
  const [etat, setEtat] = useState<string | null>(null)
  const stop = useRef(false)

  const lancer = useCallback(async () => {
    if (enCours) {
      stop.current = true
      setEtat('Arrêt après le lot en cours…')
      return
    }

    stop.current = false
    setEnCours(true)
    let importes = 0
    let ignores = 0

    try {
      for (;;) {
        const reponse = await fetch('/next/import?taille=8', {
          method: 'POST',
          credentials: 'include',
        })
        if (!reponse.ok) throw new Error(`Le serveur a répondu ${reponse.status}`)

        const rapport: Rapport = await reponse.json()
        importes += rapport.importes.length
        ignores += rapport.ignores.length

        setEtat(
          `${rapport.dejaPresents + rapport.importes.length} / ${rapport.total} articles — ` +
            `${rapport.restants} restants` +
            (ignores ? ` · ${ignores} ignoré${ignores > 1 ? 's' : ''}` : ''),
        )

        // Aucun article traité et rien en attente : c'est terminé. Aucun
        // article traité mais des restants : ils échouent tous, on s'arrête
        // plutôt que de boucler indéfiniment.
        if (!rapport.importes.length) break
        if (rapport.restants === 0) break
        if (stop.current) break
      }

      toast.success(`Import terminé — ${importes} article${importes > 1 ? 's' : ''} ajouté${importes > 1 ? 's' : ''}.`)
    } catch (err) {
      toast.error(`Import interrompu : ${err instanceof Error ? err.message : 'erreur inconnue'}`)
    } finally {
      setEnCours(false)
    }
  }, [enCours])

  return (
    <div style={{ marginTop: '1rem' }}>
      <button className="btn btn--style-secondary" onClick={lancer} type="button">
        {enCours ? 'Arrêter l’import' : 'Importer les articles de lesbikeuses.fr'}
      </button>
      {etat && (
        <p style={{ marginTop: '.5rem', opacity: 0.75, fontSize: '.85rem' }}>{etat}</p>
      )}
    </div>
  )
}
