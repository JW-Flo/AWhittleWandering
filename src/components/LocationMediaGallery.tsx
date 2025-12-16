import { useState, useEffect, useMemo } from 'react';
import { JourneyWaypoint } from '@/data/journeyRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image, Video, MapPin, Calendar, User, Heart, X, ChevronLeft, ChevronRight, Grid, List, Filter, Play } from 'lucide-react';

interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  thumbnail?: string;
  caption?: string;
  date: string;
  state: string;
  location: { lat: number; lng: number; name: string };
  people?: string[];
  tags?: string[];
  isFavorite?: boolean;
}

interface LocationMediaGalleryProps {
  currentWaypoint?: JourneyWaypoint | null;
  currentIndex?: number;
  className?: string;
}

// Sample media data synced to journey locations
const sampleMedia: MediaItem[] = [
  {
    id: '1',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800',
    caption: 'Starting the journey from Corpus Christi',
    date: 'Jun 3',
    state: 'TX',
    location: { lat: 27.741570, lng: -97.388860, name: 'Corpus Christi' },
    people: ['Alec'],
    tags: ['start', 'beach', 'tesla'],
    isFavorite: true,
  },
  {
    id: '2',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
    caption: 'Texas Hill Country views',
    date: 'Jun 6',
    state: 'TX',
    location: { lat: 30.256390, lng: -97.796510, name: 'Austin' },
    people: [],
    tags: ['scenic', 'hills'],
  },
  {
    id: '3',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?w=800',
    caption: 'Welcome to New Mexico!',
    date: 'Jun 7',
    state: 'NM',
    location: { lat: 32.346810, lng: -106.764740, name: 'Las Cruces' },
    tags: ['state-crossing', 'desert'],
  },
  {
    id: '4',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    caption: 'Arizona desert sunset',
    date: 'Jun 8',
    state: 'AZ',
    location: { lat: 32.221740, lng: -110.926480, name: 'Tucson' },
    tags: ['sunset', 'desert'],
    isFavorite: true,
  },
  {
    id: '5',
    type: 'video',
    url: 'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=400',
    caption: 'Driving through Phoenix',
    date: 'Jun 9',
    state: 'AZ',
    location: { lat: 33.448376, lng: -112.074036, name: 'Phoenix' },
    tags: ['driving', 'city'],
  },
  {
    id: '6',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
    caption: 'Pacific Coast Highway views',
    date: 'Jun 15',
    state: 'CA',
    location: { lat: 34.014736, lng: -118.493730, name: 'Santa Monica' },
    people: ['Alec', 'Friend'],
    tags: ['ocean', 'scenic'],
    isFavorite: true,
  },
  {
    id: '7',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=800',
    caption: 'Golden Gate Bridge at sunset',
    date: 'Jun 18',
    state: 'CA',
    location: { lat: 37.774929, lng: -122.419418, name: 'San Francisco' },
    tags: ['landmark', 'bridge'],
    isFavorite: true,
  },
  {
    id: '8',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
    caption: 'Oregon coast beauty',
    date: 'Jun 21',
    state: 'OR',
    location: { lat: 45.512230, lng: -122.658722, name: 'Portland' },
    tags: ['coast', 'scenic'],
  },
  {
    id: '9',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1416339442236-8ceb164046f8?w=800',
    caption: 'Seattle skyline',
    date: 'Jun 22',
    state: 'WA',
    location: { lat: 47.606209, lng: -122.332069, name: 'Seattle' },
    people: ['Alec', 'Local Friend'],
    tags: ['city', 'skyline'],
  },
  {
    id: '10',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=800',
    caption: 'Yellowstone hot springs',
    date: 'Jun 29',
    state: 'WY',
    location: { lat: 44.427963, lng: -110.588455, name: 'Yellowstone' },
    tags: ['national-park', 'nature'],
    isFavorite: true,
  },
];

export default function LocationMediaGallery({ currentWaypoint, currentIndex = 0, className = '' }: LocationMediaGalleryProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAll, setShowAll] = useState(false);
  const [filterPeople, setFilterPeople] = useState<string | null>(null);

  // Filter media based on current waypoint location
  const filteredMedia = useMemo(() => {
    let media = sampleMedia;

    // If showing nearby media, filter by state
    if (!showAll && currentWaypoint) {
      media = media.filter(m => m.state === currentWaypoint.state);
    }

    // Filter by people if selected
    if (filterPeople) {
      media = media.filter(m => m.people?.includes(filterPeople));
    }

    return media;
  }, [currentWaypoint, showAll, filterPeople]);

  // Get unique people for filtering
  const uniquePeople = useMemo(() => {
    const people = new Set<string>();
    sampleMedia.forEach(m => m.people?.forEach(p => people.add(p)));
    return Array.from(people);
  }, []);

  const openMedia = (media: MediaItem) => setSelectedMedia(media);
  const closeMedia = () => setSelectedMedia(null);

  const navigateMedia = (direction: 'prev' | 'next') => {
    if (!selectedMedia) return;
    const idx = filteredMedia.findIndex(m => m.id === selectedMedia.id);
    const newIdx = direction === 'next' 
      ? (idx + 1) % filteredMedia.length 
      : (idx - 1 + filteredMedia.length) % filteredMedia.length;
    setSelectedMedia(filteredMedia[newIdx]);
  };

  return (
    <Card className={`card-tesla ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            <span>Media Gallery</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Location Filter */}
            <Button
              size="sm"
              variant={showAll ? "outline" : "secondary"}
              className="h-7 text-xs"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'All Locations' : currentWaypoint?.state || 'Nearby'}
            </Button>

            {/* People Filter */}
            {uniquePeople.length > 0 && (
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={!filterPeople ? "secondary" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => setFilterPeople(null)}
                >
                  <User className="w-3 h-3 mr-1" />
                  All
                </Button>
                {uniquePeople.slice(0, 2).map(person => (
                  <Button
                    key={person}
                    size="sm"
                    variant={filterPeople === person ? "secondary" : "outline"}
                    className="h-7 text-xs"
                    onClick={() => setFilterPeople(filterPeople === person ? null : person)}
                  >
                    {person}
                  </Button>
                ))}
              </div>
            )}

            {/* View Toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? "secondary" : "ghost"}
                className="h-7 w-7 p-0"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? "secondary" : "ghost"}
                className="h-7 w-7 p-0"
                onClick={() => setViewMode('list')}
              >
                <List className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Image className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No media for {currentWaypoint?.state || 'this location'}
            </p>
            <Button size="sm" variant="link" onClick={() => setShowAll(true)}>
              Show all media
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[320px]">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {filteredMedia.map(media => (
                  <div
                    key={media.id}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => openMedia(media)}
                  >
                    <img
                      src={media.thumbnail || media.url}
                      alt={media.caption}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Media type indicator */}
                    {media.type === 'video' && (
                      <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                        <Play className="w-3 h-3 text-white" />
                      </div>
                    )}
                    
                    {/* Favorite indicator */}
                    {media.isFavorite && (
                      <div className="absolute top-2 left-2">
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                      </div>
                    )}
                    
                    {/* Hover info */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-medium line-clamp-1">{media.caption}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="secondary" className="text-[10px] h-4 bg-white/20 text-white">
                          {media.state}
                        </Badge>
                        <span className="text-white/70 text-[10px]">{media.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMedia.map(media => (
                  <div
                    key={media.id}
                    className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => openMedia(media)}
                  >
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={media.thumbnail || media.url}
                        alt={media.caption}
                        className="w-full h-full object-cover"
                      />
                      {media.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm line-clamp-2">{media.caption}</p>
                        {media.isFavorite && <Heart className="w-4 h-4 text-red-500 fill-red-500 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {media.location.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {media.date}
                        </span>
                      </div>
                      {media.people && media.people.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {media.people.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
          <span>{filteredMedia.length} items</span>
          <span>{filteredMedia.filter(m => m.isFavorite).length} favorites</span>
          <span>{filteredMedia.filter(m => m.type === 'video').length} videos</span>
        </div>
      </CardContent>

      {/* Fullscreen Media Viewer */}
      <Dialog open={!!selectedMedia} onOpenChange={() => closeMedia()}>
        <DialogContent className="max-w-4xl p-0 bg-black border-none">
          <div className="relative">
            {selectedMedia && (
              <>
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.caption}
                  className="w-full max-h-[80vh] object-contain"
                />
                
                {/* Navigation */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => navigateMedia('prev')}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => navigateMedia('next')}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>

                {/* Info bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                  <p className="text-white font-medium">{selectedMedia.caption}</p>
                  <div className="flex items-center gap-3 mt-2 text-white/70 text-sm">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedMedia.location.name}, {selectedMedia.state}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {selectedMedia.date}
                    </span>
                    {selectedMedia.people && selectedMedia.people.length > 0 && (
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {selectedMedia.people.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
