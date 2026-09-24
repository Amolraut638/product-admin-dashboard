'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface ProductImageGalleryProps {
  images: string[];
  thumbnail: string;
  title: string;
}

// ---------------------------------------------------------------------------
// Thumbnail button — small clickable preview image
// ---------------------------------------------------------------------------
interface ThumbnailProps {
  src: string;
  alt: string;
  isSelected: boolean;
  onClick: () => void;
}

function Thumbnail({ src, alt, isSelected, onClick }: ThumbnailProps) {
  const [failed, setFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all
        ${isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-100'
          : 'border-gray-200 hover:border-gray-300'
        }`}
      aria-pressed={isSelected}
      aria-label={alt}
    >
      {failed ? (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <ImageOff size={14} className="text-gray-300" />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// ProductImageGallery
//
// - Main image: large, shows the currently selected image.
// - Thumbnail strip: visible only when there are multiple images.
// - Clicking a thumbnail updates the main image and resets the error flag.
// - selectedIdx and mainFailed are both local state updated only in event
//   handlers — lint-safe (no setState in effects).
// ---------------------------------------------------------------------------
export default function ProductImageGallery({
  images,
  thumbnail,
  title,
}: ProductImageGalleryProps) {
  // Prefer images[] if non-empty; fall back to thumbnail as the sole image.
  const allImages = images.length > 0 ? images : [thumbnail];

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [mainFailed, setMainFailed] = useState(false);

  const selectedSrc = allImages[Math.min(selectedIdx, allImages.length - 1)];

  function selectImage(idx: number) {
    setSelectedIdx(idx);
    setMainFailed(false); // allow the new image a fresh attempt
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-200">
        {mainFailed || !selectedSrc ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2 text-gray-300">
              <ImageOff size={40} />
              <span className="text-xs">Image unavailable</span>
            </div>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={selectedSrc} /* force re-mount so onError fires for new src */
            src={selectedSrc}
            alt={title}
            className="w-full h-full object-contain p-4"
            onError={() => setMainFailed(true)}
          />
        )}
      </div>

      {/* Thumbnail strip — only when more than one image */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Product images">
          {allImages.map((src, idx) => (
            <Thumbnail
              key={idx}
              src={src}
              alt={`${title} — image ${idx + 1}`}
              isSelected={idx === selectedIdx}
              onClick={() => selectImage(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
