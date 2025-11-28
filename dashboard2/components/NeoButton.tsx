import React from 'react';

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent';
  icon?: React.ReactNode;
}

const NeoButton: React.FC<NeoButtonProps> = ({ children, className = '', variant = 'primary', icon, ...props }) => {
  const baseStyles = "border-2 border-black px-4 py-2 font-bold flex items-center justify-center gap-2 rounded-md shadow-neo active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all";
  
  const variants = {
    primary: "bg-white text-black hover:bg-gray-50",
    secondary: "bg-neoBlue text-black hover:brightness-110",
    accent: "bg-neoGreen text-black hover:brightness-110",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

export default NeoButton;