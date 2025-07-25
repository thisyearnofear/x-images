import { SocialPost } from './types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
let NeynarAPIClient: any;
try {
  NeynarAPIClient = require('@neynar/node').NeynarAPIClient;
} catch (e) {}

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || '';

const PUBLIC_HUB_URL = 'https://api.neynar.com/v2/farcaster/cast';

function parseCastHash(url: string): string | null {
  // Warpcast: https://warpcast.com/~/cast/<hash>
  const match = url.match(/\/cast\/([0-9xa-fA-F]+)/);
  return match ? match[1] : null;
}

export async function fetchFarcasterPost(url: string): Promise<SocialPost | null> {
  const hash = parseCastHash(url) || url; // allow direct hash
  if (!hash) return null;

  // Prefer Neynar API client if key provided
  if (NEYNAR_API_KEY && NeynarAPIClient) {
    const client = new NeynarAPIClient(NEYNAR_API_KEY);
    const { cast } = await client.lookUpCastByHash(hash);
    return castToSocialPost(cast);
  } else {
    // Use public REST endpoint
    const resp = await fetch(`${PUBLIC_HUB_URL}?identifier=${hash}&type=cast`);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data.cast) return null;
    return castToSocialPost(data.cast);
  }
}

function castToSocialPost(cast: any): SocialPost {
  return {
    network: 'farcaster',
    externalId: cast.hash,
    author: {
      name: cast.author?.display_name || cast.author?.username || "",
      handle: cast.author?.username ? "@" + cast.author.username : "",
      avatar: cast.author?.pfp_url || "",
    },
    text: cast.text || "",
    images: Array.isArray(cast.embeds)
      ? cast.embeds.filter((e: any) => e.type === "image").map((e: any) => e.url)
      : [],
    stats: {
      likes: cast.reactions?.count?.liked || 0,
      recasts: cast.reactions?.count?.recasted || 0,
      replies: cast.replies?.count || 0,
    },
  };
}