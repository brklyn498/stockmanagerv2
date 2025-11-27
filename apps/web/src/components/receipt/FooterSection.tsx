import React from 'react';

interface FooterSectionProps {
    paymentMethod: string;
}

export const FooterSection: React.FC<FooterSectionProps> = ({ paymentMethod }) => {
    return (
        <div className="relative border-[3px] border-black bg-[#e5e7eb] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            {/* Dog ear simulation bottom right */}
            <div className="absolute -bottom-[3px] -right-[3px] w-8 h-8 bg-black" style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}></div>

            <h3 className="font-bold uppercase mb-2 text-sm tracking-wider">Notes</h3>
            <p className="font-medium text-sm mb-4">
                Payment Method: {paymentMethod}
            </p>
            <div className="text-xs font-medium opacity-80 leading-relaxed border-t-2 border-black/10 pt-4">
                <p>Thank you for your business! If you have any questions about your order, please contact us at support@stockmanager.com.</p>
                <p className="mt-1">Terms & Conditions apply. All sales are final.</p>
            </div>
        </div>
    );
};
