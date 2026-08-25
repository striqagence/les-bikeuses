'use client'
import { Header } from '@/payload-types'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

export const RowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<NonNullable<Header['navItems']>[number]>()

  const label = data?.data?.link?.label
  if (!label) return <div>Entrée</div>

  const nb = data?.data?.sousItems?.length ?? 0
  const suffixe = nb ? ` — ${nb} sous-entrée${nb > 1 ? 's' : ''}` : ''

  return (
    <div>
      {label}
      {suffixe}
    </div>
  )
}
