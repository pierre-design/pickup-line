import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function to proxy AssemblyAI token requests
 * This avoids CORS issues by making the API call from the server
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from environment variable
  // Note: Use ASSEMBLYAI_API_KEY (without VITE_ prefix) for serverless functions
  // VITE_ prefix is only for frontend build-time variables
  const apiKey = process.env.ASSEMBLYAI_API_KEY || process.env.VITE_ASSEMBLYAI_API_KEY;

  if (!apiKey) {
    console.error('[AssemblyAI Token] No API key found in environment variables');
    return res.status(500).json({ error: 'AssemblyAI API key not configured' });
  }

  // Log key info for debugging (first/last 4 chars only for security)
  const keyPreview = apiKey.length > 8 
    ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
    : '[key too short]';
  console.log('[AssemblyAI Token] Using API key:', keyPreview);

  // Note: The old /v2/realtime/token endpoint is deprecated
  // The new universal streaming API connects directly with the API key
  // This endpoint now just securely provides the API key to the frontend
  // Docs: https://www.assemblyai.com/docs/speech-to-text/streaming
  
  try {
    // Return the API key securely from the backend
    // The frontend will use this to connect to the WebSocket
    return res.status(200).json({ 
      token: apiKey 
    });
  } catch (error) {
    console.error('Error proxying AssemblyAI request:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
