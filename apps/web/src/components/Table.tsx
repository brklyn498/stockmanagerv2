interface TableProps {
  children: React.ReactNode
  className?: string
}

interface TableHeaderProps {
  children: React.ReactNode
}

interface TableBodyProps {
  children: React.ReactNode
}

interface TableRowProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

interface TableHeadProps {
  children: React.ReactNode
  className?: string
}

export interface TableCellProps {
  children?: React.ReactNode
  className?: string
  colSpan?: number
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-4 border-black ${className}`}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ children }: TableHeaderProps) {
  return (
    <thead className="bg-yellow-400 border-b-4 border-black">
      {children}
    </thead>
  )
}

export function TableBody({ children }: TableBodyProps) {
  return <tbody>{children}</tbody>
}

export function TableRow({ children, onClick, className = '' }: TableRowProps) {
  return (
    <tr
      className={`border-b-2 border-black hover:bg-yellow-100 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export function TableHead({ children, className = '' }: TableHeadProps) {
  return (
    <th
      className={`px-4 py-3 text-left font-bold text-black border-r-2 border-black last:border-r-0 ${className}`}
    >
      {children}
    </th>
  )
}

export function TableCell({ children, className = '', colSpan }: TableCellProps) {
  return (
    <td
      colSpan={colSpan}
      className={`px-4 py-3 border-r-2 border-black last:border-r-0 font-medium ${className}`}
    >
      {children}
    </td>
  )
}
