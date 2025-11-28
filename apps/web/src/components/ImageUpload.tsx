import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Star, Upload, ImageIcon } from 'lucide-react';
import Button from './Button';

interface ImageUploadProps {
  onDrop: (files: File[]) => void;
  files: File[];
  onRemove: (index: number) => void;
  uploadedImages?: {
    id: string;
    url: string;
    isPrimary: boolean;
  }[];
  onRemoveUploaded?: (id: string) => void;
  onSetPrimary?: (id: string) => void;
  isLoading?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onDrop,
  files,
  onRemove,
  uploadedImages = [],
  onRemoveUploaded,
  onSetPrimary,
  isLoading = false,
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: isLoading,
  });

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-4 border-dashed border-black p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'bg-yellow-100' : 'bg-white hover:bg-gray-50'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload size={32} strokeWidth={2.5} />
          {isDragActive ? (
            <p className="font-bold">Drop the files here...</p>
          ) : (
            <div>
              <p className="font-bold text-lg">Drag & drop images here</p>
              <p className="text-sm text-gray-500">or click to select files</p>
              <p className="text-xs text-gray-400 mt-2">JPG, PNG, WebP (max 5MB)</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Grid */}
      {(files.length > 0 || uploadedImages.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Previously Uploaded Images */}
          {uploadedImages.map((image) => (
            <div
              key={image.id}
              className="relative aspect-square border-4 border-black bg-white group"
            >
              <img
                src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}${image.url}`}
                alt="Product"
                className="w-full h-full object-cover"
              />

              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => onRemoveUploaded && onRemoveUploaded(image.id)}
                  className="p-1 bg-red-400 border-2 border-black hover:bg-red-500 transition-colors"
                  title="Remove"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </div>

              <div className="absolute bottom-2 left-2 right-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => onSetPrimary && onSetPrimary(image.id)}
                  className={`p-1 border-2 border-black transition-colors ${
                    image.isPrimary
                      ? 'bg-yellow-400 text-black'
                      : 'bg-white text-gray-400 hover:text-yellow-500'
                  }`}
                  title={image.isPrimary ? 'Primary Image' : 'Set as Primary'}
                >
                  <Star size={16} strokeWidth={3} fill={image.isPrimary ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          ))}

          {/* New Files Preview */}
          {files.map((file, index) => (
            <div
              key={index}
              className="relative aspect-square border-4 border-black bg-white"
            >
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="w-full h-full object-cover opacity-70"
                onLoad={() => {
                  URL.revokeObjectURL(file.name); // Clean up memory
                }}
              />
              <div className="absolute top-2 right-2">
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="p-1 bg-red-400 border-2 border-black hover:bg-red-500 transition-colors"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-yellow-400 border-t-2 border-black p-1 text-center text-xs font-bold truncate">
                New Upload
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
