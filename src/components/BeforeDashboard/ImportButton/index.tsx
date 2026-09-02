'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
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
export const ImportButton: React.FC<{
  forcer?: boolean
  quoi?: 'articles' | 'produits' | 'galeries'
}> = ({
  forcer = false,
  quoi = 'articles',
}) => {
  const [enCours, setEnCours] = useState(false)
  const [etat, setEtat] = useState<string | null>(null)
  const [repriseEnCours, setRepriseEnCours] = useState(false)

  useEffect(() => {
    if (forcer) setRepriseEnCours(Boolean(localStorage.getItem('lesbikeuses:borne-reimport')))
  }, [forcer, enCours])
  const stop = useRef(false)

  const lancer = useCallback(async () => {
    if (enCours) {
      stop.current = true
      setEtat('Arrêt après le lot en cours…')
      return
    }

    stop.current = false
    setEnCours(true)

    // Borne de la passe en cours : un article retraité voit son `updatedAt` la
    // dépasser et sort de l'ensemble à reprendre.
    //
    // Conservée entre deux sessions du navigateur : sans cela, une passe
    // interrompue repartait du début de la liste et retraitait tout ce qui
    // venait d'être fait. Elle est effacée quand la passe arrive au bout, si
    // bien qu'un clic ultérieur en ouvre une nouvelle.
    const CLE = 'lesbikeuses:borne-reimport'
    const depart = forcer
      ? (localStorage.getItem(CLE) ?? new Date().toISOString())
      : new Date().toISOString()
    if (forcer) localStorage.setItem(CLE, depart)

    const terminer = () => {
      if (forcer) localStorage.removeItem(CLE)
    }
    let importes = 0
    let ignores = 0

    try {
      for (;;) {
        const reponse = await fetch(
          `/next/import?taille=${quoi === 'produits' ? 12 : quoi === 'galeries' ? 6 : 8}` +
            `${forcer ? `&forcer=1&avant=${encodeURIComponent(depart)}` : ''}` +
            `${quoi === 'articles' ? '' : `&quoi=${quoi}`}`,
          {
            method: 'POST',
            credentials: 'include',
          },
        )
        if (!reponse.ok) throw new Error(`Le serveur a répondu ${reponse.status}`)

        const rapport: Rapport = await reponse.json()
        importes += rapport.importes.length
        ignores += rapport.ignores.length

        setEtat(
          `${rapport.dejaPresents + rapport.importes.length} / ${rapport.total} ${quoi} — ` +
            `${rapport.restants} restants` +
            (ignores ? ` · ${ignores} ignoré${ignores > 1 ? 's' : ''}` : ''),
        )

        // Aucun article traité et rien en attente : c'est terminé. Aucun
        // article traité mais des restants : ils échouent tous, on s'arrête
        // plutôt que de boucler indéfiniment.
        if (!rapport.importes.length) {
          terminer()
          break
        }
        if (rapport.restants === 0) {
          terminer()
          break
        }
        // Interruption volontaire : la borne est conservée, le prochain clic
        // reprendra la passe au lieu de la recommencer.
        if (stop.current) break
        // En mode « forcer », `dejaPresents` ne diminue pas : c'est `restants`
        // qui fait foi pour la progression.
      }

      const nom = quoi === 'produits' ? 'produit' : quoi === 'galeries' ? 'galerie' : 'article'
      toast.success(
        `Import terminé — ${importes} ${nom}${importes > 1 ? 's' : ''} traité${importes > 1 ? 'es' : 'e'}.`,
      )
    } catch (err) {
      toast.error(`Import interrompu : ${err instanceof Error ? err.message : 'erreur inconnue'}`)
    } finally {
      setEnCours(false)
    }
  }, [enCours, forcer, quoi])

  return (
    <div style={{ marginTop: '1rem' }}>
      {forcer && repriseEnCours && !enCours && (
        <p style={{ marginBottom: '.5rem', fontSize: '.85rem', opacity: 0.8 }}>
          Une reprise a été interrompue. Le prochain clic la poursuit au lieu de la
          recommencer.
        </p>
      )}
      <button className="btn btn--style-secondary" onClick={lancer} type="button">
        {enCours
          ? 'Arrêter'
          : quoi === 'produits'
            ? 'Importer le catalogue produits'
            : forcer
              ? 'Tout réimporter (met à jour l’existant)'
              : 'Importer les articles de lesbikeuses.fr'}
      </button>
      {etat && (
        <p style={{ marginTop: '.5rem', opacity: 0.75, fontSize: '.85rem' }}>{etat}</p>
      )}
    </div>
  )
}
