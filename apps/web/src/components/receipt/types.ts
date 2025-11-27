export interface LineItem {
    id: string;
    sku: string;
    name: string;
    qty: number;
    unitPrice: number;
    total: number;
}

export interface ReceiptData {
    orderId: string;
    date: string;
    time: string;
    from: {
        name: string;
        address1: string;
        address2: string;
        email: string;
    };
    to: {
        name: string;
        address1: string;
        address2: string;
        email: string;
    };
    items: LineItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    shipping: number;
    grandTotal: number;
    paymentMethod: string;
}
