import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ReportCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    onClick: () => void;
    color: string;
}

export const ReportCard: React.FC<ReportCardProps> = ({ title, description, icon: Icon, onClick, color }) => {
    return (
        <button
            onClick={onClick}
            className={`
        w-full text-left p-6 border-4 border-black bg-white 
        shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] 
        hover:translate-x-1 hover:translate-y-1 
        hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
        active:translate-x-2 active:translate-y-2 
        active:shadow-none transition-all
        flex flex-col h-full
      `}
        >
            <div className={`p-4 border-4 border-black ${color} w-fit mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
                <Icon size={32} strokeWidth={2.5} className="text-black" />
            </div>
            <h3 className="text-2xl font-black uppercase mb-2">{title}</h3>
            <p className="text-gray-600 font-bold font-mono text-sm">{description}</p>
        </button>
    );
};
