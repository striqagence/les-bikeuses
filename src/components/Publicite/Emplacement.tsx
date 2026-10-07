import React from 'react'

/**
 * Emplacement publicitaire du corps éditorial.
 *
 * Deux états selon que `NEXT_PUBLIC_ADSENSE_CLIENT` est renseignée : une
 * réserve visible tant qu'elle ne l'est pas, le bloc AdSense ensuite. Ça
 * permet de juger la mise en page — encombrement, respiration, rythme de
 * lecture — sans rien diffuser, et sans attendre le bandeau de consentement.
 *
 * La hauteur est réservée dans les deux cas, et c'est le point qui compte :
 * une annonce qui arrive après le rendu pousse le texte vers le bas. C'est
 * ce décalage que mesure le CLS, l'un des trois critères Core Web Vitals,
 * et c'est exactement ce que les « Auto ads » de Google provoquent en
 * insérant leurs blocs où elles veulent.
 *
 * L'étiquette « Publicité » n'est pas décorative : distinguer une annonce
 * d'un contenu éditorial est une obligation légale en France.
 */
export const Emplacement: React.FC<{
  /** Identifiant du bloc dans le compte AdSense. */
  slot?: string
  /** Hauteur réservée, en pixels. */
  hauteur?: number
  className?: string
}> = ({ slot, hauteur = 280, className }) => {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

  return (
    <aside
      aria-label="Publicité"
      className={`my-10 ${className ?? ''}`}
      style={{ minHeight: hauteur + 28 }}
    >
      <p className="mono-label mb-2 text-muted-foreground/70">Publicité</p>

      {client && slot ? (
        <ins
          className="adsbygoogle block"
          data-ad-client={client}
          data-ad-format="rectangle"
          data-ad-slot={slot}
          style={{ display: 'block', minHeight: hauteur }}
        />
      ) : (
        <div
          className="grid place-items-center rounded-panneau border border-dashed border-border"
          style={{ minHeight: hauteur }}
        >
          <span className="mono-label text-muted-foreground/60">
            Emplacement réservé · {hauteur} px
          </span>
        </div>
      )}
    </aside>
  )
}
