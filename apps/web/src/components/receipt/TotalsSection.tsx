import React from 'react';
import { ReceiptData } from './types';

interface TotalsSectionProps {
    data: ReceiptData;
}

export const TotalsSection: React.FC<TotalsSectionProps> = ({ data }) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 relative">
            {/* Decorative Geometric Shapes */}
            <div className="hidden md:block absolute bottom-0 left-0 w-12 h-12 bg-[#93c5fd] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-full h-full bg-[linear-gradient(135deg,transparent_50%,rgba(0,0,0,1)_50%,rgba(0,0,0,1)_55%,transparent_55%)]"></div>
            </div>

            {/* Spacer for the shape above */}
            <div className="w-20 hidden md:block"></div>

            <div className="w-full md:w-80 border-[3px] border-black bg-[#fdfbf7] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-0">
                <div className="p-3 flex justify-between font-bold border-b-[2px] border-black/10">
                    <span>Subtotal</span>
                    <span>${data.subtotal.toFixed(2)}</span>
                </div>
                <div className="p-3 flex justify-between font-bold border-b-[2px] border-black/10">
                    <span>Tax ({data.taxRate * 100}%)</span>
                    <span>${data.taxAmount.toFixed(2)}</span>
                </div>
                <div className="p-3 flex justify-between font-bold border-b-[3px] border-black">
                    <span>Shipping</span>
                    <span>${data.shipping.toFixed(2)}</span>
                </div>
                <div className="p-3 flex justify-between font-black text-xl bg-[#fef08a] text-[#1d4ed8]">
                    <span className="uppercase tracking-tighter text-black/80">Grand Total</span>
                    <span>${data.grandTotal.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};
