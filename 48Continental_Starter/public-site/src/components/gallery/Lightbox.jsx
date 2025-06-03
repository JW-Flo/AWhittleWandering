import React, { useEffect, useCallback } from 'react';

const Lightbox = ({ photos, currentPhoto, onClose, onNavigate }) => {
  const currentIndex = photos.findIndex(p => p.id === currentPhoto.id);

  const handleKeyPress = useCallback((e) => {
    switch(e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        if (currentIndex > 0) {
          onNavigate(photos[currentIndex - 1]);
        }
        break;
      case 'ArrowRight':
        if (currentIndex < photos.length - 1) {
          onNavigate(photos[currentIndex + 1]);
        }
        break;
      default:
        break;
    }
  }, [currentIndex, photos, onClose, onNavigate]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const handleSwipe = useCallback((direction) => {
    if (direction === 'left' && currentIndex < photos.length - 1) {
      onNavigate(photos[currentIndex + 1]);
    } else if (direction === 'right' && currentIndex > 0) {
      onNavigate(photos[currentIndex - 1]);
    }
  }, [currentIndex, photos, onNavigate]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <button
        className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
        onClick={onClose}
      >
        <i className="fas fa-times"></i>
      </button>

      <button
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-2xl hover:text-gray-300"
        onClick={() => handleSwipe('right')}
        disabled={currentIndex === 0}
      >
        <i className="fas fa-chevron-left"></i>
      </button>

      <div className="relative max-w-4xl max-h-[90vh] mx-auto">
        <img
          src={currentPhoto.url}
          alt={currentPhoto.caption || 'Trip photo'}
          className="max-w-full max-h-[80vh] object-contain"
        />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 text-white">
          {currentPhoto.location && (
            <div className="flex items-center space-x-2 mb-2">
              <i className="fas fa-map-marker-alt"></i>
              <span>{currentPhoto.location}</span>
            </div>
          )}
          {currentPhoto.state && (
            <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm">
              {currentPhoto.state}
            </div>
          )}
          {currentPhoto.caption && (
            <p className="mt-2 text-sm">{currentPhoto.caption}</p>
          )}
        </div>
      </div>

      <button
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-2xl hover:text-gray-300"
        onClick={() => handleSwipe('left')}
        disabled={currentIndex === photos.length - 1}
      >
        <i className="fas fa-chevron-right"></i>
      </button>
    </div>
  );
};

export default Lightbox;
