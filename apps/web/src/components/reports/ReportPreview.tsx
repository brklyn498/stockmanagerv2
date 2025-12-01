import React, { useRef } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface ReportPreviewProps {
    title: string;
    data: any[];
    columns: { key: string; label: string; format?: (value: any) => string }[];
    onBack: () => void;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({ title, data, columns, onBack }) => {
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center print:hidden">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 font-bold hover:underline"
                >
                    <ArrowLeft size={20} /> Back to Reports
                </button>
                <button
                    onClick={() => handlePrint()}
                    className="bg-yellow-400 border-4 border-black px-6 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
                >
                    <Printer size={20} /> Print Report
                </button>
            </div>

            <div ref={componentRef} className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] print:shadow-none print:border-0 print:p-0">
                {/* Print Header */}
                <div className="mb-8 border-b-4 border-black pb-4">
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter">{title}</h1>
                            <p className="font-mono font-bold text-gray-600 mt-2">Generated: {new Date().toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold">STOCK MANAGER</h2>
                            <p className="text-sm font-mono">Inventory Management System</p>
                        </div>
                    </div>
                </div>

                {/* Report Content */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-black text-white">
                                {columns.map((col) => (
                                    <th key={col.key} className="p-3 text-left font-bold uppercase border-2 border-black">
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <tr key={index} className="even:bg-gray-100">
                                    {columns.map((col) => (
                                        <td key={col.key} className="p-3 border-2 border-black font-mono">
                                            {col.format ? col.format(row[col.key]) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Print Footer */}
                <div className="mt-8 pt-4 border-t-4 border-black text-center font-mono text-sm hidden print:block">
                    <p>Printed from Stock Manager v2</p>
                </div>
            </div>
        </div>
    );
};
