import { fetchTwitterPost } from './twitter';
import { fetchFarcasterPost } from './farcaster';
import { fetchLensPost } from './lens';
import { SocialPost } from './types';

export function determineNetwork(url: string): 'twitter' | 'farcaster' | 'lens' | null {
  if (/twitter\.com\/.+\/status\/\d+/.test(url)) return 'twitter';
  if (/warpcast\.com\/.*\/cast\//.test(url) || /^0x[\da-fA-F]+$/.test(url)) return 'farcaster';
  if (/lens\.xyz\/posts\//.test(url) || /^0x[a-fA-F0-9\-]+$/.test(url)) return 'lens';
  return null;
}

export async function getPostData(url: string): Promise<SocialPost | null> {
  const provider = determineNetwork(url);
  if (provider === 'farcaster') return await fetchFarcasterPost(url);
  if (provider === 'lens') return await fetchLensPost(url);
  if (provider === 'twitter') return await fetchTwitterPost(url);
  // fallback: try each in order
  let post = await fetchFarcasterPost(url);
  if (post) return post;
  post = await fetchLensPost(url);
  if (post) return post;
  post = await fetchTwitterPost(url);
  if (post) return post;
  return null;
}