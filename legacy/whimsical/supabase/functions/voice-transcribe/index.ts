import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FETCH_TIMEOUT_MS = 25_000;

function getEnv(name: string): string | null {
  const v = Deno.env.get(name);
  return v && v.trim().length > 0 ? v.trim() : null;
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768): Uint8Array {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Processing audio for transcription...');
    
    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    console.log(`Audio size: ${binaryAudio.length} bytes`);
    
    // Prepare form data for OpenAI Whisper
    const formData = new FormData();
    // Create a File from Uint8Array - use slice to get ArrayBuffer
    const arrayBuffer = binaryAudio.buffer.slice(
      binaryAudio.byteOffset,
      binaryAudio.byteOffset + binaryAudio.byteLength
    ) as ArrayBuffer;
    const file = new File([arrayBuffer], 'audio.webm', { type: 'audio/webm' });
    formData.append('file', file);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'json');

    const OPENAI_API_KEY = getEnv('OPENAI_API_KEY');
    
    if (OPENAI_API_KEY) {
      const baseUrl = getEnv('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1';
      const response = await fetchWithTimeout(`${baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      }, FETCH_TIMEOUT_MS);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI Whisper error:', errorText);
        throw new Error(`Transcription failed: ${errorText}`);
      }

      const result = await response.json();
      console.log('Transcription successful');

      return new Response(
        JSON.stringify({ text: result.text }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Missing OPENAI_API_KEY; voice transcription unavailable');
    
    return new Response(
      JSON.stringify({ 
        error: 'Voice transcription is not configured',
        text: null 
      }),
      { 
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error('Voice transcribe error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
