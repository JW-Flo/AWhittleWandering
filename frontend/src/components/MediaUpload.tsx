import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, MapPin, Clock, FileImage, Video, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  // Supported iPhone formats
  const supportedFormats = [
    'image/jpeg', 'image/png', 'image/heic', 'image/heif',
    'video/mp4', 'video/mov', 'video/quicktime'
  ];

  const extractEXIFData = async (file: File): Promise<{ location?: { lat: number; lng: number }; timestamp?: Date }> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve({ timestamp: new Date(file.lastModified) });
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          // @ts-ignore - EXIF library types may not be available
          window.EXIF?.getData(img, function() {
            // @ts-ignore
            const lat = window.EXIF.getTag(this, "GPSLatitude");
            // @ts-ignore
            const lon = window.EXIF.getTag(this, "GPSLongitude");
            // @ts-ignore
            const latRef = window.EXIF.getTag(this, "GPSLatitudeRef");
            // @ts-ignore
            const lonRef = window.EXIF.getTag(this, "GPSLongitudeRef");
            // @ts-ignore
            const dateTime = window.EXIF.getTag(this, "DateTime");

            let location;
            if (lat && lon) {
              const latitude = (latRef === "S" ? -1 : 1) * (lat[0] + lat[1]/60 + lat[2]/3600);
              const longitude = (lonRef === "W" ? -1 : 1) * (lon[0] + lon[1]/60 + lon[2]/3600);
              location = { lat: latitude, lng: longitude };
            }

            let timestamp = new Date(file.lastModified);
            if (dateTime) {
              try {
                timestamp = new Date(dateTime.replace(/:/g, '-').replace(' ', 'T'));
              } catch (e) {
                console.warn('Could not parse EXIF date:', dateTime);
              }
            }

            resolve({ location, timestamp });
          });
        } catch (error) {
          console.warn('EXIF extraction failed:', error);
          resolve({ timestamp: new Date(file.lastModified) });
        }
      };
      
      img.onerror = () => {
        resolve({ timestamp: new Date(file.lastModified) });
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const processFiles = async (files: FileList) => {
    setIsProcessing(true);
    const newMedia: MediaFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!supportedFormats.includes(file.type)) {
        console.warn(`Unsupported file type: ${file.type}`);
        continue;
      }

      const isVideo = file.type.startsWith('video/');
      const preview = URL.createObjectURL(file);
      
      // Extract metadata
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
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [currentLocation]);

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

  const tagToWaypoint = (mediaId: string, waypoint: string) => {
    setUploadedMedia(prev => 
      prev.map(media => 
        media.id === mediaId ? { ...media, waypoint } : media
      )
    );
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
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
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
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
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
              disabled={isProcessing}
            />
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload className="w-12 h-12 text-gray-400" />
              </div>
              
              <div>
                <p className="text-lg font-medium">Drop your photos and videos here</p>
                <p className="text-sm text-gray-500 mt-1">
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
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {media.type === 'image' ? (
                      <img
                        src={media.preview}
                        alt="Uploaded media"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-8 h-8 text-gray-400" />
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
