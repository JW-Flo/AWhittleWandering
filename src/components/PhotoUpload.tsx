import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  Image, 
  MapPin, 
  Calendar, 
  User, 
  Tag, 
  X, 
  CheckCircle,
  Loader2,
  Plus,
  Sparkles,
  Video,
  MapPinOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { JourneyWaypoint, journeyWaypoints } from '@/data/journeyRoute';
import { findNearestWaypoint } from '@/lib/waypointMatching';

interface PhotoUploadProps {
  journeyId: string;
  currentWaypoint?: JourneyWaypoint | null;
  onUploadComplete?: () => void;
  className?: string;
}

interface UploadFile {
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
  gpsLat?: number;
  gpsLng?: number;
  dateTaken?: Date;
  matchedWaypoint?: JourneyWaypoint;
  isVideo: boolean;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

export default function PhotoUpload({ journeyId, currentWaypoint, onUploadComplete, className = '' }: PhotoUploadProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [locationName, setLocationName] = useState(currentWaypoint?.name || '');
  const [stateCode, setStateCode] = useState(currentWaypoint?.state || '');
  const [people, setPeople] = useState<string[]>([]);
  const [newPerson, setNewPerson] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [includeGeolocation, setIncludeGeolocation] = useState(true);
  const [autoMatchWaypoints, setAutoMatchWaypoints] = useState(true);

  // Extract GPS coordinates from EXIF data
  const extractGPSFromFile = async (file: File): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      // For now, we'll use a simple approach - in production, use exif-js library
      // This is a placeholder that could be enhanced with actual EXIF parsing
      resolve(null);
    });
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    const newFiles: UploadFile[] = await Promise.all(
      selectedFiles.map(async (file) => {
        const gps = includeGeolocation ? await extractGPSFromFile(file) : null;
        const isVideo = file.type.startsWith('video/');
        let matchedWaypoint: JourneyWaypoint | undefined;
        
        // Try to match to nearest waypoint if GPS available and auto-match enabled
        if (gps && autoMatchWaypoints) {
          const match = findNearestWaypoint(gps.lat, gps.lng);
          if (match) {
            matchedWaypoint = match.waypoint;
          }
        }
        
        return {
          file,
          preview: isVideo ? '' : URL.createObjectURL(file),
          progress: 0,
          status: 'pending' as const,
          gpsLat: gps?.lat,
          gpsLng: gps?.lng,
          matchedWaypoint,
          isVideo
        };
      })
    );

    setFiles(prev => [...prev, ...newFiles]);
    setIsDialogOpen(true);
  }, [includeGeolocation, autoMatchWaypoints]);

  const removeFile = (index: number) => {
    setFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const addPerson = () => {
    if (newPerson.trim() && !people.includes(newPerson.trim())) {
      setPeople([...people, newPerson.trim()]);
      setNewPerson('');
    }
  };

  const removePerson = (person: string) => {
    setPeople(people.filter(p => p !== person));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const uploadFiles = async () => {
    if (!user || files.length === 0) return;

    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const uploadFile = files[i];
        if (uploadFile.status === 'complete') continue;

        // Update status
        setFiles(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: 'uploading' };
          return updated;
        });

        const fileName = `${user.id}/${journeyId}/${Date.now()}-${uploadFile.file.name}`;
        const fileType = uploadFile.file.type.startsWith('video/') ? 'video' : 'photo';

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('journey-photos')
          .upload(fileName, uploadFile.file);

        if (uploadError) throw uploadError;

        // Update progress
        setFiles(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], progress: 100 };
          return updated;
        });

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('journey-photos')
          .getPublicUrl(fileName);

        // Insert metadata
        const { error: dbError } = await supabase.from('journey_media').insert({
          journey_id: journeyId,
          user_id: user.id,
          type: fileType,
          file_path: fileName,
          file_url: urlData.publicUrl,
          caption: caption || null,
          taken_at: new Date(selectedDate).toISOString(),
          latitude: currentWaypoint?.lat || null,
          longitude: currentWaypoint?.lng || null,
          location_name: locationName || null,
          state_code: stateCode || null,
          people_tagged: people,
          tags: tags,
          file_size_bytes: uploadFile.file.size
        });

        if (dbError) throw dbError;

        // Update status to complete
        setFiles(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: 'complete', progress: 100 };
          return updated;
        });
      }

      toast.success(`Uploaded ${files.length} file(s) successfully`);
      onUploadComplete?.();
      
      // Reset after short delay
      setTimeout(() => {
        setFiles([]);
        setCaption('');
        setPeople([]);
        setTags([]);
        setIsDialogOpen(false);
      }, 1500);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    files.forEach(f => URL.revokeObjectURL(f.preview));
    setFiles([]);
    setCaption('');
    setPeople([]);
    setTags([]);
    setIsDialogOpen(false);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Upload Media
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Upload Button */}
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Photos & Videos
          </Button>

          {currentWaypoint && (
            <p className="text-xs text-muted-foreground text-center">
              Location: {currentWaypoint.name}, {currentWaypoint.state}
            </p>
          )}
        </div>

        {/* Upload Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Upload {files.length} File(s)
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Geolocation & Auto-match toggles */}
              <div className="flex flex-col gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {includeGeolocation ? (
                      <MapPin className="w-4 h-4 text-primary" />
                    ) : (
                      <MapPinOff className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Label htmlFor="geo-toggle" className="text-sm font-medium cursor-pointer">
                      Include location data
                    </Label>
                  </div>
                  <Switch
                    id="geo-toggle"
                    checked={includeGeolocation}
                    onCheckedChange={setIncludeGeolocation}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {includeGeolocation 
                    ? "GPS coordinates from photos will be used to match waypoints" 
                    : "Location data will not be extracted or shared"}
                </p>
                
                {includeGeolocation && (
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <Label htmlFor="auto-match" className="text-sm font-medium cursor-pointer">
                        Auto-match to waypoints
                      </Label>
                    </div>
                    <Switch
                      id="auto-match"
                      checked={autoMatchWaypoints}
                      onCheckedChange={setAutoMatchWaypoints}
                    />
                  </div>
                )}
              </div>

              {/* File Previews with auto-match indicators */}
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {files.map((f, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    {f.isVideo ? (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Video className="w-8 h-8 text-muted-foreground" />
                      </div>
                    ) : (
                      <img 
                        src={f.preview} 
                        alt={`Preview ${idx}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {f.isVideo && (
                      <div className="absolute bottom-1 left-1 bg-black/70 rounded px-1.5 py-0.5">
                        <span className="text-[10px] text-white font-medium">VIDEO</span>
                      </div>
                    )}
                    {f.matchedWaypoint && (
                      <div className="absolute top-1 left-1 bg-primary/90 rounded px-1.5 py-0.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-primary-foreground" />
                        <span className="text-[10px] text-primary-foreground font-medium">{f.matchedWaypoint.state}</span>
                      </div>
                    )}
                    {f.status === 'uploading' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                          <span className="text-xs">{Math.round(f.progress)}%</span>
                        </div>
                      </div>
                    )}
                    {f.status === 'complete' && (
                      <div className="absolute inset-0 bg-green-500/50 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-white" />
                      </div>
                    )}
                    {f.status === 'pending' && (
                      <button
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Auto-match waypoint selector */}
              <div>
                <label className="text-sm font-medium flex items-center gap-1 mb-1">
                  <MapPin className="w-3 h-3" /> Match to Waypoint
                </label>
                <Select 
                  value={locationName} 
                  onValueChange={(value) => {
                    const waypoint = journeyWaypoints.find(w => w.name === value);
                    if (waypoint) {
                      setLocationName(waypoint.name);
                      setStateCode(waypoint.state);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a waypoint or enter custom" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {journeyWaypoints.map(waypoint => (
                      <SelectItem key={waypoint.name} value={waypoint.name}>
                        {waypoint.name}, {waypoint.state} - {waypoint.date}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3" /> Location Name
                  </label>
                  <Input 
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g., Grand Canyon"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-1 mb-1">
                    State
                  </label>
                  <Select value={stateCode} onValueChange={setStateCode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="text-sm font-medium flex items-center gap-1 mb-1">
                  Caption
                </label>
                <Input 
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Describe this moment..."
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-sm font-medium flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3" /> Date Taken
                </label>
                <Input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              {/* People Tags */}
              <div>
                <label className="text-sm font-medium flex items-center gap-1 mb-1">
                  <User className="w-3 h-3" /> People in Photo
                </label>
                <div className="flex gap-2">
                  <Input 
                    value={newPerson}
                    onChange={(e) => setNewPerson(e.target.value)}
                    placeholder="Add person..."
                    onKeyDown={(e) => e.key === 'Enter' && addPerson()}
                  />
                  <Button size="sm" onClick={addPerson} variant="outline">Add</Button>
                </div>
                {people.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {people.map(person => (
                      <Badge key={person} variant="secondary" className="flex items-center gap-1">
                        {person}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removePerson(person)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-medium flex items-center gap-1 mb-1">
                  <Tag className="w-3 h-3" /> Tags
                </label>
                <div className="flex gap-2">
                  <Input 
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button size="sm" onClick={addTag} variant="outline">Add</Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tags.map(tag => (
                      <Badge key={tag} variant="outline" className="flex items-center gap-1">
                        #{tag}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={uploadFiles} 
                  disabled={isUploading || files.length === 0}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload {files.length} File(s)
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={resetUpload} disabled={isUploading}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
