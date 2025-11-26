/**
 * CSV Export Utility
 * Converts data to CSV format and triggers browser download
 */

type ExportData = Record<string, any>[]

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
 * Downloads CSV data as a file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for Excel UTF-8 compatibility
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up the URL object
  URL.revokeObjectURL(url)
}

/**
 * Main export function - converts data and triggers download
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

  downloadCSV(csvContent, fullFilename)
}

/**
 * Format product data for CSV export
 */
export function formatProductsForExport(products: any[]) {
  return products.map((product) => ({
    SKU: product.sku,
    Name: product.name,
    Description: product.description || '',
    Category: product.category?.name || '',
    Supplier: product.supplier?.name || '',
    Price: product.price,
    'Cost Price': product.costPrice,
    Quantity: product.quantity,
    'Min Stock': product.minStock,
    'Max Stock': product.maxStock || '',
    Unit: product.unit,
    Barcode: product.barcode || '',
    Status: product.isActive ? 'Active' : 'Inactive',
    'Created At': new Date(product.createdAt).toLocaleString(),
  }))
}

/**
 * Format stock movements data for CSV export
 */
export function formatMovementsForExport(movements: any[]) {
  return movements.map((movement) => ({
    Date: new Date(movement.createdAt).toLocaleString(),
    Product: movement.product?.name || '',
    SKU: movement.product?.sku || '',
    Type: movement.type,
    Quantity: movement.quantity,
    Reason: movement.reason || '',
    Reference: movement.reference || '',
    User: movement.user?.name || '',
  }))
}

/**
 * Format orders data for CSV export
 */
export function formatOrdersForExport(orders: any[]) {
  return orders.map((order) => ({
    'Order Number': order.orderNumber,
    Type: order.type,
    Status: order.status,
    Supplier: order.supplier?.name || '',
    'Total Amount': order.totalAmount,
    'Item Count': order.items?.length || 0,
    Notes: order.notes || '',
    'Created By': order.user?.name || '',
    'Created At': new Date(order.createdAt).toLocaleString(),
  }))
}
