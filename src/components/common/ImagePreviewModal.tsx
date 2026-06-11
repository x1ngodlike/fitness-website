import React from 'react';
import { X } from 'lucide-react';

interface ImagePreviewModalProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function ImagePreviewModal({ src, alt, onClose }: ImagePreviewModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-[100] cursor-pointer"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>
      <img
        src={src}
        alt={alt || '预览图片'}
        className="max-w-[95vw] max-h-[95vh] object-contain cursor-default"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
