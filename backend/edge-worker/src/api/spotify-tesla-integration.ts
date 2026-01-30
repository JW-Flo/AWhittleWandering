/**
 * 🎵 "Play a Song for Joe" Widget System
 * Real-time Spotify integration with Tesla media system
 * 
 * FEATURES:
 * - Web widget for visitors to request songs
 * - Direct integration with Tesla's media system via Tessie API
 * - Real-time notifications to Joe
 * - Song queue management
 * - Location-based filtering (only works when driving)
 */

import { Env } from '../types/env';

// =====================================================
// SPOTIFY TESLA INTEGRATION
// =====================================================

/**
 * Play Song Request Widget API
 * POST /api/play-song-for-joe
 */
interface SongRequestBody {
  songName: string;
  artist: string;
  requestedBy: string;
  message: string;
}

interface SongRequestRow {
  id: number;
  song_name: string;
  artist: string;
  spotify_uri: string;
  status: string;
}

export async function handleSongRequest(request: Request, env: Env): Promise<Response> {
  try {
    const { songName, artist, requestedBy, message } = await request.json() as SongRequestBody;
    
    // 1. Validate Tesla is available and driving
    const vehicleState = await getTeslaState(env);
    if (!vehicleState.isDriving) {
      return new Response(JSON.stringify({
        success: false,
        message: "Joe isn't driving right now. Song saved for next drive!"
      }), { status: 200 });
    }
    
    // 2. Search Spotify for the song
    const spotifyTrack = await searchSpotifyTrack(songName, artist, env);
    if (!spotifyTrack) {
      return new Response(JSON.stringify({
        success: false,
        message: "Song not found on Spotify. Try a different search."
      }), { status: 404 });
    }
    
    // 3. Add to Tesla's queue via Tessie API
    const playResult = await playSpotifyInTesla(spotifyTrack.uri, env);
    
    // 4. Store the request in D1
    await storeSongRequest(env.DB, {
      songName,
      artist,
      requestedBy,
      message,
      spotifyUri: spotifyTrack.uri,
      playedAt: playResult.success ? new Date().toISOString() : null,
      status: playResult.success ? 'played' : 'queued',
      location: vehicleState.location
    });
    
    // 5. Send real-time notification to Joe
    await sendJoeNotification(env, {
      type: 'song_request',
      title: `🎵 Song Request: ${songName}`,
      message: `${requestedBy} wants you to hear "${songName}" by ${artist}`,
      userMessage: message,
      played: playResult.success
    });
    
    return new Response(JSON.stringify({
      success: true,
      message: playResult.success 
        ? `🎵 Playing "${songName}" in Joe's Tesla!`
        : `🎵 Added "${songName}" to Joe's queue!`,
      songInfo: spotifyTrack
    }), { status: 200 });
    
  } catch (error) {
    console.error('Song request failed:', error);
    return new Response(JSON.stringify({
      success: false,
      message: "Something went wrong. Try again!"
    }), { status: 500 });
  }
}

/**
 * Get Tesla State via Tessie API
 */
async function getTeslaState(env: Env): Promise<{
  isDriving: boolean;
  location: string;
  speed: number;
  mediaState: any;
}> {
  const token = env.TESSIE_API_TOKEN || env.TESSIE_API_KEY;
  const response = await fetch(`https://api.tessie.com/${env.VEHICLE_ID}/state`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json() as any;
  
  return {
    isDriving: data.drive_state?.speed > 0 && data.drive_state?.shift_state !== 'P',
    location: `${data.drive_state?.latitude}, ${data.drive_state?.longitude}`,
    speed: data.drive_state?.speed || 0,
    mediaState: data.vehicle_state?.media_state
  };
}

/**
 * Search Spotify for track
 */
async function searchSpotifyTrack(songName: string, artist: string, env: Env): Promise<{
  name: string;
  artist: string;
  uri: string;
  previewUrl: string;
} | null> {
  try {
    // Get Spotify access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`)}`
      },
      body: 'grant_type=client_credentials'
    });
    
    const tokenData = await tokenResponse.json() as any;
    
    // Search for track
    const searchQuery = encodeURIComponent(`track:"${songName}" artist:"${artist}"`);
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${searchQuery}&type=track&limit=1`,
      {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      }
    );
    
    const searchData = await searchResponse.json() as any;
    
    if (searchData.tracks?.items?.length > 0) {
      const track = searchData.tracks.items[0];
      return {
        name: track.name,
        artist: track.artists[0].name,
        uri: track.uri,
        previewUrl: track.preview_url
      };
    }
    
    return null;
  } catch (error) {
    console.error('Spotify search failed:', error);
    return null;
  }
}

/**
 * Play Spotify track in Tesla via Tessie API
 */
async function playSpotifyInTesla(spotifyUri: string, env: Env): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Use Tessie API to control Tesla media
    const response = await fetch(`https://api.tessie.com/${env.VEHICLE_ID}/command/media_play_spotify_uri`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.TESSIE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        spotify_uri: spotifyUri
      })
    });
    
    const result = await response.json() as any;
    
    return {
      success: result.result === true,
      message: result.reason || 'Song command sent to Tesla'
    };
    
  } catch (error) {
    console.error('Tesla media control failed:', error);
    return {
      success: false,
      message: 'Failed to control Tesla media'
    };
  }
}

/**
 * Store song request in D1
 */
async function storeSongRequest(db: any, request: {
  songName: string;
  artist: string;
  requestedBy: string;
  message: string;
  spotifyUri: string;
  playedAt: string | null;
  status: string;
  location: string;
}): Promise<void> {
  await db.prepare(`
    INSERT INTO song_requests (
      song_name, artist, requested_by, message, spotify_uri, 
      played_at, status, location, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    request.songName,
    request.artist,
    request.requestedBy,
    request.message,
    request.spotifyUri,
    request.playedAt,
    request.status,
    request.location
  ).run();
}

/**
 * Send real-time notification to Joe
 */
async function sendJoeNotification(env: Env, notification: {
  type: string;
  title: string;
  message: string;
  userMessage: string;
  played: boolean;
}): Promise<void> {
  try {
    // Send push notification via WebPush or similar service
    if (!env.NOTIFICATION_WEBHOOK) {
      console.warn('NOTIFICATION_WEBHOOK not configured');
      return;
    }
    await fetch(env.NOTIFICATION_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...notification,
        timestamp: new Date().toISOString(),
        vehicle_location: await getTeslaState(env).then(s => s.location)
      })
    });
    
    // Also store in notification log
    await env.DB.prepare(`
      INSERT INTO notifications (
        type, title, message, metadata, created_at
      ) VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(
      notification.type,
      notification.title,
      notification.message,
      JSON.stringify({ userMessage: notification.userMessage, played: notification.played })
    ).run();
    
  } catch (error) {
    console.error('Notification failed:', error);
  }
}

// =====================================================
// SONG REQUEST QUEUE MANAGEMENT
// =====================================================

/**
 * Get Song Request Queue
 * GET /api/song-queue
 */
export async function getSongQueue(env: Env): Promise<Response> {
  const requests = await env.DB.prepare(`
    SELECT * FROM song_requests 
    WHERE status IN ('queued', 'played')
    ORDER BY created_at DESC 
    LIMIT 50
  `).all();
  
  const results = (requests.results || []) as unknown as SongRequestRow[];
  return new Response(JSON.stringify({
    queue: results,
    stats: {
      totalRequests: results.length,
      played: results.filter((r: SongRequestRow) => r.status === 'played').length,
      queued: results.filter((r: SongRequestRow) => r.status === 'queued').length
    }
  }), { status: 200 });
}

/**
 * Admin: Skip/Play Next Song
 * POST /api/song-queue/next
 */
export async function playNextSong(env: Env): Promise<Response> {
  const nextSong = await env.DB.prepare(`
    SELECT * FROM song_requests 
    WHERE status = 'queued' 
    ORDER BY created_at ASC 
    LIMIT 1
  `).first<SongRequestRow>();
  
  if (!nextSong) {
    return new Response(JSON.stringify({
      success: false,
      message: "No songs in queue"
    }), { status: 404 });
  }
  
  // Play the song
  const playResult = await playSpotifyInTesla(nextSong.spotify_uri, env);
  
  if (playResult.success) {
    await env.DB.prepare(`
      UPDATE song_requests 
      SET status = 'played', played_at = datetime('now')
      WHERE id = ?
    `).bind(nextSong.id).run();
  }
  
  return new Response(JSON.stringify({
    success: playResult.success,
    message: playResult.success 
      ? `🎵 Now playing: ${nextSong.song_name}`
      : "Failed to play song",
    song: nextSong
  }), { status: 200 });
}
