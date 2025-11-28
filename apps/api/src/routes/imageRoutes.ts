import express from 'express';
import { upload } from '../middleware/upload';
import {
  uploadImage,
  deleteImage,
  setPrimaryImage,
  reorderImages,
} from '../controllers/imageController';
// import { authMiddleware } from '../middleware/auth'; // Auth disabled for now

const router = express.Router();

// Upload images
router.post(
  '/:id/images',
  // authMiddleware,
  upload.array('images', 5),
  uploadImage
);

// Delete image
router.delete(
  '/:id/images/:imageId',
  // authMiddleware,
  deleteImage
);

// Set primary image
router.put(
  '/:id/images/:imageId/primary',
  // authMiddleware,
  setPrimaryImage
);

// Reorder images
router.put(
  '/:id/images/reorder',
  // authMiddleware,
  reorderImages
);

export default router;
