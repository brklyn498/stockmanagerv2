import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { ReceiptHeader } from '../components/receipt/ReceiptHeader';
import { FoldedBox } from '../components/receipt/FoldedBox';
import { LineItemTable } from '../components/receipt/LineItemTable';
import { TotalsSection } from '../components/receipt/TotalsSection';
import { FooterSection } from '../components/receipt/FooterSection';
import { BrutalistButton } from '../components/receipt/BrutalistButton';
import { ReceiptData } from '../components/receipt/types';

export default function Receipt() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const receiptRef = useRef<HTMLDivElement>(null);

    const { data: order, isLoading, error } = useQuery({
        queryKey: ['order', id],
        queryFn: async () => {
            const { data } = await api.get(`/orders/${id}`);
            return data;
        },
        enabled: !!id,
    });

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        window.print(); // Browser's print to PDF is the most reliable way without heavy libraries
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f4f4f5]">
                <div className="text-2xl font-black uppercase tracking-tighter">Loading Receipt...</div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f4f5] gap-4">
                <div className="text-2xl font-black uppercase tracking-tighter text-red-600">Error Loading Receipt</div>
                <BrutalistButton onClick={() => navigate('/orders')} icon={<ArrowLeft size={18} />}>
                    Back to Orders
                </BrutalistButton>
            </div>
        );
    }

    // Map API data to ReceiptData format
    const receiptData: ReceiptData = {
        orderId: order.orderNumber,
        date: new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        time: new Date(order.createdAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        }),
        from: {
            name: "Stock Manager Inc.",
            address1: "123 Warehouse Blvd",
            address2: "Business District, NY 10001",
            email: "contact@stockmanager.com"
        },
        to: {
            name: order.supplier?.name || order.user?.name || "Valued Customer",
            address1: "Client Address Line 1", // Placeholder as we don't store client addresses yet
            address2: "Client City, ST 12345",
            email: "client@email.com"
        },
        items: order.items.map((item: any) => ({
            id: item.id,
            sku: item.product.sku,
            name: item.product.name,
            qty: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice
        })),
        subtotal: order.totalAmount, // Assuming totalAmount is subtotal for now
        taxRate: 0.08, // Example tax rate
        taxAmount: order.totalAmount * 0.08, // Example calculation
        shipping: 0,
        grandTotal: order.totalAmount * 1.08, // Example calculation
        paymentMethod: order.type === 'PURCHASE' ? 'Bank Transfer' : 'Credit Card'
    };

    return (
        <div className="min-h-screen bg-[#f4f4f5] p-4 md:p-8 font-sans text-black overflow-x-hidden print:bg-white print:p-0">

            {/* Top Action Bar - Hidden when printing */}
            <div className="max-w-4xl mx-auto flex justify-between items-center mb-8 sticky top-4 z-50 print:hidden">
                <BrutalistButton onClick={() => navigate('/orders')} icon={<ArrowLeft size={18} />} variant="secondary">
                    Back
                </BrutalistButton>
                <div className="flex gap-4">
                    <BrutalistButton variant="primary" icon={<Printer size={18} />} onClick={handlePrint}>
                        Print Receipt
                    </BrutalistButton>
                    <BrutalistButton variant="secondary" icon={<Download size={18} />} onClick={handleDownloadPDF}>
                        Save as PDF
                    </BrutalistButton>
                </div>
            </div>

            {/* Main Receipt Container */}
            <div ref={receiptRef} className="max-w-4xl mx-auto bg-[#fdfbf7] p-4 md:p-8 lg:p-12 border-[4px] border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative print:shadow-none print:border-0 print:p-0">

                {/* Decorative corner triangle (bottom left) outside the main flow */}
                <div className="absolute -left-3 bottom-40 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[12px] border-l-transparent border-r-transparent border-t-black -rotate-90 hidden lg:block print:hidden"></div>

                <ReceiptHeader data={receiptData} />

                {/* Address Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <FoldedBox title="From:">
                        <p className="font-bold">{receiptData.from.name}</p>
                        <p>{receiptData.from.address1}</p>
                        <p>{receiptData.from.address2}</p>
                        <p className="mt-2 text-xs font-mono">{receiptData.from.email}</p>
                    </FoldedBox>
                    <FoldedBox title="To:">
                        <p className="font-bold">{receiptData.to.name}</p>
                        <p>{receiptData.to.address1}</p>
                        <p>{receiptData.to.address2}</p>
                        <p className="mt-2 text-xs font-mono">{receiptData.to.email}</p>
                    </FoldedBox>
                </div>

                <LineItemTable items={receiptData.items} />

                <TotalsSection data={receiptData} />

                <FooterSection paymentMethod={receiptData.paymentMethod} />

            </div>

            <div className="text-center mt-12 text-gray-400 text-sm font-mono print:hidden">
                Built with React & Tailwind • Brutalist Aesthetics
            </div>
        </div>
    );
};
