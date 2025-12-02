/**
 * Export Utility
 * Handles data export to CSV and Excel formats
 */
import * as ExcelJS from 'exceljs'

type ExportData = Record<string, any>[]

export interface ExportColumn {
  header: string
  key: string
  width?: number
}

/**
 * Helper function to trigger file download using native browser APIs
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()

  // Clean up
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 100)
}

/**
 * Converts an array of objects to CSV string
 */
export function convertToCSV(data: ExportData, headers?: string[]): string {
  if (data.length === 0) {
    return ''
  }

  // Use provided headers or extract from first object
  const csvHeaders = headers || Object.keys(data[0])

  // Create header row
  const headerRow = csvHeaders.join(',')

  // Create data rows
  const dataRows = data.map((row) => {
    return csvHeaders
      .map((header) => {
        const value = row[header]
        // Handle null/undefined
        if (value === null || value === undefined) {
          return ''
        }
        // Convert to string and escape quotes
        const stringValue = String(value).replace(/"/g, '""')
        // Wrap in quotes if contains comma, newline, or quote
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue}"`
        }
        return stringValue
      })
      .join(',')
  })

  return [headerRow, ...dataRows].join('\n')
}

/**
 * Main CSV export function
 */
export function exportToCSV(
  data: ExportData,
  filename: string,
  headers?: string[]
): void {
  if (data.length === 0) {
    console.warn('No data to export')
    return
  }

  const csvContent = convertToCSV(data, headers)
  const timestamp = new Date().toISOString().split('T')[0]
  const fullFilename = `${filename}_${timestamp}.csv`

  // Add BOM for Excel UTF-8 compatibility
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadFile(blob, fullFilename)
}

/**
 * Main Excel export function
 */
export async function exportToExcel(
  data: ExportData,
  columns: ExportColumn[],
  filename: string,
  sheetName: string = 'Sheet1'
): Promise<void> {
  if (data.length === 0) {
    console.warn('No data to export')
    return
  }

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName)

  // Define columns
  worksheet.columns = columns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width || 20
  }))

  // Apply "Creative" Neobrutalism Styling to Header
  // Yellow-400 (#FACC15) background, Bold Font, Thick Black Border
  const headerRow = worksheet.getRow(1)
  headerRow.height = 30

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFACC15' } // Yellow-400
    }
    cell.font = {
      name: 'Arial',
      size: 12,
      bold: true,
      color: { argb: 'FF000000' }
    }
    cell.border = {
      top: { style: 'thick', color: { argb: 'FF000000' } },
      left: { style: 'thick', color: { argb: 'FF000000' } },
      bottom: { style: 'thick', color: { argb: 'FF000000' } },
      right: { style: 'thick', color: { argb: 'FF000000' } }
    }
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center'
    }
  })

  // Add Data
  data.forEach((item) => {
    worksheet.addRow(item)
  })

  // Style Data Rows
  // Thin borders
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
        cell.alignment = { vertical: 'middle', wrapText: true }
      })
    }
  })

  // Generate Buffer
  const buffer = await workbook.xlsx.writeBuffer()

  // Save File
  const timestamp = new Date().toISOString().split('T')[0]
  const fullFilename = `${filename}_${timestamp}.xlsx`
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

  downloadFile(blob, fullFilename)
}

/**
 * Format product data for export
 */
export function formatProductsForExport(products: any[]) {
  return products.map((product) => ({
    sku: product.sku,
    name: product.name,
    description: product.description || '',
    category: product.category?.name || '',
    supplier: product.supplier?.name || '',
    price: product.price,
    costPrice: product.costPrice,
    quantity: product.quantity,
    minStock: product.minStock,
    maxStock: product.maxStock || '',
    unit: product.unit,
    barcode: product.barcode || '',
    isActive: product.isActive ? 'Active' : 'Inactive',
    createdAt: new Date(product.createdAt).toLocaleString(),
    // Helper fields for derived columns
    stockStatus: product.quantity === 0 ? 'Out of Stock' : product.quantity < product.minStock ? 'Low Stock' : 'Normal'
  }))
}

export const PRODUCT_EXPORT_COLUMNS: ExportColumn[] = [
  { header: 'SKU', key: 'sku', width: 15 },
  { header: 'Name', key: 'name', width: 30 },
  { header: 'Category', key: 'category', width: 20 },
  { header: 'Supplier', key: 'supplier', width: 20 },
  { header: 'Price', key: 'price', width: 12 },
  { header: 'Cost', key: 'costPrice', width: 12 },
  { header: 'Qty', key: 'quantity', width: 10 },
  { header: 'Unit', key: 'unit', width: 10 },
  { header: 'Min Stock', key: 'minStock', width: 12 },
  { header: 'Max Stock', key: 'maxStock', width: 12 },
  { header: 'Status', key: 'isActive', width: 12 },
  { header: 'Created At', key: 'createdAt', width: 20 },
  { header: 'Description', key: 'description', width: 40 },
  { header: 'Barcode', key: 'barcode', width: 15 },
]

/**
 * Format stock movements data for export
 */
export function formatMovementsForExport(movements: any[]) {
  return movements.map((movement) => ({
    date: new Date(movement.createdAt).toLocaleString(),
    productName: movement.product?.name || '',
    sku: movement.product?.sku || '',
    type: movement.type,
    quantity: movement.quantity,
    reason: movement.reason || '',
    reference: movement.reference || '',
    user: movement.user?.name || '',
  }))
}

export const MOVEMENT_EXPORT_COLUMNS: ExportColumn[] = [
  { header: 'Date', key: 'date', width: 22 },
  { header: 'Product', key: 'productName', width: 30 },
  { header: 'SKU', key: 'sku', width: 15 },
  { header: 'Type', key: 'type', width: 15 },
  { header: 'Quantity', key: 'quantity', width: 12 },
  { header: 'Reason', key: 'reason', width: 30 },
  { header: 'Reference', key: 'reference', width: 20 },
  { header: 'User', key: 'user', width: 20 },
]

/**
 * Format orders data for export
 */
export function formatOrdersForExport(orders: any[]) {
  return orders.map((order) => ({
    orderNumber: order.orderNumber,
    type: order.type,
    status: order.status,
    supplier: order.supplier?.name || '',
    totalAmount: order.totalAmount,
    itemCount: order.items?.length || 0,
    notes: order.notes || '',
    createdBy: order.user?.name || '',
    createdAt: new Date(order.createdAt).toLocaleString(),
  }))
}

export const ORDER_EXPORT_COLUMNS: ExportColumn[] = [
  { header: 'Order #', key: 'orderNumber', width: 15 },
  { header: 'Type', key: 'type', width: 15 },
  { header: 'Status', key: 'status', width: 15 },
  { header: 'Supplier', key: 'supplier', width: 20 },
  { header: 'Total', key: 'totalAmount', width: 15 },
  { header: 'Items', key: 'itemCount', width: 10 },
  { header: 'Created By', key: 'createdBy', width: 20 },
  { header: 'Created At', key: 'createdAt', width: 22 },
  { header: 'Notes', key: 'notes', width: 40 },
]
