"""
Script to add view mode functionality to Products.tsx
"""
import re

# Read the file
with open(r'd:\claudecode\stock manager\apps\web\src\pages\Products.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add ProductsGrid import
content = content.replace(
    "import ProductImage from '../components/ProductImage'",
    "import ProductImage from '../components/ProductImage'\nimport ProductsGrid from '../components/ProductsGrid'"
)

# 2. Add view mode state after limit = 10
view_mode_code = """
  // View mode state
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'compact'>(() => {
    return (localStorage.getItem('productsViewMode') as any) || 'table'
  })

  const handleViewModeChange = (mode: 'table' | 'cards' | 'compact') => {
    setViewMode(mode)
    localStorage.setItem('productsViewMode', mode)
  }
"""

content = content.replace(
    "  const limit = 10\r\n\r\n  // Filter state",
    f"  const limit = 10\r\n{view_mode_code}\r\n  // Filter state"
)

# 3. Add view toggle buttons before bulk actions dropdown
toggle_buttons = """          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'table' ? 'primary' : 'secondary'}
              onClick={() => handleViewModeChange('table')}
              className="text-sm py-2"
            >
              ☰ Table
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'primary' : 'secondary'}
              onClick={() => handleViewModeChange('cards')}
              className="text-sm py-2"
            >
              ▦ Cards
            </Button>
            <Button
              variant={viewMode === 'compact' ? 'primary' : 'secondary'}
              onClick={() => handleViewModeChange('compact')}
              className="text-sm py-2"
            >
              ≡ Compact
            </Button>
          </div>

"""

content = content.replace(
    "        </div>\r\n        <div className=\"flex gap-3\">\r\n          {selectedIds.size > 0 && (",
    f"        </div>\r\n        <div className=\"flex gap-3\">\r\n{toggle_buttons}          {{selectedIds.size > 0 && ("
)

# 4. Replace table rendering with conditional rendering
# Find the start of Products Table comment
table_start = content.find("      {/* Products Table */}")
# Find the matching Card close tag - we need to be careful here
card_count = 0
table_end_search_start = table_start + 100
i = table_end_search_start
while i < len(content):
    if content[i:i+6] == "<Card>":
        card_count += 1
    elif content[i:i+7] == "</Card>":
        if card_count == 0:
            table_end = i + 7
            break
        card_count -= 1
    i += 1

new_rendering = """      {/* Products Display - Conditional View Mode */}
      {viewMode === 'cards' ? (
        <ProductsGrid
          products={products}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
          isLoading={productsLoading}
        />
      ) : (
        <Card>
          {productsLoading ? (
            <div className="text-center py-8 font-bold">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 font-bold">
              No products found. Add your first product!
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === products.length && products.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-5 h-5 border-4 border-black cursor-pointer"
                      />
                    </TableHead>
                    {viewMode === 'table' && <TableHead>Image</TableHead>}
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    {viewMode === 'table' && <TableHead>Supplier</TableHead>}
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: Product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(product.id)}
                          onChange={(e) => handleSelectOne(product.id, e.target.checked)}
                          className="w-5 h-5 border-4 border-black cursor-pointer"
                        />
                      </TableCell>
                      {viewMode === 'table' && (
                        <TableCell>
                          <div
                            className="w-12 h-12 flex-shrink-0 border-2 border-black cursor-pointer"
                            onClick={() => navigate(`/products/${product.id}`)}
                          >
                            {product.imageUrl ? (
                              <img
                                src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}${product.imageUrl}`}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                <span className="text-xs">No Img</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>{product.sku}</TableCell>
                      <TableCell className="font-bold">{product.name}</TableCell>
                      <TableCell>{product.category.name}</TableCell>
                      {viewMode === 'table' && <TableCell>{product.supplier?.name || 'N/A' }</TableCell>}
                      <TableCell className="font-bold">${product.price.toFixed(2)}</TableCell>
                      <TableCell>{product.quantity} {product.unit}</TableCell>
                      <TableCell>{getStockBadge(product.quantity, product.minStock)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal(product)}
                            className="px-3 py-1 bg-cyan-400 border-2 border-black font-bold hover:translate-x-0.5 hover:translate-y-0.5"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="px-3 py-1 bg-red-400 border-2 border-black font-bold hover:translate-x-0.5 hover:translate-y-0.5"
                          >
                            Delete
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table"""

# Find pagination section and preserve it
pagination_start_marker = "            {/* Pagination */}"
pagination_start_idx = content.find(pagination_start_marker, table_start)
pagination_section = content[pagination_start_idx:table_end-25]  # Get until before </Card>

full_new_rendering = new_rendering + ">\r\n" + pagination_section + "\r\n            </>\r\n          )}\r\n        </Card>\r\n      )}"

content = content[:table_start] + full_new_rendering + content[table_end:]

# Write back
with open(r'd:\claudecode\stock manager\apps\web\src\pages\Products.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated Products.tsx with view mode functionality!")
