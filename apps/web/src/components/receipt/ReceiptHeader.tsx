import React from 'react';
import { ReceiptData } from './types';
import { Package } from 'lucide-react';

interface ReceiptHeaderProps {
    data: ReceiptData;
}

export const ReceiptHeader: React.FC<ReceiptHeaderProps> = ({ data }) => {
    return (
        <div className="relative border-[3px] border-black bg-[#fdfbf7] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-8 overflow-hidden">
            {/* Striped Background Pattern for decoration */}
            <div className="absolute top-0 left-0 w-full h-4 bg-[repeating-linear-gradient(45deg,#000_0,#000_1px,transparent_0,transparent_10px)] opacity-10"></div>
            <div className="absolute top-0 left-0 w-full h-4 border-b-[3px] border-black bg-[#fef08a]"></div>

            <div className="p-6 pt-10 flex flex-col md:flex-row justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Package size={24} strokeWidth={2.5} />
                        <span className="font-bold text-lg tracking-wider">STOCK MANAGER</span>
                    </div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter" style={{ fontFamily: 'Impact, sans-serif' }}>
                        Sales Receipt
                    </h1>
                </div>

                <div className="mt-4 md:mt-0 text-right font-mono text-sm font-bold">
                    <div className="mb-1">Order ID: {data.orderId}</div>
                    <div className="mb-1">Date: {data.date}</div>
                    <div>Time: {data.time}</div>
                </div>
            </div>

            {/* Decorative corner stripes */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-[repeating-linear-gradient(-45deg,#fef08a_0,#fef08a_5px,#000_5px,#000_6px)] border-l-[3px] border-b-[3px] border-black hidden md:block"></div>
        </div>
    );
};
