import React, { useState, useEffect } from 'react';
import PhotoGrid from './PhotoGrid';
import Lightbox from './Lightbox';
import { useGalleryState } from './useGalleryState';

const Gallery = ({ initialPhotos = [] }) => {
  const {
    photos,
    selectedPhoto,
    addPhoto,
    getStatePhotos,
    setSelectedPhoto,
  } = useGalleryState(initialPhotos);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
    setIsLightboxOpen(true);
  };

  // Expose API methods
  React.useImperativeHandle(ref, () => ({
    addPhoto,
    getStatePhotos,
  }));

  return (
    <div className="gallery-container">
      <PhotoGrid 
        photos={photos} 
        onPhotoClick={handlePhotoClick}
      />
      
      {isLightboxOpen && selectedPhoto && (
        <Lightbox
          photos={photos}
          currentPhoto={selectedPhoto}
          onClose={() => setIsLightboxOpen(false)}
          onNavigate={setSelectedPhoto}
        />
      )}
    </div>
  );
};

// Export the component and its API
export const GalleryComponent = React.forwardRef(Gallery);

// Export API methods directly
GalleryComponent.addPhoto = (ref) => ref.current?.addPhoto;
GalleryComponent.getStatePhotos = (ref) => ref.current?.getStatePhotos;

export default GalleryComponent;
