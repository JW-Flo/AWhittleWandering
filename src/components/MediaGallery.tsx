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
  Star
} from 'lucide-react';

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
  media?: MediaItem[];
  onMediaSelect?: (media: MediaItem) => void;
  onMediaDelete?: (mediaId: string) => void;
  onMediaUpdate?: (mediaId: string, updates: Partial<MediaItem>) => void;
}

// Sample media data
const sampleMedia: MediaItem[] = [
  {
    id: '1',
    type: 'photo',
    filename: 'grand_canyon_1.jpg',
    url: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800',
    title: 'Grand Canyon Sunrise',
    description: 'First morning at the Grand Canyon, the colors were incredible',
    location: { state: 'Arizona', city: 'Grand Canyon Village' },
    timestamp: '2025-06-12T06:30:00Z',
    tags: ['sunrise', 'canyon', 'nature'],
    tripDay: 10,
    fileSize: 4500000,
    uploadedAt: '2025-06-12T12:00:00Z',
    isFavorite: true,
    views: 245
  },
  {
    id: '2',
    type: 'photo',
    filename: 'pch_coast.jpg',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    title: 'Pacific Coast Highway',
    description: 'Driving along the stunning California coastline',
    location: { state: 'California', city: 'Big Sur' },
    timestamp: '2025-06-16T14:20:00Z',
    tags: ['coast', 'driving', 'ocean'],
    tripDay: 14,
    fileSize: 3800000,
    uploadedAt: '2025-06-16T18:00:00Z',
    isFavorite: true,
    views: 189
  },
  {
    id: '3',
    type: 'photo',
    filename: 'crater_lake.jpg',
    url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
    title: 'Crater Lake Blue',
    description: 'The deepest blue water I have ever seen',
    location: { state: 'Oregon', city: 'Crater Lake' },
    timestamp: '2025-06-20T11:45:00Z',
    tags: ['lake', 'blue', 'national-park'],
    tripDay: 18,
    fileSize: 5200000,
    uploadedAt: '2025-06-20T16:00:00Z',
    isFavorite: false,
    views: 156
  },
  {
    id: '4',
    type: 'photo',
    filename: 'white_sands.jpg',
    url: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800',
    title: 'White Sands Dunes',
    description: 'Otherworldly landscape at White Sands',
    location: { state: 'New Mexico', city: 'Alamogordo' },
    timestamp: '2025-06-08T16:30:00Z',
    tags: ['desert', 'dunes', 'sunset'],
    tripDay: 6,
    fileSize: 4100000,
    uploadedAt: '2025-06-08T20:00:00Z',
    isFavorite: true,
    views: 312
  },
];

const MediaGallery: React.FC<MediaGalleryProps> = ({
  media = sampleMedia,
  onMediaSelect,
  onMediaDelete,
  onMediaUpdate
}) => {
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>(media);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size' | 'state'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
            <Badge className="text-xs text-adventure-gold bg-adventure-gold/20 border-0">
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
            <Star className={`w-3 h-3 ${mediaItem.isFavorite ? 'fill-current text-adventure-gold' : ''}`} />
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
              <div className="text-2xl font-bold text-adventure-orange">
                {media.filter(m => m.type === 'photo').length}
              </div>
              <div className="text-sm text-muted-foreground">Photos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-tesla-blue">
                {media.filter(m => m.type === 'video').length}
              </div>
              <div className="text-sm text-muted-foreground">Videos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-adventure-green">
                {getUniqueStates().length}
              </div>
              <div className="text-sm text-muted-foreground">States</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-adventure-purple">
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
