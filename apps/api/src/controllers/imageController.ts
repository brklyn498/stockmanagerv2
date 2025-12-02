import { Request, Response } from 'express';
import prisma from '../utils/db';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads/products');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check limit
    if (product.images.length + files.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 images allowed per product' });
    }

    const uploadedImages = [];

    for (const file of files) {
      const filename = `prod-${id}-${Date.now()}-${Math.round(Math.random() * 1000)}.webp`;
      const filepath = path.join(UPLOAD_DIR, filename);
      const thumbnailFilename = `thumb-${filename}`;
      const thumbnailPath = path.join(UPLOAD_DIR, thumbnailFilename);

      // Process image: resize to max 800x800, convert to webp
      await sharp(file.buffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .toFormat('webp')
        .toFile(filepath);

      // Create thumbnail: 200x200
      await sharp(file.buffer)
        .resize(200, 200, { fit: 'cover' })
        .toFormat('webp')
        .toFile(thumbnailPath);

      // Determine if this should be the primary image
      const isPrimary = product.images.length === 0 && uploadedImages.length === 0;

      const imageUrl = `/uploads/products/${filename}`;

      const newImage = await prisma.productImage.create({
        data: {
          url: imageUrl,
          productId: id,
          isPrimary,
          sortOrder: product.images.length + uploadedImages.length,
        },
      });

      // Update product imageUrl if it's the first image
      if (isPrimary) {
        await prisma.product.update({
          where: { id },
          data: { imageUrl },
        });
      }

      uploadedImages.push(newImage);
    }

    res.status(201).json({ images: uploadedImages });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
};

export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { id, imageId } = req.params;

    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image || image.productId !== id) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete files
    const filename = path.basename(image.url);
    const filepath = path.join(UPLOAD_DIR, filename);
    const thumbnailPath = path.join(UPLOAD_DIR, `thumb-${filename}`);

    try {
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    } catch (err) {
      console.error(`[WARNING] Failed to delete file ${filepath}:`, err);
    }

    try {
      if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
    } catch (err) {
      console.error(`[WARNING] Failed to delete thumbnail ${thumbnailPath}:`, err);
    }

    // Delete record
    await prisma.productImage.delete({
      where: { id: imageId },
    });

    // If deleted image was primary, set a new primary if exists
    if (image.isPrimary) {
      const remainingImages = await prisma.productImage.findMany({
        where: { productId: id },
        orderBy: { sortOrder: 'asc' },
      });

      if (remainingImages.length > 0) {
        const newPrimary = remainingImages[0];
        await prisma.productImage.update({
          where: { id: newPrimary.id },
          data: { isPrimary: true },
        });
        await prisma.product.update({
          where: { id },
          data: { imageUrl: newPrimary.url },
        });
      } else {
        await prisma.product.update({
          where: { id },
          data: { imageUrl: null },
        });
      }
    }

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};

export const setPrimaryImage = async (req: Request, res: Response) => {
  try {
    const { id, imageId } = req.params;

    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image || image.productId !== id) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Unset current primary
    await prisma.productImage.updateMany({
      where: { productId: id, isPrimary: true },
      data: { isPrimary: false },
    });

    // Set new primary
    await prisma.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });

    // Update product main image
    await prisma.product.update({
      where: { id },
      data: { imageUrl: image.url },
    });

    res.json({ message: 'Primary image updated' });
  } catch (error) {
    console.error('Error setting primary image:', error);
    res.status(500).json({ error: 'Failed to set primary image' });
  }
};

export const reorderImages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { imageIds } = req.body; // Array of image IDs in new order

    if (!Array.isArray(imageIds)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    // Update sortOrder for each image
    const updatePromises = imageIds.map((imageId, index) => {
      return prisma.productImage.updateMany({
        where: { id: imageId, productId: id },
        data: { sortOrder: index },
      });
    });

    await Promise.all(updatePromises);

    res.json({ message: 'Images reordered successfully' });
  } catch (error) {
    console.error('Error reordering images:', error);
    res.status(500).json({ error: 'Failed to reorder images' });
  }
};
