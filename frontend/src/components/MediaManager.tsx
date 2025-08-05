// Media Manager - Comprehensive media upload and gallery management
// Combines MediaUpload and MediaGallery for complete admin media functionality

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Image, 
  Settings, 
  Archive, 
  Download, 
  Trash2,
  Plus,
  FolderOpen,
  Camera
} from 'lucide-react';
import { useAdminAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api-config';
import MediaUpload from './MediaUpload';
import MediaGallery from './MediaGallery';
import AdminLogin from './AdminLogin';

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

interface MediaManagerProps {
  tripStates?: string[];
  currentLocation?: {
    state: string;
    city: string;
    coordinates: { lat: number; lng: number };
  };
}

const MediaManager: React.FC<MediaManagerProps> = ({ 
  tripStates = [], 
  currentLocation 
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery' | 'settings'>('gallery');
  
  const { isAuthenticated, canUploadMedia, canModifyJourney } = useAdminAuth();

  // Load existing media on component mount
  useEffect(() => {
    loadMediaItems();
  }, []);

  const loadMediaItems = async () => {
    try {
      setIsLoading(true);
      
      // Try to fetch from API first
      try {
        const response = await apiRequest<{success: boolean, media: MediaItem[]}>('/api/v1/media/list');
        if (response.success && response.media) {
          setMediaItems(response.media);
          return;
        }
      } catch (apiError) {
        console.warn('API fetch failed, falling back to localStorage:', apiError);
      }
      
      // Fallback to localStorage
      const savedMedia = localStorage.getItem('tripMedia');
      if (savedMedia) {
        setMediaItems(JSON.parse(savedMedia));
      } else {
        // Sample media data for demonstration
        setMediaItems([
          {
            id: 'sample-1',
            type: 'photo',
            filename: 'tesla-grand-canyon.jpg',
            url: 'https://via.placeholder.com/800x600?text=Tesla+at+Grand+Canyon',
            title: 'Tesla at Grand Canyon',
            description: 'Our Tesla parked at the South Rim of Grand Canyon during sunset. Amazing views!',
            location: {
              state: 'Arizona',
              city: 'Grand Canyon Village',
              coordinates: { lat: 36.1069, lng: -112.1129 }
            },
            timestamp: '2025-06-07T18:30:00Z',
            tags: ['tesla', 'grand-canyon', 'sunset', 'scenic'],
            tripDay: 7,
            fileSize: 2456789,
            uploadedAt: '2025-06-07T19:00:00Z',
            isFavorite: true,
            views: 45
          },
          {
            id: 'sample-2',
            type: 'video',
            filename: 'charging-supercharger.mp4',
            url: 'https://via.placeholder.com/800x600?text=Charging+Video',
            thumbnailUrl: 'https://via.placeholder.com/800x600?text=Charging+Thumbnail',
            title: 'Supercharger Stop in Nevada',
            description: 'Quick charging session at a Tesla Supercharger in Nevada desert.',
            location: {
              state: 'Nevada',
              city: 'Las Vegas',
              coordinates: { lat: 36.1699, lng: -115.1398 }
            },
            timestamp: '2025-06-09T14:15:00Z',
            tags: ['tesla', 'supercharger', 'charging', 'road-trip'],
            tripDay: 9,
            fileSize: 15678900,
            uploadedAt: '2025-06-09T14:30:00Z',
            isFavorite: false,
            views: 23
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load media items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMediaUploaded = (newMedia: any[]) => {
    // Convert uploaded files to MediaItem format
    const mediaItems: MediaItem[] = newMedia.map(media => ({
      id: `media-${Date.now()}-${Math.random()}`,
      type: media.type?.startsWith('video') ? 'video' : 'photo',
      filename: media.file?.name || 'unknown',
      url: media.preview || '',
      title: media.file?.name?.replace(/\.[^/.]+$/, '') || 'Untitled',
      description: '',
      location: {
        state: media.state || currentLocation?.state || '',
        city: media.waypoint || currentLocation?.city || '',
        coordinates: media.location || currentLocation?.coordinates
      },
      timestamp: media.timestamp?.toISOString() || new Date().toISOString(),
      tags: [],
      tripDay: Math.ceil((Date.now() - new Date('2025-06-01').getTime()) / (1000 * 60 * 60 * 24)),
      fileSize: media.file?.size || 0,
      uploadedAt: new Date().toISOString(),
      isFavorite: false,
      views: 0
    }));

    const updatedMedia = [...mediaItems, ...mediaItems];
    setMediaItems(updatedMedia);
    
    // Save to localStorage
    localStorage.setItem('tripMedia', JSON.stringify(updatedMedia));
    
    // Switch to gallery tab to show uploaded media
    setActiveTab('gallery');
  };

  const handleMediaDelete = (mediaId: string) => {
    const updatedMedia = mediaItems.filter(item => item.id !== mediaId);
    setMediaItems(updatedMedia);
    localStorage.setItem('tripMedia', JSON.stringify(updatedMedia));
  };

  const handleMediaUpdate = (mediaId: string, updates: Partial<MediaItem>) => {
    const updatedMedia = mediaItems.map(item =>
      item.id === mediaId ? { ...item, ...updates } : item
    );
    setMediaItems(updatedMedia);
    localStorage.setItem('tripMedia', JSON.stringify(updatedMedia));
  };

  const handleExportMedia = () => {
    const dataStr = JSON.stringify(mediaItems, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trip-media-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleClearAllMedia = () => {
    if (confirm('Are you sure you want to delete all media? This action cannot be undone.')) {
      setMediaItems([]);
      localStorage.removeItem('tripMedia');
    }
  };

  // Show admin login if not authenticated
  if (!isAuthenticated || !canUploadMedia) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Media Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Admin authentication required to access media management features.
          </p>
          <AdminLogin />
        </CardContent>
      </Card>
    );
  }

  const totalPhotos = mediaItems.filter(item => item.type === 'photo').length;
  const totalVideos = mediaItems.filter(item => item.type === 'video').length;
  const totalSize = mediaItems.reduce((sum, item) => sum + item.fileSize, 0);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-6 h-6" />
            Trip Media Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-adventure-orange">{totalPhotos}</div>
              <div className="text-sm text-muted-foreground">Photos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-adventure-blue">{totalVideos}</div>
              <div className="text-sm text-muted-foreground">Videos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-adventure-green">
                {Math.round(totalSize / 1024 / 1024)}
              </div>
              <div className="text-sm text-muted-foreground">MB Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-adventure-purple">
                {new Set(mediaItems.map(item => item.location.state)).size}
              </div>
              <div className="text-sm text-muted-foreground">States</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Gallery ({mediaItems.length})
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="space-y-6">
          <MediaGallery
            media={mediaItems}
            onMediaDelete={canModifyJourney ? handleMediaDelete : undefined}
            onMediaUpdate={canModifyJourney ? handleMediaUpdate : undefined}
            tripStates={tripStates}
          />
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <MediaUpload
            onMediaUploaded={handleMediaUploaded}
            currentLocation={currentLocation}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Media Management Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  onClick={handleExportMedia}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export All Media Data
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => loadMediaItems()}
                  className="flex items-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  Reload Media
                </Button>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium text-destructive mb-2">Danger Zone</h4>
                <Button 
                  variant="destructive" 
                  onClick={handleClearAllMedia}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete All Media
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  This will permanently delete all uploaded media. This action cannot be undone.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MediaManager;
