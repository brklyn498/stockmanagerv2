// 
// SIMPLE 3-STEP INTEGRATION FOR VIEW MODE
// ProductCard and ProductsGrid are already created
//

// =============================================
// STEP 1: Add import (Line 15, after ProductImage)
// =============================================
import ProductsGrid from '../components/ProductsGrid'


// =============================================
// STEP 2: Add view mode state (after line 73: const limit = 10)
// =============================================

// View mode state
const [viewMode, setViewMode] = useState < 'table' | 'cards' | 'compact' > (() => {
    return (localStorage.getItem('productsViewMode') as any) || 'table'
})

const handleViewModeChange = (mode: 'table' | 'cards' | 'compact') => {
    setViewMode(mode)
    localStorage.setItem('productsViewMode', mode)
}


// =============================================
// STEP 3: Add view toggle buttons (line 511, before bulk actions)
// Find this line:  <div className="flex gap-3">
// Add these buttons right after it:
// =============================================

{/* View Mode Toggle */ }
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


// =============================================
// STEP 4: Wrap the table in conditional rendering
// Find: {/* Products Table */} around line 590
// Replace ONLY these TWO lines:
//   {/* Products Table */}
//   <Card>
// With:
// =============================================

{/* Products Display - Conditional View Mode */ }
{
    viewMode === 'cards' ? (
        <ProductsGrid
            products={products}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
            isLoading={productsLoading}
        />
    ) : (
    <Card>


// =============================================
// STEP 5: Close the conditional rendering
// Find the LAST line before {/* Product Form Modal */}
// Replace:        </Card>
// With:
// =============================================

        </Card >
      )
}


// DONE! That's all 5 steps.
// The cards view will now work!
