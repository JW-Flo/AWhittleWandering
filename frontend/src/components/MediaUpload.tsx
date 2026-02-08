import React, { useCallback, useState } from 'react';
import EXIF from 'exif-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, Upload, MapPin, Clock, FileImage, Video, X, Shield, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/lib/auth';

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  timestamp?: Date;
  state?: string;
  waypoint?: string;
}

interface MediaUploadProps {
  onMediaUploaded: (media: MediaFile[]) => void;
  currentLocation?: {
    state: string;
    coordinates: { lat: number; lng: number };
  };
}

const MediaUpload: React.FC<MediaUploadProps> = ({ onMediaUploaded, currentLocation }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<MediaFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Admin authentication
  const { isAuthenticated, canUploadMedia } = useAdminAuth();

  // Handle drag and drop - MOVED TO TOP LEVEL
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Process uploaded files
  const processFiles = useCallback(async (files: FileList) => {
    // Supported iPhone formats - moved inside callback to avoid dependency issues
    const supportedFormats = [
      'image/jpeg', 'image/png', 'image/heic', 'image/heif',
      'video/mp4', 'video/mov', 'video/quicktime'
    ];

    setIsProcessing(true);
    const newMedia: MediaFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!supportedFormats.includes(file.type)) {
        // Skip unsupported file types
        continue;
      }

      const preview = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      const metadata = await extractEXIFData(file);
      
      const mediaFile: MediaFile = {
        id: `${Date.now()}-${i}`,
        file,
        preview,
        type: isVideo ? 'video' : 'image',
        location: metadata.location || (currentLocation ? currentLocation.coordinates : undefined),
        timestamp: metadata.timestamp,
        state: currentLocation?.state,
        waypoint: `${currentLocation?.state} - ${new Date().toLocaleDateString()}`
      };

      newMedia.push(mediaFile);
    }

    setUploadedMedia(prev => [...prev, ...newMedia]);
    setIsProcessing(false);
    onMediaUploaded(newMedia);
  }, [currentLocation, onMediaUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  // If not authenticated, show admin login
  if (!isAuthenticated || !canUploadMedia) {
    return (
      <Card className="media-upload-restricted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow-500" />
            Media Upload - Admin Access Required
          </CardTitle>
          <CardDescription>
            Media upload functionality is restricted to administrators to prevent unauthorized content modification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-yellow-800">
              <strong>Security Notice:</strong> Media uploads can affect the journey tracking experience.
              Only authorized administrators can upload photos and videos to maintain content integrity.
            </AlertDescription>
          </Alert>
          <p className="text-sm text-muted-foreground">
            Sign in from the dashboard settings to enable media uploads.
          </p>
        </CardContent>
      </Card>
    );
  }

  const extractEXIFData = async (file: File): Promise<{ location?: { lat: number; lng: number }; timestamp?: Date }> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve({ timestamp: new Date(file.lastModified) });
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        try {
          (EXIF as any).getData(img, function (this: any) {
            const lat = EXIF.getTag(this, "GPSLatitude");
            const lon = EXIF.getTag(this, "GPSLongitude");
            const latRef = EXIF.getTag(this, "GPSLatitudeRef");
            const lonRef = EXIF.getTag(this, "GPSLongitudeRef");
            const dateTime = EXIF.getTag(this, "DateTime");

            let location;
            if (lat && lon) {
              const latitude = (latRef === "S" ? -1 : 1) * (lat[0] + lat[1] / 60 + lat[2] / 3600);
              const longitude = (lonRef === "W" ? -1 : 1) * (lon[0] + lon[1] / 60 + lon[2] / 3600);
              location = { lat: latitude, lng: longitude };
            }

            let timestamp = new Date(file.lastModified);
            if (dateTime) {
              try {
                timestamp = new Date(dateTime.replace(/:/g, '-').replace(' ', 'T'));
              } catch {
                // EXIF date parsing failed, using file modification date
              }
            }

            URL.revokeObjectURL(objectUrl);
            resolve({ location, timestamp });
          });
        } catch {
          URL.revokeObjectURL(objectUrl);
          resolve({ timestamp: new Date(file.lastModified) });
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ timestamp: new Date(file.lastModified) });
      };

      img.src = objectUrl;
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeMedia = (id: string) => {
    setUploadedMedia(prev => {
      const updated = prev.filter(media => media.id !== id);
      const removed = prev.find(media => media.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Road Trip Media Upload
          </CardTitle>
          <CardDescription>
            Upload photos and videos from your iPhone. GPS location will be automatically tagged when available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Current Location Display */}
          {currentLocation && (
            <div className="mb-4 p-3 bg-primary/10 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Current Location: {currentLocation.state}</span>
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div
            className={cn(
              "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragActive 
                ? "border-blue-500 bg-primary/10 dark:bg-blue-900/20" 
                : "border-border dark:border-gray-600 hover:border-gray-400"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.heic,.heif,.mp4,.mov"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Upload photos and videos"
              disabled={isProcessing}
            />
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload className="w-12 h-12 text-muted-foreground/60" />
              </div>
              
              <div>
                <p className="text-lg font-medium">Drop your photos and videos here</p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse files
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="secondary">📸 HEIC</Badge>
                <Badge variant="secondary">🖼️ PNG/JPG</Badge>
                <Badge variant="secondary">🎥 MOV/MP4</Badge>
              </div>
            </div>
          </div>

          {isProcessing && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">Processing files...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Media Preview */}
      {uploadedMedia.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="w-5 h-5" />
              Uploaded Media ({uploadedMedia.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploadedMedia.map((media) => (
                <div key={media.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted dark:bg-gray-800">
                    {media.type === 'image' ? (
                      <img
                        src={media.preview}
                        alt={media.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-8 h-8 text-muted-foreground/60" />
                      </div>
                    )}
                  </div>
                  
                  {/* Media Info Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                    <div className="absolute top-2 right-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeMedia(media.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="text-white text-xs space-y-1">
                        {media.timestamp && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {media.timestamp.toLocaleString()}
                          </div>
                        )}
                        {media.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            GPS: {media.location.lat.toFixed(4)}, {media.location.lng.toFixed(4)}
                          </div>
                        )}
                        {media.waypoint && (
                          <div className="text-xs bg-blue-600 px-1 rounded">
                            {media.waypoint}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MediaUpload;
