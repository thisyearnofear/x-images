import { SocialPost } from './types';

function parseTweetId(url: string): string | null {
  // https://twitter.com/<user>/status/<id>
  const m = url.match(/status\/(\d+)/);
  return m ? m[1] : null;
}

export async function fetchTwitterPost(url: string): Promise<SocialPost | null> {
  const id = parseTweetId(url) || url;
  if (!id) return null;
  const resp = await fetch(
    `https://cdn.syndication.twimg.com/tweet?id=${id}&lang=en`
  );
  if (!resp.ok) return null;
  const data = await resp.json();
  if (!data.user) return null;

  return {
    network: 'twitter',
    externalId: id,
    author: {
      name: data.user.name,
      handle: "@" + data.user.screen_name,
      avatar: data.user.profile_image_url_https,
    },
    text: data.text || "",
    images: Array.isArray(data.photos)
      ? data.photos.map((p: any) => p.url)
      : [],
    stats: {
      likes: data.favorite_count || 0,
      replies: data.reply_count || 0,
      recasts: data.retweet_count || 0,
    },
  };
}