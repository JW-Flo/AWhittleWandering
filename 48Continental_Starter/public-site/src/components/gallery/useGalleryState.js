import { useState, useCallback } from 'react';

export const useGalleryState = (initialPhotos = []) => {
  const [photos, setPhotos] = useState(initialPhotos);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Add a new photo to the gallery
  const addPhoto = useCallback((photo) => {
    if (!photo.id || !photo.url) {
      throw new Error('Photo must have an id and url');
    }

    setPhotos(currentPhotos => {
      // Check for duplicate IDs
      if (currentPhotos.some(p => p.id === photo.id)) {
        throw new Error(`Photo with id ${photo.id} already exists`);
      }

      return [...currentPhotos, {
        ...photo,
        timestamp: photo.timestamp || new Date().toISOString(),
      }];
    });
  }, []);

  // Get photos for a specific state
  const getStatePhotos = useCallback((state) => {
    if (!state) return [];
    return photos.filter(photo => photo.state === state);
  }, [photos]);

  // Get photos for a specific location
  const getLocationPhotos = useCallback((location) => {
    if (!location) return [];
    return photos.filter(photo => photo.location === location);
  }, [photos]);

  // Sort photos by timestamp
  const getSortedPhotos = useCallback((order = 'desc') => {
    return [...photos].sort((a, b) => {
      const comparison = new Date(b.timestamp) - new Date(a.timestamp);
      return order === 'desc' ? comparison : -comparison;
    });
  }, [photos]);

  // Delete a photo
  const deletePhoto = useCallback((photoId) => {
    setPhotos(currentPhotos => 
      currentPhotos.filter(photo => photo.id !== photoId)
    );
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(null);
    }
  }, [selectedPhoto]);

  // Update photo metadata
  const updatePhoto = useCallback((photoId, updates) => {
    setPhotos(currentPhotos =>
      currentPhotos.map(photo =>
        photo.id === photoId
          ? { ...photo, ...updates }
          : photo
      )
    );
  }, []);

  return {
    photos,
    selectedPhoto,
    setSelectedPhoto,
    addPhoto,
    getStatePhotos,
    getLocationPhotos,
    getSortedPhotos,
    deletePhoto,
    updatePhoto,
  };
};
