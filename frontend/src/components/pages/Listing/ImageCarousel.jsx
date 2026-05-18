import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './ImageCarousel.css';

export default function ImageCarousel({ images = [], title = 'Listing' }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const hasMultipleImages = images.length > 1;

  return (
    <div className="image-carousel">
      <img
        src={images[currentIndex]}
        alt={`${title} - Image ${currentIndex + 1}`}
        className="image-carousel__image"
      />

      {/* Navigation Arrows - Only show if multiple images */}
      {hasMultipleImages && (
        <>
          <button
            className="image-carousel__nav image-carousel__nav--left"
            onClick={handlePrev}
            aria-label="Previous image"
            title="Previous"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            className="image-carousel__nav image-carousel__nav--right"
            onClick={handleNext}
            aria-label="Next image"
            title="Next"
          >
            <ChevronRight size={24} />
          </button>

          {/* Image Counter */}
          <div className="image-carousel__counter">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}

