import React from 'react'

/**
 * « L'essentiel de cet article » — synthèse en tête d'article.
 *
 * Aplat pêche pleine largeur, à ne pas confondre avec le bloc « Bon à savoir »
 * qui s'insère dans le fil du texte : deux fonctions, deux traitements.
 */
export const Essentiel: React.FC<{ points: { texte: string; id?: string | null }[] }> = ({
  points,
}) => {
  if (!points.length) return null

  return (
    <section className="mb-11 border border-primary/25 bg-accent p-5 md:p-7">
      <h2 className="mono-label mb-4 flex items-center gap-2.5 text-primary">
        <span aria-hidden="true" className="h-0.5 w-[22px] flex-none bg-current" />
        L’essentiel de cet article
      </h2>
      <ul className="flex list-none flex-col gap-3 p-0">
        {points.map((point, i) => (
          <li className="relative pl-6 leading-relaxed" key={point.id ?? i}>
            <span
              aria-hidden="true"
              className="absolute top-[0.55em] left-0 size-2 bg-primary"
            />
            <Gras texte={point.texte} />
          </li>
        ))}
      </ul>
    </section>
  )
}

// Même convention que le bandeau d'annonce et le pied de page : **texte** en gras.
const Gras: React.FC<{ texte: string }> = ({ texte }) => (
  <>
    {texte.split(/\*\*(.+?)\*\*/g).map((morceau, i) =>
      i % 2 === 1 ? <b key={i}>{morceau}</b> : <React.Fragment key={i}>{morceau}</React.Fragment>,
    )}
  </>
)
