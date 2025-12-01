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

  // AssemblyAI streaming requires a temporary token for WebSocket auth
  // Generate it server-side to keep the API key secure
  // Docs: https://www.assemblyai.com/docs/speech-to-text/streaming
  
  try {
    // Try to get a temporary token from AssemblyAI
    const response = await fetch('https://api.assemblyai.com/v2/realtime/token', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AssemblyAI Token] Failed to get token:', {
        status: response.status,
        error: errorText,
        keyPreview
      });
      
      // If token endpoint fails, fall back to returning the API key directly
      // (some AssemblyAI plans might not support token generation)
      console.log('[AssemblyAI Token] Falling back to direct API key');
      return res.status(200).json({ 
        token: apiKey 
      });
    }

    const data = await response.json();
    console.log('[AssemblyAI Token] Successfully generated temporary token');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error proxying AssemblyAI request:', error);
    
    // Fall back to returning the API key
    return res.status(200).json({ 
      token: apiKey 
    });
  }
}
