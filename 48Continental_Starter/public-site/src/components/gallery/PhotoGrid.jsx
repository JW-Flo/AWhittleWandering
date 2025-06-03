import React from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

const PhotoGrid = ({ photos, onPhotoClick }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="relative group cursor-pointer overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm"
          onClick={() => onPhotoClick(photo)}
        >
          <LazyLoadImage
            src={photo.url}
            alt={photo.caption || 'Trip photo'}
            effect="blur"
            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 text-white transform translate-y-full transition-transform duration-300 group-hover:translate-y-0">
            {photo.location && (
              <div className="flex items-center space-x-2 mb-1">
                <i className="fas fa-map-marker-alt"></i>
                <span className="text-sm">{photo.location}</span>
              </div>
            )}
            {photo.state && (
              <div className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full inline-block">
                {photo.state}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PhotoGrid;
