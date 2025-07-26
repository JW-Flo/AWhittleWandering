// Media management API endpoints for A Whittle Wandering
// Handles photo/video upload, storage, and gallery functionality

// Import Cloudflare Worker types
/// <reference types="@cloudflare/workers-types" />

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

interface MediaUploadRequest {
  file: File;
  title: string;
  description?: string;
  location?: {
    state: string;
    city: string;
    coordinates?: { lat: number; lng: number };
  };
  tags?: string[];
  timestamp?: string;
}

// Media storage using Cloudflare R2 (would need R2 bucket configured)
export class MediaStorage {
  private bucket: R2Bucket;
  private baseUrl: string;

  constructor(bucket: R2Bucket, baseUrl: string) {
    this.bucket = bucket;
    this.baseUrl = baseUrl;
  }

  async uploadMedia(request: MediaUploadRequest, adminToken: string): Promise<MediaItem> {
    // Verify admin authentication
    if (!this.isValidAdminToken(adminToken)) {
      throw new Error('Unauthorized: Invalid admin token');
    }

    const fileId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const extension = request.file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${fileId}.${extension}`;
    
    // Upload original file to R2
    await this.bucket.put(filename, request.file.stream(), {
      httpMetadata: {
        contentType: request.file.type,
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
      customMetadata: {
        originalName: request.file.name,
        uploadedBy: 'admin',
        timestamp: request.timestamp || new Date().toISOString(),
      }
    });

    // Generate thumbnail for images/videos
    let thumbnailUrl: string | undefined;
    if (request.file.type.startsWith('image/') || request.file.type.startsWith('video/')) {
      thumbnailUrl = await this.generateThumbnail(filename, request.file);
    }

    const mediaItem: MediaItem = {
      id: fileId,
      type: request.file.type.startsWith('video/') ? 'video' : 'photo',
      filename,
      url: `${this.baseUrl}/${filename}`,
      thumbnailUrl,
      title: request.title,
      description: request.description || '',
      location: request.location || {
        state: 'Unknown',
        city: 'Unknown'
      },
      timestamp: request.timestamp || new Date().toISOString(),
      tags: request.tags || [],
      tripDay: this.calculateTripDay(request.timestamp),
      fileSize: request.file.size,
      uploadedAt: new Date().toISOString(),
      isFavorite: false,
      views: 0
    };

    // Store metadata in KV storage
    await this.storeMediaMetadata(mediaItem);

    return mediaItem;
  }

  async getMediaList(filters?: {
    state?: string;
    type?: 'photo' | 'video';
    tags?: string[];
    dateRange?: { start: string; end: string };
  }): Promise<MediaItem[]> {
    // Get all media metadata from KV
    const allMedia = await this.getAllMediaMetadata();
    
    if (!filters) {
      return allMedia;
    }

    return allMedia.filter(item => {
      if (filters.state && item.location.state !== filters.state) {
        return false;
      }
      if (filters.type && item.type !== filters.type) {
        return false;
      }
      if (filters.tags && !filters.tags.some(tag => item.tags.includes(tag))) {
        return false;
      }
      if (filters.dateRange) {
        const itemDate = new Date(item.timestamp);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (itemDate < startDate || itemDate > endDate) {
          return false;
        }
      }
      return true;
    });
  }

  async deleteMedia(mediaId: string, adminToken: string): Promise<boolean> {
    if (!this.isValidAdminToken(adminToken)) {
      throw new Error('Unauthorized: Invalid admin token');
    }

    const metadata = await this.getMediaMetadata(mediaId);
    if (!metadata) {
      throw new Error('Media not found');
    }

    // Delete from R2 storage
    await this.bucket.delete(metadata.filename);
    if (metadata.thumbnailUrl) {
      const thumbnailKey = metadata.thumbnailUrl.split('/').pop();
      if (thumbnailKey) {
        await this.bucket.delete(`thumbnails/${thumbnailKey}`);
      }
    }

    // Remove metadata from KV
    await this.deleteMediaMetadata(mediaId);

    return true;
  }

  async updateMedia(mediaId: string, updates: Partial<MediaItem>, adminToken: string): Promise<MediaItem> {
    if (!this.isValidAdminToken(adminToken)) {
      throw new Error('Unauthorized: Invalid admin token');
    }

    const existing = await this.getMediaMetadata(mediaId);
    if (!existing) {
      throw new Error('Media not found');
    }

    const updated = { ...existing, ...updates };
    await this.storeMediaMetadata(updated);
    
    return updated;
  }

  private async generateThumbnail(filename: string, file: File): Promise<string> {
    // For now, return placeholder thumbnail
    // In production, this would use Cloudflare Images or similar service
    const thumbnailFilename = `thumbnails/thumb_${filename}`;
    
    // Simple thumbnail generation (placeholder implementation)
    // Real implementation would resize image/extract video frame
    await this.bucket.put(thumbnailFilename, file.stream(), {
      httpMetadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
      }
    });

    return `${this.baseUrl}/${thumbnailFilename}`;
  }

  private calculateTripDay(timestamp?: string): number {
    const tripStart = new Date('2025-06-01');
    const date = timestamp ? new Date(timestamp) : new Date();
    return Math.ceil((date.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24));
  }

  private isValidAdminToken(token: string): boolean {
    // Simple token validation - in production would be more robust
    return Boolean(token && token.startsWith('admin_') && token.length > 20);
  }

  private async storeMediaMetadata(media: MediaItem): Promise<void> {
    // Store in KV storage for quick retrieval
    const kvKey = `media:${media.id}`;
    await MEDIA_KV.put(kvKey, JSON.stringify(media));
    
    // Also maintain a list of all media IDs for efficient listing
    const allMediaIds = await this.getAllMediaIds();
    if (!allMediaIds.includes(media.id)) {
      allMediaIds.push(media.id);
      await MEDIA_KV.put('media:all_ids', JSON.stringify(allMediaIds));
    }
  }

  private async getMediaMetadata(mediaId: string): Promise<MediaItem | null> {
    const kvKey = `media:${mediaId}`;
    const data = await MEDIA_KV.get(kvKey);
    return data ? JSON.parse(data) : null;
  }

  private async deleteMediaMetadata(mediaId: string): Promise<void> {
    const kvKey = `media:${mediaId}`;
    await MEDIA_KV.delete(kvKey);
    
    // Remove from media list
    const allMediaIds = await this.getAllMediaIds();
    const filteredIds = allMediaIds.filter(id => id !== mediaId);
    await MEDIA_KV.put('media:all_ids', JSON.stringify(filteredIds));
  }

  private async getAllMediaIds(): Promise<string[]> {
    const data = await MEDIA_KV.get('media:all_ids');
    return data ? JSON.parse(data) : [];
  }

  private async getAllMediaMetadata(): Promise<MediaItem[]> {
    const allIds = await this.getAllMediaIds();
    const mediaPromises = allIds.map(id => this.getMediaMetadata(id));
    const mediaItems = await Promise.all(mediaPromises);
    return mediaItems.filter((item): item is MediaItem => item !== null);
  }
}

// HTTP handlers for media endpoints
export async function handleMediaUpload(request: Request, env: any): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const adminToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!adminToken) {
      return new Response('Authorization required', { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || '';
    const locationStr = formData.get('location') as string || '{}';
    const tagsStr = formData.get('tags') as string || '[]';
    const timestamp = formData.get('timestamp') as string;

    if (!file || !title) {
      return new Response('File and title are required', { status: 400 });
    }

    const location = JSON.parse(locationStr);
    const tags = JSON.parse(tagsStr);

    const mediaStorage = new MediaStorage(env.MEDIA_BUCKET, env.MEDIA_BASE_URL);
    const mediaItem = await mediaStorage.uploadMedia({
      file,
      title,
      description,
      location,
      tags,
      timestamp
    }, adminToken);

    return new Response(JSON.stringify(mediaItem), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

  } catch (error) {
    console.error('Media upload error:', error);
    return new Response(JSON.stringify({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function handleMediaList(request: Request, env: any): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const filters = {
      state: url.searchParams.get('state') || undefined,
      type: (url.searchParams.get('type') as 'photo' | 'video') || undefined,
      tags: url.searchParams.get('tags')?.split(',') || undefined,
      dateRange: url.searchParams.get('start') && url.searchParams.get('end') ? {
        start: url.searchParams.get('start')!,
        end: url.searchParams.get('end')!
      } : undefined
    };

    const mediaStorage = new MediaStorage(env.MEDIA_BUCKET, env.MEDIA_BASE_URL);
    const mediaItems = await mediaStorage.getMediaList(filters);

    return new Response(JSON.stringify(mediaItems), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Media list error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch media',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function handleMediaDelete(request: Request, env: any): Promise<Response> {
  if (request.method !== 'DELETE') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const adminToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!adminToken) {
      return new Response('Authorization required', { status: 401 });
    }

    const url = new URL(request.url);
    const mediaId = url.pathname.split('/').pop();
    
    if (!mediaId) {
      return new Response('Media ID required', { status: 400 });
    }

    const mediaStorage = new MediaStorage(env.MEDIA_BUCKET, env.MEDIA_BASE_URL);
    await mediaStorage.deleteMedia(mediaId, adminToken);

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

  } catch (error) {
    console.error('Media delete error:', error);
    return new Response(JSON.stringify({
      error: 'Delete failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function handleMediaUpdate(request: Request, env: any): Promise<Response> {
  if (request.method !== 'PUT') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const adminToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!adminToken) {
      return new Response('Authorization required', { status: 401 });
    }

    const url = new URL(request.url);
    const mediaId = url.pathname.split('/').pop();
    
    if (!mediaId) {
      return new Response('Media ID required', { status: 400 });
    }

    const updates = await request.json() as Partial<MediaItem>;
    const mediaStorage = new MediaStorage(env.MEDIA_BUCKET, env.MEDIA_BASE_URL);
    const updatedMedia = await mediaStorage.updateMedia(mediaId, updates, adminToken);

    return new Response(JSON.stringify(updatedMedia), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

  } catch (error) {
    console.error('Media update error:', error);
    return new Response(JSON.stringify({
      error: 'Update failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Declare KV namespace (would be configured in wrangler.toml)
declare global {
  const MEDIA_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // Route media API requests
    if (path === '/api/media/upload') {
      return handleMediaUpload(request, env);
    }
    
    if (path === '/api/media/list') {
      return handleMediaList(request, env);
    }
    
    if (path.startsWith('/api/media/') && path.includes('/delete')) {
      return handleMediaDelete(request, env);
    }
    
    if (path.startsWith('/api/media/') && path.includes('/update')) {
      return handleMediaUpdate(request, env);
    }

    return new Response('Not found', { status: 404 });
  }
};
