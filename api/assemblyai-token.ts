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
  const apiKey = process.env.VITE_ASSEMBLYAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'AssemblyAI API key not configured' });
  }

  try {
    // Make request to AssemblyAI using new streaming API
    const response = await fetch('https://api.assemblyai.com/v2/realtime/token', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        expires_in: 3600, // Token expires in 1 hour
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Log 401 errors as warnings since they're expected without API key
      if (response.status === 401) {
        console.warn('AssemblyAI API key not configured or invalid:', response.status);
      } else {
        console.error('AssemblyAI API error:', response.status, errorText);
      }
      
      return res.status(response.status).json({ 
        error: 'Failed to get token from AssemblyAI',
        details: errorText 
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
