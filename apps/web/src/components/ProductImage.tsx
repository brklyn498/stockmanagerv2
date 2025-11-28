import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Camera, Minus } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ProductImageProps {
  images: {
    id: string;
    url: string;
    isPrimary: boolean;
  }[];
  alt: string;
  productId?: string;
  onImageDeleted?: () => void;
}

const ProductImage: React.FC<ProductImageProps> = ({ images, alt, productId, onImageDeleted }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  // Sort images so primary is first
  const sortedImages = [...images].sort((a, b) =>
    (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)
  );

  const mainImage = sortedImages[0];
  const hasImages = sortedImages.length > 0;
  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

  const handleOpenLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1));
  };

  const handleDeleteImage = async (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!productId) return;

    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    setDeletingImageId(imageId);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/products/${productId}/images/${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      // Wait for animation to complete before calling callback
      setTimeout(() => {
        setDeletingImageId(null);
        onImageDeleted?.();
      }, 300);
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
      setDeletingImageId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        className={`relative aspect-square border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white cursor-pointer overflow-hidden group transition-all duration-300 ${
          deletingImageId === mainImage?.id ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
        }`}
        onClick={() => hasImages && handleOpenLightbox(0)}
      >
        {hasImages ? (
          <>
            <img
              src={`${API_URL}${mainImage.url}`}
              alt={alt}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {productId && (
              <button
                onClick={(e) => handleDeleteImage(mainImage.id, e)}
                className="absolute top-4 right-4 p-3 bg-red-500 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all duration-200 transform hover:scale-110"
                title="Delete image"
              >
                <Minus size={24} strokeWidth={3} className="text-white" />
              </button>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
            <Camera size={64} strokeWidth={1.5} />
            <span className="font-bold mt-2">No Image</span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {hasImages && sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sortedImages.map((img, index) => (
            <div
              key={img.id}
              className={`relative w-20 h-20 flex-shrink-0 group transition-all duration-300 ${
                deletingImageId === img.id ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
              }`}
            >
              <button
                onClick={() => handleOpenLightbox(index)}
                className="w-full h-full border-2 border-black hover:opacity-80 transition-opacity"
              >
                <img
                  src={`${API_URL}${img.url}`}
                  alt={`${alt} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
              {productId && (
                <button
                  onClick={(e) => handleDeleteImage(img.id, e)}
                  className="absolute inset-0 flex items-center justify-center bg-red-500/90 border-2 border-black opacity-0 group-hover:opacity-100 hover:bg-red-600/90 transition-all duration-200"
                  title="Delete image"
                >
                  <Minus size={20} strokeWidth={3} className="text-white" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Portal */}
      {lightboxOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-yellow-400 transition-colors"
          >
            <X size={48} strokeWidth={2} />
          </button>

          <div className="relative max-w-5xl w-full max-h-[85vh] flex items-center justify-center">
            {/* Prev Button */}
            {sortedImages.length > 1 && (
              <button
                onClick={handlePrev}
                className="absolute left-0 md:-left-16 p-2 text-white hover:text-yellow-400 transition-colors"
              >
                <ChevronLeft size={48} strokeWidth={2} />
              </button>
            )}

            <img
              src={`${API_URL}${sortedImages[currentIndex].url}`}
              alt={`${alt} - View ${currentIndex + 1}`}
              className="max-w-full max-h-[85vh] border-4 border-white shadow-[0px_0px_20px_rgba(0,0,0,0.5)]"
            />

            {/* Next Button */}
            {sortedImages.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-0 md:-right-16 p-2 text-white hover:text-yellow-400 transition-colors"
              >
                <ChevronRight size={48} strokeWidth={2} />
              </button>
            )}
          </div>

          <div className="absolute bottom-8 text-white font-bold text-lg">
            {currentIndex + 1} / {sortedImages.length}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProductImage;
