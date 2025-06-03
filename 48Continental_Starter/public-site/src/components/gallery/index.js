export { default as GalleryComponent } from './Gallery';
export { PhotoShape } from './types';

// Example usage in the website:
/*
import { GalleryComponent } from './components/gallery';

function TripPage() {
  const galleryRef = useRef();

  useEffect(() => {
    // Add trip photos
    GalleryComponent.addPhoto(galleryRef)({
      id: 'trip-1',
      url: '/photos/california.jpg',
      state: 'California',
      location: 'Golden Gate Bridge',
      caption: 'Starting our journey in San Francisco'
    });

    // Get all photos from a specific state
    const californiaPhotos = GalleryComponent.getStatePhotos(galleryRef)('California');
  }, []);

  return (
    <div className="trip-page">
      <h1>Our 48 State Journey</h1>
      <GalleryComponent ref={galleryRef} />
    </div>
  );
}
*/
