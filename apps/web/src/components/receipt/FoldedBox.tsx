import React from 'react';

interface FoldedBoxProps {
    title: string;
    children: React.ReactNode;
    className?: string;
}

export const FoldedBox: React.FC<FoldedBoxProps> = ({ title, children, className = '' }) => {
    return (
        <div className={`relative ${className}`}>
            {/* Main Box Container with Shadow */}
            <div className="relative z-10 h-full bg-[#e5e7eb] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">

                {/* The Fold Cutout Effect (CSS Clip Path) */}
                <div
                    className="h-full w-full bg-[#e5e7eb] p-4 pr-8 relative"
                    style={{
                        clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)'
                    }}
                >
                    <h3 className="font-bold text-sm mb-2 border-b-2 border-black inline-block uppercase tracking-wider">
                        {title}
                    </h3>
                    <div className="text-sm font-medium leading-relaxed">
                        {children}
                    </div>
                </div>

                {/* The Fold Triangle (Decorative) - Positioned absolutely to cover the missing clip-path area */}
                <div className="absolute top-0 right-0 w-[24px] h-[24px] bg-black">
                    {/* The white part of the fold */}
                    <div className="absolute top-[3px] right-[3px] w-[24px] h-[24px] bg-white border-l-[3px] border-b-[3px] border-black rounded-bl-md"></div>
                </div>
            </div>
        </div>
    );
};
