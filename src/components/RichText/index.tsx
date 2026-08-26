import { MediaBlock } from '@/blocks/MediaBlock/Component'
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedLinkNode,
  type DefaultTypedEditorState,
} from '@payloadcms/richtext-lexical'
import {
  JSXConvertersFunction,
  LinkJSXConverter,
  RichText as ConvertRichText,
} from '@payloadcms/richtext-lexical/react'

import { CodeBlock, CodeBlockProps } from '@/blocks/Code/Component'

import type {
  BannerBlock as BannerBlockProps,
  CallToActionBlock as CTABlockProps,
  MediaBlock as MediaBlockProps,
} from '@/payload-types'
import { BannerBlock } from '@/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { cn } from '@/utilities/ui'
import { ancre } from '@/utilities/sommaire'

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<CTABlockProps | MediaBlockProps | BannerBlockProps | CodeBlockProps>

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { value, relationTo } = linkNode.fields.doc!
  if (typeof value !== 'object') {
    throw new Error('Expected value to be an object')
  }
  const slug = value.slug
  return relationTo === 'posts' ? `/posts/${slug}` : `/${slug}`
}

const texteDuNoeud = (noeud: { text?: string; children?: unknown[] }): string =>
  noeud.text ??
  ((noeud.children ?? []) as { text?: string; children?: unknown[] }[])
    .map(texteDuNoeud)
    .join('')

/**
 * Les convertisseurs sont fabriqués à chaque rendu, et non partagés au niveau
 * du module : le compteur de doublons doit repartir de zéro pour chaque
 * article, sinon le deuxième article rendu hériterait des suffixes du premier.
 *
 * Les titres reçoivent une ancre calculée par la même fonction que le
 * sommaire (`ancre`), avec la même règle de suffixe sur les doublons — sans
 * quoi les liens du sommaire ne pointeraient sur rien.
 */
const fabriqueConverters = (): JSXConvertersFunction<NodeTypes> => {
  const compteur = new Map<string, number>()

  return ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  heading: ({ node, nodesToJSX }) => {
    const Balise = node.tag as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    const enfants = nodesToJSX({ nodes: node.children })

    if (Balise !== 'h2' && Balise !== 'h3') return <Balise>{enfants}</Balise>

    const base = ancre(texteDuNoeud(node as never).trim())
    const vu = compteur.get(base) ?? 0
    compteur.set(base, vu + 1)

    return <Balise id={vu === 0 ? base : `${base}-${vu + 1}`}>{enfants}</Balise>
  },
  blocks: {
    banner: ({ node }) => <BannerBlock className="col-start-2 mb-4" {...node.fields} />,
    mediaBlock: ({ node }) => (
      <MediaBlock
        className="col-start-1 col-span-3"
        imgClassName="m-0"
        {...node.fields}
        captionClassName="mx-auto max-w-[48rem]"
        enableGutter={false}
        disableInnerContainer={true}
      />
    ),
    code: ({ node }) => <CodeBlock className="col-start-2" {...node.fields} />,
    cta: ({ node }) => <CallToActionBlock {...node.fields} />,
  },
  })
}

type Props = {
  data: DefaultTypedEditorState
  enableGutter?: boolean
  enableProse?: boolean
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const { className, enableProse = true, enableGutter = true, ...rest } = props
  return (
    <ConvertRichText
      converters={fabriqueConverters()}
      className={cn(
        'payload-richtext',
        {
          container: enableGutter,
          'max-w-none': !enableGutter,
          'mx-auto prose md:prose-md dark:prose-invert': enableProse,
        },
        className,
      )}
      {...rest}
    />
  )
}
