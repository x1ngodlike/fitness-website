import React from 'react';
import { X } from 'lucide-react';
import { IconButton } from '../ui';

interface ImagePreviewModalProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function ImagePreviewModal({ src, alt, onClose }: ImagePreviewModalProps) {
  return (
    <div
      className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--bg-90)] backdrop-blur-sm flex items-center justify-center cursor-pointer animate-fade-in-up"
      onClick={onClose}
    >
      <IconButton label="关闭" className="absolute top-4 right-4" onClick={onClose}>
        <X className="w-6 h-6" />
      </IconButton>
      <img
        src={src}
        alt={alt || '预览图片'}
        className="max-w-[95vw] max-h-[95vh] object-contain cursor-default rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
