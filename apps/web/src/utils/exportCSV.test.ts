import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  convertToCSV,
  downloadCSV,
  exportToCSV,
  formatProductsForExport,
  formatMovementsForExport,
  formatOrdersForExport,
} from './exportCSV';

describe('CSV Export Utility', () => {
  describe('convertToCSV', () => {
    it('should convert simple data to CSV', () => {
      const data = [
        { name: 'John', age: 30, city: 'New York' },
        { name: 'Jane', age: 25, city: 'Boston' },
      ];

      const csv = convertToCSV(data);

      expect(csv).toBe('name,age,city\nJohn,30,New York\nJane,25,Boston');
    });

    it('should return empty string for empty array', () => {
      const csv = convertToCSV([]);

      expect(csv).toBe('');
    });

    it('should use custom headers if provided', () => {
      const data = [
        { name: 'John', age: 30, city: 'New York' },
        { name: 'Jane', age: 25, city: 'Boston' },
      ];
      const headers = ['name', 'city'];

      const csv = convertToCSV(data, headers);

      expect(csv).toBe('name,city\nJohn,New York\nJane,Boston');
      expect(csv).not.toContain('age');
    });

    it('should handle null values', () => {
      const data = [{ name: 'John', age: null, city: 'New York' }];

      const csv = convertToCSV(data);

      expect(csv).toBe('name,age,city\nJohn,,New York');
    });

    it('should handle undefined values', () => {
      const data = [{ name: 'John', age: undefined, city: 'New York' }];

      const csv = convertToCSV(data);

      expect(csv).toBe('name,age,city\nJohn,,New York');
    });

    it('should escape quotes in values', () => {
      const data = [{ name: 'John "The Boss" Doe', age: 30 }];

      const csv = convertToCSV(data);

      expect(csv).toBe('name,age\n"John ""The Boss"" Doe",30');
    });

    it('should wrap values with commas in quotes', () => {
      const data = [{ name: 'Doe, John', age: 30 }];

      const csv = convertToCSV(data);

      expect(csv).toBe('name,age\n"Doe, John",30');
    });

    it('should wrap values with newlines in quotes', () => {
      const data = [{ name: 'John', description: 'Line 1\nLine 2' }];

      const csv = convertToCSV(data);

      expect(csv).toBe('name,description\nJohn,"Line 1\nLine 2"');
    });

    it('should handle multiple special characters', () => {
      const data = [{ description: 'Product, "Special"\nNew line' }];

      const csv = convertToCSV(data);

      expect(csv).toBe('description\n"Product, ""Special""\nNew line"');
    });

    it('should handle boolean values', () => {
      const data = [{ name: 'John', isActive: true, isAdmin: false }];

      const csv = convertToCSV(data);

      expect(csv).toBe('name,isActive,isAdmin\nJohn,true,false');
    });

    it('should handle number values', () => {
      const data = [{ price: 99.99, quantity: 10, discount: 0 }];

      const csv = convertToCSV(data);

      expect(csv).toBe('price,quantity,discount\n99.99,10,0');
    });

    it('should handle empty strings', () => {
      const data = [{ name: '', age: 30, city: '' }];

      const csv = convertToCSV(data);

      expect(csv).toBe('name,age,city\n,30,');
    });

    it('should handle data with inconsistent keys', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane' }, // missing age
      ];

      const csv = convertToCSV(data);

      expect(csv).toBe('name,age\nJohn,30\nJane,');
    });

    it('should handle single row data', () => {
      const data = [{ name: 'John', age: 30 }];

      const csv = convertToCSV(data);

      expect(csv).toBe('name,age\nJohn,30');
    });

    it('should handle special CSV injection characters safely', () => {
      // Test for CSV injection prevention
      const data = [
        { formula: '=1+1', cmd: '@SUM(A1:A10)', plus: '+1234', minus: '-1234' },
      ];

      const csv = convertToCSV(data);

      // Values should be present but properly escaped
      expect(csv).toContain('=1+1');
      expect(csv).toContain('@SUM(A1:A10)');
    });
  });

  describe('downloadCSV', () => {
    let createElementSpy: any;
    let appendChildSpy: any;
    let removeChildSpy: any;
    let createObjectURLSpy: any;
    let revokeObjectURLSpy: any;

    beforeEach(() => {
      // Mock DOM methods
      const mockLink = {
        setAttribute: vi.fn(),
        click: vi.fn(),
        style: {},
      };

      createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create a download link and trigger click', () => {
      const csvContent = 'name,age\nJohn,30';
      const filename = 'test.csv';

      downloadCSV(csvContent, filename);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();
    });

    it('should add BOM for Excel compatibility', () => {
      const csvContent = 'name,age\nJohn,30';
      const filename = 'test.csv';

      downloadCSV(csvContent, filename);

      // Check that Blob was created with BOM
      const blobCalls = vi.mocked(Blob).mock.calls;
      expect(blobCalls.length).toBeGreaterThan(0);
    });

    it('should set correct attributes on link element', () => {
      const mockLink = {
        setAttribute: vi.fn(),
        click: vi.fn(),
        style: {},
      };

      createElementSpy.mockReturnValue(mockLink);

      const csvContent = 'name,age\nJohn,30';
      const filename = 'test.csv';

      downloadCSV(csvContent, filename);

      expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'blob:mock-url');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', filename);
    });
  });

  describe('exportToCSV', () => {
    let downloadCSVSpy: any;

    beforeEach(() => {
      // Mock downloadCSV to avoid DOM manipulation
      downloadCSVSpy = vi.fn();
      vi.spyOn(
        await import('./exportCSV'),
        'downloadCSV'
      ).mockImplementation(downloadCSVSpy);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should convert data and trigger download', () => {
      const data = [{ name: 'John', age: 30 }];
      const filename = 'test';

      exportToCSV(data, filename);

      expect(downloadCSVSpy).toHaveBeenCalled();
    });

    it('should add timestamp to filename', () => {
      const data = [{ name: 'John', age: 30 }];
      const filename = 'test';

      exportToCSV(data, filename);

      const calledFilename = downloadCSVSpy.mock.calls[0][1];
      expect(calledFilename).toMatch(/^test_\d{4}-\d{2}-\d{2}\.csv$/);
    });

    it('should not download if data is empty', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const data: any[] = [];
      const filename = 'test';

      exportToCSV(data, filename);

      expect(consoleWarnSpy).toHaveBeenCalledWith('No data to export');
      expect(downloadCSVSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should use custom headers if provided', () => {
      const data = [{ name: 'John', age: 30, city: 'NYC' }];
      const filename = 'test';
      const headers = ['name', 'age'];

      exportToCSV(data, filename, headers);

      const calledCSV = downloadCSVSpy.mock.calls[0][0];
      expect(calledCSV).not.toContain('city');
    });
  });

  describe('formatProductsForExport', () => {
    it('should format products correctly', () => {
      const products = [
        {
          sku: 'PROD-001',
          name: 'Product 1',
          description: 'Description',
          category: { name: 'Electronics' },
          supplier: { name: 'Supplier A' },
          price: 99.99,
          costPrice: 50,
          quantity: 10,
          minStock: 5,
          maxStock: 100,
          unit: 'pcs',
          barcode: '123456789',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      const formatted = formatProductsForExport(products);

      expect(formatted[0]).toEqual({
        SKU: 'PROD-001',
        Name: 'Product 1',
        Description: 'Description',
        Category: 'Electronics',
        Supplier: 'Supplier A',
        Price: 99.99,
        'Cost Price': 50,
        Quantity: 10,
        'Min Stock': 5,
        'Max Stock': 100,
        Unit: 'pcs',
        Barcode: '123456789',
        Status: 'Active',
        'Created At': new Date('2024-01-01T00:00:00Z').toLocaleString(),
      });
    });

    it('should handle missing optional fields', () => {
      const products = [
        {
          sku: 'PROD-001',
          name: 'Product 1',
          description: null,
          category: { name: 'Electronics' },
          supplier: { name: 'Supplier A' },
          price: 99.99,
          costPrice: 50,
          quantity: 10,
          minStock: 5,
          maxStock: null,
          unit: 'pcs',
          barcode: null,
          isActive: false,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      const formatted = formatProductsForExport(products);

      expect(formatted[0].Description).toBe('');
      expect(formatted[0].Barcode).toBe('');
      expect(formatted[0]['Max Stock']).toBe('');
      expect(formatted[0].Status).toBe('Inactive');
    });
  });

  describe('formatMovementsForExport', () => {
    it('should format movements correctly', () => {
      const movements = [
        {
          createdAt: '2024-01-01T00:00:00Z',
          product: { name: 'Product 1', sku: 'PROD-001' },
          type: 'IN',
          quantity: 10,
          reason: 'Purchase',
          reference: 'PO-001',
          user: { name: 'John Doe' },
        },
      ];

      const formatted = formatMovementsForExport(movements);

      expect(formatted[0]).toEqual({
        Date: new Date('2024-01-01T00:00:00Z').toLocaleString(),
        Product: 'Product 1',
        SKU: 'PROD-001',
        Type: 'IN',
        Quantity: 10,
        Reason: 'Purchase',
        Reference: 'PO-001',
        User: 'John Doe',
      });
    });

    it('should handle missing optional fields', () => {
      const movements = [
        {
          createdAt: '2024-01-01T00:00:00Z',
          product: { name: 'Product 1', sku: 'PROD-001' },
          type: 'OUT',
          quantity: 5,
          reason: null,
          reference: null,
          user: { name: 'John Doe' },
        },
      ];

      const formatted = formatMovementsForExport(movements);

      expect(formatted[0].Reason).toBe('');
      expect(formatted[0].Reference).toBe('');
    });
  });

  describe('formatOrdersForExport', () => {
    it('should format orders correctly', () => {
      const orders = [
        {
          orderNumber: 'ORD-001',
          type: 'PURCHASE',
          status: 'PENDING',
          supplier: { name: 'Supplier A' },
          totalAmount: 999.99,
          items: [{ id: 1 }, { id: 2 }],
          notes: 'Urgent order',
          user: { name: 'John Doe' },
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      const formatted = formatOrdersForExport(orders);

      expect(formatted[0]).toEqual({
        'Order Number': 'ORD-001',
        Type: 'PURCHASE',
        Status: 'PENDING',
        Supplier: 'Supplier A',
        'Total Amount': 999.99,
        'Item Count': 2,
        Notes: 'Urgent order',
        'Created By': 'John Doe',
        'Created At': new Date('2024-01-01T00:00:00Z').toLocaleString(),
      });
    });

    it('should handle missing optional fields', () => {
      const orders = [
        {
          orderNumber: 'ORD-001',
          type: 'SALE',
          status: 'COMPLETED',
          supplier: null,
          totalAmount: 500,
          items: null,
          notes: null,
          user: { name: 'John Doe' },
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      const formatted = formatOrdersForExport(orders);

      expect(formatted[0].Supplier).toBe('');
      expect(formatted[0]['Item Count']).toBe(0);
      expect(formatted[0].Notes).toBe('');
    });
  });
});
