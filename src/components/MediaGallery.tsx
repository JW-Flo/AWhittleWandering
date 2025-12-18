import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Grid,
  List,
  Search,
  Image,
  Video,
  MapPin,
  Calendar,
  Eye,
  Download,
  Trash2,
  Share2,
  Star,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  filename: string;
  url: string;
  thumbnailUrl?: string;
  title: string;
  description: string;
  location: {
    state: string;
    city: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  timestamp: string;
  tags: string[];
  tripDay: number;
  fileSize: number;
  uploadedAt: string;
  isFavorite?: boolean;
  views?: number;
}

interface MediaGalleryProps {
  journeyId?: string;
  onMediaSelect?: (media: MediaItem) => void;
  onMediaDelete?: (mediaId: string) => void;
  onMediaUpdate?: (mediaId: string, updates: Partial<MediaItem>) => void;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({
  journeyId,
  onMediaSelect,
  onMediaDelete,
  onMediaUpdate
}) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size' | 'state'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching media:', error);
          return;
        }

        if (data) {
          const mappedMedia: MediaItem[] = data.map((item, index) => ({
            id: item.id,
            type: item.type as 'photo' | 'video',
            filename: item.file_path.split('/').pop() || 'unknown',
            url: item.file_url,
            thumbnailUrl: item.thumbnail_url || item.file_url,
            title: item.caption || `Media ${index + 1}`,
            description: item.caption || '',
            location: {
              state: item.state_code || 'Unknown',
              city: item.location_name || 'Unknown',
              coordinates: item.latitude && item.longitude ? {
                lat: Number(item.latitude),
                lng: Number(item.longitude)
              } : undefined
            },
            timestamp: item.taken_at || item.created_at,
            tags: item.tags || [],
            tripDay: 1, // Would need calculation based on journey start
            fileSize: item.file_size_bytes || 0,
            uploadedAt: item.created_at,
            isFavorite: item.is_favorite || false,
            views: 0
          }));
          setMedia(mappedMedia);
          setFilteredMedia(mappedMedia);
        }
      } catch (err) {
        console.error('Failed to fetch media:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [journeyId]);

  useEffect(() => {
    let filtered = [...media];

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.state.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedState !== 'all') {
      filtered = filtered.filter(item => item.location.state === selectedState);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'name':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'size':
          aValue = a.fileSize;
          bValue = b.fileSize;
          break;
        case 'state':
          aValue = a.location.state;
          bValue = b.location.state;
          break;
        default:
          aValue = a.timestamp;
          bValue = b.timestamp;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredMedia(filtered);
  }, [media, searchTerm, selectedState, selectedType, sortBy, sortOrder]);

  const handleMediaClick = (mediaItem: MediaItem) => {
    onMediaSelect?.(mediaItem);
  };

  const handleToggleFavorite = (mediaId: string) => {
    const mediaItem = media.find(m => m.id === mediaId);
    if (mediaItem && onMediaUpdate) {
      onMediaUpdate(mediaId, { isFavorite: !mediaItem.isFavorite });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getUniqueStates = () => {
    const states = Array.from(new Set(media.map(item => item.location.state)));
    return states.sort();
  };

  const MediaCard: React.FC<{ mediaItem: MediaItem; isCompact?: boolean }> = ({
    mediaItem,
    isCompact = false
  }) => (
    <Card
      className={`card-tesla overflow-hidden cursor-pointer ${
        isCompact ? 'h-auto' : 'h-full'
      }`}
      onClick={() => handleMediaClick(mediaItem)}
    >
      <div className={`${isCompact ? 'aspect-video' : 'aspect-square'} bg-secondary relative overflow-hidden`}>
        {mediaItem.type === 'photo' ? (
          <img
            src={mediaItem.url}
            alt={mediaItem.title}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="relative w-full h-full">
            <video
              src={mediaItem.url}
              className="object-cover w-full h-full"
              poster={mediaItem.thumbnailUrl}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-background/20">
              <Video className="w-8 h-8 text-foreground" />
            </div>
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-2 left-2">
          <Badge className="text-xs text-foreground bg-background/60 border-0">
            {mediaItem.type === 'photo' ? 'Photo' : 'Video'}
          </Badge>
        </div>

        <div className="absolute flex gap-1 top-2 right-2">
          {mediaItem.isFavorite && (
            <Badge className="text-xs text-primary bg-primary/20 border-0">
              <Star className="w-3 h-3 fill-current" />
            </Badge>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="w-6 h-6 p-0 text-foreground bg-background/40 hover:bg-background/60"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFavorite(mediaItem.id);
            }}
          >
            <Star className={`w-3 h-3 ${mediaItem.isFavorite ? 'fill-current text-primary' : ''}`} />
          </Button>
        </div>
      </div>

      {!isCompact && (
        <CardContent className="p-3 space-y-2">
          <h4 className="text-sm font-medium line-clamp-1 text-foreground">{mediaItem.title}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {mediaItem.description}
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{mediaItem.location.city}, {mediaItem.location.state}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>Day {mediaItem.tripDay} • {formatDate(mediaItem.timestamp)}</span>
          </div>

          {mediaItem.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {mediaItem.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs border-border">
                  {tag}
                </Badge>
              ))}
              {mediaItem.tags.length > 3 && (
                <Badge variant="outline" className="text-xs border-border">
                  +{mediaItem.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              {formatFileSize(mediaItem.fileSize)}
            </span>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="w-6 h-6 p-0 text-muted-foreground hover:text-foreground">
                <Eye className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="w-6 h-6 p-0 text-muted-foreground hover:text-foreground">
                <Share2 className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="w-6 h-6 p-0 text-muted-foreground hover:text-foreground">
                <Download className="w-3 h-3" />
              </Button>
              {onMediaDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-6 h-6 p-0 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMediaDelete(mediaItem.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading media...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Trip Media Gallery</h2>
          <p className="text-muted-foreground">
            {filteredMedia.length} of {media.length} items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="card-tesla">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search media..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>

            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {getUniqueStates().map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="photo">Photos</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: 'date' | 'name' | 'size' | 'state') => setSortBy(value)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">Size</SelectItem>
                <SelectItem value="state">State</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="whitespace-nowrap"
            >
              {sortOrder === 'asc' ? '↑' : '↓'} {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid/List */}
      {filteredMedia.length === 0 ? (
        <Card className="card-tesla">
          <CardContent className="p-8 text-center">
            <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium text-foreground">No media found</h3>
            <p className="text-muted-foreground">
              {media.length === 0
                ? "Upload some photos and videos to get started!"
                : "Try adjusting your search or filter criteria."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-4'
        }>
          {filteredMedia.map((mediaItem) => (
            <MediaCard
              key={mediaItem.id}
              mediaItem={mediaItem}
              isCompact={viewMode === 'list'}
            />
          ))}
        </div>
      )}

      {/* Stats Footer */}
      <Card className="card-tesla">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
            <div>
              <div className="text-2xl font-bold text-primary">
                {media.filter(m => m.type === 'photo').length}
              </div>
              <div className="text-sm text-muted-foreground">Photos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">
                {media.filter(m => m.type === 'video').length}
              </div>
              <div className="text-sm text-muted-foreground">Videos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">
                {getUniqueStates().length}
              </div>
              <div className="text-sm text-muted-foreground">States</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">
                {Math.round(media.reduce((sum, item) => sum + item.fileSize, 0) / 1024 / 1024)}
              </div>
              <div className="text-sm text-muted-foreground">MB Total</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaGallery;
