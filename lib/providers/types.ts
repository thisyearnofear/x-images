export interface SocialPost {
  network: 'twitter' | 'farcaster' | 'lens';
  externalId: string; // tweet id, cast hash, lens id
  author: { name: string; handle: string; avatar: string };
  text: string;
  images: string[];
  stats?: { likes?: number; recasts?: number; replies?: number };
}