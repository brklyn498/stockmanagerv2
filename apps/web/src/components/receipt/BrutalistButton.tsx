import React from 'react';

interface BrutalistButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
    icon?: React.ReactNode;
}

export const BrutalistButton: React.FC<BrutalistButtonProps> = ({
    children,
    variant = 'primary',
    icon,
    className = '',
    ...props
}) => {
    const baseStyles = "flex items-center gap-2 px-4 py-2 font-bold border-[3px] border-black transition-transform active:translate-y-1 active:shadow-none";
    const variants = {
        primary: "bg-[#93c5fd] hover:bg-[#60a5fa] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]", // Blueish
        secondary: "bg-[#fef9c3] hover:bg-[#fde047] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"  // Yellowish/Cream
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {icon}
            <span>{children}</span>
        </button>
    );
};
