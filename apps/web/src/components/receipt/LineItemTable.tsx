import React from 'react';
import { LineItem } from './types';

interface LineItemTableProps {
    items: LineItem[];
}

export const LineItemTable: React.FC<LineItemTableProps> = ({ items }) => {
    return (
        <div className="border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden mb-8">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-black text-white uppercase text-sm font-bold tracking-wider">
                        <th className="p-3 border-r-[2px] border-white/20 w-1/2">Item</th>
                        <th className="p-3 border-r-[2px] border-white/20 text-center">Qty</th>
                        <th className="p-3 border-r-[2px] border-white/20 text-right">Unit Price</th>
                        <th className="p-3 text-right">Total</th>
                    </tr>
                </thead>
                <tbody className="font-mono text-sm font-bold">
                    {items.map((item, index) => (
                        <tr
                            key={item.id}
                            className={`border-b-[2px] border-black ${index % 2 === 0 ? 'bg-[#fef08a]' : 'bg-[#e5e7eb]'
                                }`}
                        >
                            <td className="p-3 border-r-[3px] border-black">
                                <span className="block text-xs opacity-70 mb-1">{item.sku}</span>
                                <span className="text-base">{item.name}</span>
                            </td>
                            <td className="p-3 border-r-[3px] border-black text-center">{item.qty}</td>
                            <td className="p-3 border-r-[3px] border-black text-right">${item.unitPrice.toFixed(2)}</td>
                            <td className="p-3 text-right">${item.total.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
