import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SignedUrlResult {
  url: string | null;
  loading: boolean;
  error: string | null;
}

// Cache for signed URLs to avoid repeated requests
const urlCache = new Map<string, { url: string; expiry: number }>();
const CACHE_DURATION_MS = 50 * 60 * 1000; // 50 minutes (URLs valid for 1 hour)

export function useSignedUrl(filePath: string | null, journeyId?: string): SignedUrlResult {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) {
      setUrl(null);
      return;
    }

    // Check cache first
    const cached = urlCache.get(filePath);
    if (cached && cached.expiry > Date.now()) {
      setUrl(cached.url);
      return;
    }

    const fetchSignedUrl = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        const response = await supabase.functions.invoke('signed-url', {
          body: { file_path: filePath, journey_id: journeyId }
        });

        if (response.error) {
          throw new Error(response.error.message || 'Failed to get signed URL');
        }

        const signedUrl = response.data?.url;
        if (signedUrl) {
          // Cache the URL
          urlCache.set(filePath, { 
            url: signedUrl, 
            expiry: Date.now() + CACHE_DURATION_MS 
          });
          setUrl(signedUrl);
        } else {
          throw new Error('No URL returned');
        }
      } catch (err) {
        console.error('[useSignedUrl] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load media');
      } finally {
        setLoading(false);
      }
    };

    fetchSignedUrl();
  }, [filePath, journeyId]);

  return { url, loading, error };
}

// Batch fetch signed URLs for multiple files
export async function fetchSignedUrls(
  files: Array<{ file_path: string; journey_id?: string }>
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const uncached: typeof files = [];

  // Check cache for each file
  for (const file of files) {
    const cached = urlCache.get(file.file_path);
    if (cached && cached.expiry > Date.now()) {
      results.set(file.file_path, cached.url);
    } else {
      uncached.push(file);
    }
  }

  // Fetch uncached URLs in parallel (limit concurrency)
  const BATCH_SIZE = 5;
  for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
    const batch = uncached.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (file) => {
      try {
        const response = await supabase.functions.invoke('signed-url', {
          body: { file_path: file.file_path, journey_id: file.journey_id }
        });

        if (response.data?.url) {
          urlCache.set(file.file_path, {
            url: response.data.url,
            expiry: Date.now() + CACHE_DURATION_MS
          });
          return { path: file.file_path, url: response.data.url };
        }
        return null;
      } catch {
        return null;
      }
    });

    const batchResults = await Promise.all(promises);
    for (const result of batchResults) {
      if (result) {
        results.set(result.path, result.url);
      }
    }
  }

  return results;
}
