'use client'

import React, { useCallback, useState } from 'react'
import { toast } from '@payloadcms/ui'

/**
 * Bascule la navigation vers les rayons de ce site.
 *
 * Bouton distinct du seed : celui-ci vide les collections et effacerait les
 * articles, produits et médias importés. Ici seules les deux globales sont
 * touchées.
 */
export const NavigationButton: React.FC = () => {
  const [enCours, setEnCours] = useState(false)
  const [etat, setEtat] = useState<string | null>(null)

  const lancer = useCallback(async () => {
    if (enCours) return
    setEnCours(true)

    try {
      const reponse = await fetch('/next/navigation', { method: 'POST', credentials: 'include' })
      if (!reponse.ok) throw new Error(`Le serveur a répondu ${reponse.status}`)

      const r = (await reponse.json()) as { posees: string[]; omises: string[] }
      setEtat(
        `${r.posees.length} rayon${r.posees.length > 1 ? 's' : ''} en place` +
          (r.omises.length ? ` · ${r.omises.length} omis : ${r.omises.join(', ')}` : ''),
      )
      toast.success('Navigation mise à jour.')
    } catch (err) {
      toast.error(`Bascule impossible : ${err instanceof Error ? err.message : 'erreur inconnue'}`)
    } finally {
      setEnCours(false)
    }
  }, [enCours])

  return (
    <div style={{ marginTop: '1rem' }}>
      <button className="btn btn--style-secondary" onClick={lancer} type="button">
        {enCours ? 'Bascule en cours…' : 'Faire pointer le menu vers les rayons du site'}
      </button>
      {etat && <p style={{ marginTop: '.5rem', opacity: 0.75, fontSize: '.85rem' }}>{etat}</p>}
    </div>
  )
}
