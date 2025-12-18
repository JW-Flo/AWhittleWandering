import { useState, useEffect, useMemo } from 'react';
import { JourneyWaypoint } from '@/data/journeyRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Image, Video, MapPin, Calendar, User, Heart, ChevronLeft, ChevronRight, Grid, List, Play, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  journeyId?: string;
}

export default function LocationMediaGallery({ currentWaypoint, currentIndex = 0, className = '', journeyId }: LocationMediaGalleryProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAll, setShowAll] = useState(false);
  const [filterPeople, setFilterPeople] = useState<string | null>(null);

  // Fetch media from database
  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('journey_media')
          .select('*')
          .order('taken_at', { ascending: false });
        
        if (journeyId) {
          query = query.eq('journey_id', journeyId);
        }

        const { data, error } = await query.limit(50);
        
        if (error) {
          console.error('Error fetching media:', error);
          return;
        }

        if (data) {
          const mappedMedia: MediaItem[] = data.map(item => ({
            id: item.id,
            type: item.type as 'photo' | 'video',
            url: item.file_url,
            thumbnail: item.thumbnail_url || item.file_url,
            caption: item.caption || '',
            date: item.taken_at ? new Date(item.taken_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
            state: item.state_code || '',
            location: {
              lat: Number(item.latitude) || 0,
              lng: Number(item.longitude) || 0,
              name: item.location_name || 'Unknown'
            },
            people: item.people_tagged || [],
            tags: item.tags || [],
            isFavorite: item.is_favorite || false
          }));
          setMedia(mappedMedia);
        }
      } catch (err) {
        console.error('Failed to fetch media:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [journeyId]);

  // Filter media based on current waypoint location
  const filteredMedia = useMemo(() => {
    let filtered = media;

    // If showing nearby media, filter by state
    if (!showAll && currentWaypoint) {
      filtered = filtered.filter(m => m.state === currentWaypoint.state);
    }

    // Filter by people if selected
    if (filterPeople) {
      filtered = filtered.filter(m => m.people?.includes(filterPeople));
    }

    return filtered;
  }, [media, currentWaypoint, showAll, filterPeople]);

  // Get unique people for filtering
  const uniquePeople = useMemo(() => {
    const people = new Set<string>();
    media.forEach(m => m.people?.forEach(p => people.add(p)));
    return Array.from(people);
  }, [media]);

  const openMedia = (mediaItem: MediaItem) => setSelectedMedia(mediaItem);
  const closeMedia = () => setSelectedMedia(null);

  const navigateMedia = (direction: 'prev' | 'next') => {
    if (!selectedMedia) return;
    const idx = filteredMedia.findIndex(m => m.id === selectedMedia.id);
    const newIdx = direction === 'next' 
      ? (idx + 1) % filteredMedia.length 
      : (idx - 1 + filteredMedia.length) % filteredMedia.length;
    setSelectedMedia(filteredMedia[newIdx]);
  };

  if (loading) {
    return (
      <Card className={`card-tesla ${className}`}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading media...</span>
        </CardContent>
      </Card>
    );
  }

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
              {media.length === 0 ? 'No media uploaded yet' : `No media for ${currentWaypoint?.state || 'this location'}`}
            </p>
            {media.length > 0 && (
              <Button size="sm" variant="link" onClick={() => setShowAll(true)}>
                Show all media
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[320px]">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {filteredMedia.map(mediaItem => (
                  <div
                    key={mediaItem.id}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => openMedia(mediaItem)}
                  >
                    <img
                      src={mediaItem.thumbnail || mediaItem.url}
                      alt={mediaItem.caption}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Media type indicator */}
                    {mediaItem.type === 'video' && (
                      <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                        <Play className="w-3 h-3 text-white" />
                      </div>
                    )}
                    
                    {/* Favorite indicator */}
                    {mediaItem.isFavorite && (
                      <div className="absolute top-2 left-2">
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                      </div>
                    )}
                    
                    {/* Hover info */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-medium line-clamp-1">{mediaItem.caption}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="secondary" className="text-[10px] h-4 bg-white/20 text-white">
                          {mediaItem.state}
                        </Badge>
                        <span className="text-white/70 text-[10px]">{mediaItem.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMedia.map(mediaItem => (
                  <div
                    key={mediaItem.id}
                    className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => openMedia(mediaItem)}
                  >
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={mediaItem.thumbnail || mediaItem.url}
                        alt={mediaItem.caption}
                        className="w-full h-full object-cover"
                      />
                      {mediaItem.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm line-clamp-2">{mediaItem.caption}</p>
                        {mediaItem.isFavorite && <Heart className="w-4 h-4 text-red-500 fill-red-500 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {mediaItem.location.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {mediaItem.date}
                        </span>
                      </div>
                      {mediaItem.people && mediaItem.people.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {mediaItem.people.join(', ')}
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
