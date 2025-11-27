import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Stock Manager v2 API',
      version: '1.0.0',
      description: 'A comprehensive stock management system API with authentication, inventory tracking, orders, and analytics',
      contact: {
        name: 'Stock Manager Team',
        url: 'https://github.com/brklyn498/stockmanagerv2',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'cuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'STAFF'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'cuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Supplier: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'cuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email', nullable: true },
            phone: { type: 'string', nullable: true },
            address: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Client: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'cuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email', nullable: true },
            phone: { type: 'string', nullable: true },
            address: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'cuid' },
            sku: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            barcode: { type: 'string', nullable: true },
            price: { type: 'number', format: 'float' },
            costPrice: { type: 'number', format: 'float' },
            quantity: { type: 'integer' },
            minStock: { type: 'integer' },
            maxStock: { type: 'integer', nullable: true },
            unit: { type: 'string' },
            isActive: { type: 'boolean' },
            categoryId: { type: 'string' },
            supplierId: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        StockMovement: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'cuid' },
            type: { type: 'string', enum: ['IN', 'OUT', 'ADJUSTMENT', 'RETURN', 'DAMAGED'] },
            quantity: { type: 'integer' },
            reason: { type: 'string', nullable: true },
            reference: { type: 'string', nullable: true },
            productId: { type: 'string' },
            userId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'cuid' },
            orderNumber: { type: 'string' },
            type: { type: 'string', enum: ['PURCHASE', 'SALE'] },
            status: { type: 'string', enum: ['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'CANCELLED'] },
            totalAmount: { type: 'number', format: 'float' },
            notes: { type: 'string', nullable: true },
            supplierId: { type: 'string', nullable: true },
            userId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'cuid' },
            quantity: { type: 'integer' },
            unitPrice: { type: 'number', format: 'float' },
            orderId: { type: 'string' },
            productId: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: { type: 'object' },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Stock Manager API Docs',
  }));

  // Swagger JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 Swagger documentation available at http://localhost:3001/api-docs');
}
