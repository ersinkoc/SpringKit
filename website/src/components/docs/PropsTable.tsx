import { ReactNode } from 'react'

export interface PropRow {
  name: string
  type: string
  default?: string
  description: ReactNode
}

interface PropsTableProps {
  rows: PropRow[]
  /** Accessible caption (visually hidden) */
  caption: string
}

/** Responsive props/options table in the docs style */
export function PropsTable({ rows, caption }: PropsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm text-left">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Prop</th>
            <th scope="col" className="px-4 py-3 font-medium">Type</th>
            <th scope="col" className="px-4 py-3 font-medium">Default</th>
            <th scope="col" className="px-4 py-3 font-medium">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row) => (
            <tr key={row.name} className="align-top">
              <th scope="row" className="px-4 py-3 font-mono text-orange-300 font-normal whitespace-nowrap">
                {row.name}
              </th>
              <td className="px-4 py-3 font-mono text-xs text-cyan-200/80 min-w-[10rem]">{row.type}</td>
              <td className="px-4 py-3 font-mono text-xs text-white/70 whitespace-nowrap">{row.default ?? '—'}</td>
              <td className="px-4 py-3 text-muted-foreground min-w-[16rem]">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
