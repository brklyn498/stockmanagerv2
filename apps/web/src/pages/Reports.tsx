import React, { useState } from 'react';
import { FileText, TrendingDown, ShoppingCart, Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { ReportCard } from '../components/reports/ReportCard';
import { ReportPreview } from '../components/reports/ReportPreview';

const Reports = () => {
    const [selectedReport, setSelectedReport] = useState<string | null>(null);

    const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
        queryKey: ['report', 'inventory'],
        queryFn: async () => {
            const response = await api.get('/reports/inventory');
            return response.data.items;
        },
        enabled: selectedReport === 'inventory',
    });

    const { data: lowStockData, isLoading: isLoadingLowStock } = useQuery({
        queryKey: ['report', 'low-stock'],
        queryFn: async () => {
            const response = await api.get('/reports/low-stock');
            return response.data.items;
        },
        enabled: selectedReport === 'low-stock',
    });

    const { data: salesData, isLoading: isLoadingSales } = useQuery({
        queryKey: ['report', 'sales'],
        queryFn: async () => {
            const response = await api.get('/reports/sales');
            return response.data.items;
        },
        enabled: selectedReport === 'sales',
    });

    const renderReportContent = () => {
        switch (selectedReport) {
            case 'inventory':
                if (isLoadingInventory) return <div>Loading report...</div>;
                return (
                    <ReportPreview
                        title="Inventory Summary"
                        data={inventoryData || []}
                        columns={[
                            { key: 'sku', label: 'SKU' },
                            { key: 'name', label: 'Product Name' },
                            { key: 'category', label: 'Category' },
                            { key: 'quantity', label: 'Qty' },
                            { key: 'price', label: 'Price', format: (val: number) => `$${val.toFixed(2)}` },
                            { key: 'value', label: 'Total Value', format: (val: number) => `$${val.toFixed(2)}` },
                            { key: 'status', label: 'Status' },
                        ]}
                        onBack={() => setSelectedReport(null)}
                    />
                );
            case 'low-stock':
                if (isLoadingLowStock) return <div>Loading report...</div>;
                return (
                    <ReportPreview
                        title="Low Stock Alert"
                        data={lowStockData || []}
                        columns={[
                            { key: 'sku', label: 'SKU' },
                            { key: 'name', label: 'Product Name' },
                            { key: 'category', label: 'Category' },
                            { key: 'quantity', label: 'Qty' },
                            { key: 'minStock', label: 'Min Stock' },
                            { key: 'supplier', label: 'Supplier' },
                            { key: 'status', label: 'Status' },
                        ]}
                        onBack={() => setSelectedReport(null)}
                    />
                );
            case 'sales':
                if (isLoadingSales) return <div>Loading report...</div>;
                return (
                    <ReportPreview
                        title="Sales Report (Last 30 Days)"
                        data={salesData || []}
                        columns={[
                            { key: 'date', label: 'Date', format: (val: string) => new Date(val).toLocaleDateString() },
                            { key: 'orderNumber', label: 'Order #' },
                            { key: 'customer', label: 'Customer' },
                            { key: 'itemsCount', label: 'Items' },
                            { key: 'totalAmount', label: 'Total', format: (val: number) => `$${val.toFixed(2)}` },
                        ]}
                        onBack={() => setSelectedReport(null)}
                    />
                );
            default:
                return null;
        }
    };

    if (selectedReport) {
        return (
            <div className="space-y-8">
                {renderReportContent()}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-yellow-400 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tight">Reports Center</h1>
                    <p className="font-bold font-mono mt-2">Generate and print business insights</p>
                </div>
                <Printer size={48} strokeWidth={2.5} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <ReportCard
                    title="Inventory Summary"
                    description="Complete list of all products with quantity, value, and stock status."
                    icon={FileText}
                    color="bg-blue-400"
                    onClick={() => setSelectedReport('inventory')}
                />

                <ReportCard
                    title="Low Stock Alert"
                    description="Products currently below minimum stock levels that need reordering."
                    icon={TrendingDown}
                    color="bg-red-400"
                    onClick={() => setSelectedReport('low-stock')}
                />

                <ReportCard
                    title="Sales Report"
                    description="Summary of completed orders and revenue performance."
                    icon={ShoppingCart}
                    color="bg-green-400"
                    onClick={() => setSelectedReport('sales')}
                />
            </div>
        </div>
    );
};

export default Reports;
