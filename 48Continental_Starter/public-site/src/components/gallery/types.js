/**
 * @typedef {Object} Photo
 * @property {string} id - Unique identifier for the photo
 * @property {string} url - URL of the photo
 * @property {string} [caption] - Optional caption for the photo
 * @property {string} [location] - Optional location where the photo was taken
 * @property {string} [state] - Optional US state where the photo was taken
 * @property {string} [timestamp] - ISO timestamp when the photo was taken
 * @property {Object} [metadata] - Optional additional metadata
 */

/**
 * @typedef {Object} GalleryAPI
 * @property {function(Photo): void} addPhoto - Add a new photo to the gallery
 * @property {function(string): Photo[]} getStatePhotos - Get all photos for a specific state
 * @property {function(string): Photo[]} getLocationPhotos - Get all photos for a specific location
 * @property {function(string): void} deletePhoto - Delete a photo by ID
 * @property {function(string, Partial<Photo>): void} updatePhoto - Update photo metadata
 */

/**
 * @typedef {Object} GalleryProps
 * @property {Photo[]} [initialPhotos] - Initial photos to populate the gallery
 * @property {function(Photo): void} [onPhotoSelect] - Callback when a photo is selected
 * @property {function(Photo): void} [onPhotoDelete] - Callback when a photo is deleted
 * @property {function(Photo): void} [onPhotoUpdate] - Callback when a photo is updated
 */

export const PhotoShape = {
  id: '',
  url: '',
  caption: '',
  location: '',
  state: '',
  timestamp: '',
  metadata: {},
};

// Export empty object to satisfy module requirements
export default {};
