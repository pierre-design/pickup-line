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

  try {
    // Make request to AssemblyAI to get temporary token for streaming
    // Docs: https://www.assemblyai.com/docs/speech-to-text/streaming
    const response = await fetch('https://api.assemblyai.com/v2/realtime/token', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Log detailed error information
      console.error('[AssemblyAI Token] API request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        keyPreview
      });
      
      return res.status(response.status).json({ 
        error: 'Failed to get token from AssemblyAI',
        details: errorText,
        status: response.status
      });
    }

    const data = await response.json();

    // Return the token to the client
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error proxying AssemblyAI request:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
