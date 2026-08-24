import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { DebuterBlock } from '@/blocks/Debuter/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { IndexCategoriesBlock } from '@/blocks/IndexCategories/Component'
import { JournalBlock } from '@/blocks/Journal/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { ParcoursBlock } from '@/blocks/Parcours/Component'

const blockComponents = {
  archive: ArchiveBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  debuter: DebuterBlock,
  formBlock: FormBlock,
  indexCategories: IndexCategoriesBlock,
  journal: JournalBlock,
  mediaBlock: MediaBlock,
  parcours: ParcoursBlock,
}

// Les blocs de la DA gèrent leur propre rythme vertical, et certains sont pleine
// largeur avec un fond : la marge générique `my-16` les décollerait du bord.
const blocsAutonomes = new Set(['debuter', 'indexCategories', 'journal', 'parcours'])

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              if (blocsAutonomes.has(blockType)) {
                // @ts-expect-error there may be some mismatch between the expected types here
                return <Block {...block} key={index} />
              }

              return (
                <div className="my-16" key={index}>
                  {/* @ts-expect-error there may be some mismatch between the expected types here */}
                  <Block {...block} disableInnerContainer />
                </div>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
