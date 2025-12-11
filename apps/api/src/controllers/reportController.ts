import { Request, Response } from 'express';
import prisma from '../utils/db';

export const getInventoryReport = async (req: Request, res: Response) => {
    try {
        const products = await prisma.product.findMany({
            include: {
                category: true,
                supplier: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        const reportData = products.map(product => ({
            id: product.id,
            sku: product.sku,
            name: product.name,
            category: product.category.name,
            quantity: product.quantity,
            price: product.price,
            value: product.quantity * product.price,
            status: product.quantity <= 0 ? 'Out of Stock' : product.quantity <= product.minStock ? 'Low Stock' : 'In Stock',
        }));

        const summary = {
            totalProducts: products.length,
            totalValue: reportData.reduce((sum, item) => sum + item.value, 0),
            lowStockCount: reportData.filter(item => item.status === 'Low Stock').length,
            outOfStockCount: reportData.filter(item => item.status === 'Out of Stock').length,
        };

        res.json({ summary, items: reportData });
    } catch (error) {
        console.error('Error generating inventory report:', error);
        res.status(500).json({ error: 'Failed to generate inventory report' });
    }
};

export const getLowStockReport = async (req: Request, res: Response) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                quantity: {
                    lte: prisma.product.fields.minStock,
                },
            },
            include: {
                category: true,
                supplier: true,
            },
            orderBy: {
                quantity: 'asc',
            },
        });

        const reportData = products.map(product => ({
            id: product.id,
            sku: product.sku,
            name: product.name,
            category: product.category.name,
            quantity: product.quantity,
            minStock: product.minStock,
            supplier: product.supplier?.name || 'N/A',
            status: product.quantity <= 0 ? 'Out of Stock' : 'Low Stock',
        }));

        res.json({ items: reportData });
    } catch (error) {
        console.error('Error generating low stock report:', error);
        res.status(500).json({ error: 'Failed to generate low stock report' });
    }
};

export const getSalesReport = async (req: Request, res: Response) => {
    try {
        // Default to last 30 days if not specified
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const orders = await prisma.order.findMany({
            where: {
                type: 'SALE',
                status: 'COMPLETED',
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                user: true,
                client: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const reportData = orders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            date: order.createdAt,
            customer: order.client?.name || 'Walk-in Customer',
            itemsCount: order.items.length,
            totalAmount: order.totalAmount,
        }));

        const summary = {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
            averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length : 0,
        };

        res.json({ summary, items: reportData });
    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).json({ error: 'Failed to generate sales report' });
    }
};
