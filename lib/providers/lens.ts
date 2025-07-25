import { SocialPost } from './types';
import { GraphQLClient, gql } from 'graphql-request';

const LENS_ENDPOINT = 'https://api-v2.lens.dev/graphql';

function parseLensPublicationId(url: string): string | null {
  // https://lens.xyz/posts/<pubId>
  const m = url.match(/lens\.xyz\/posts\/([\w\-]+)/);
  if (m) return m[1];
  // Allow direct id
  if (/^0x[a-fA-F0-9]+-\d+$/.test(url)) return url;
  return null;
}

export async function fetchLensPost(url: string): Promise<SocialPost | null> {
  const pubId = parseLensPublicationId(url) || url;
  if (!pubId) return null;

  const client = new GraphQLClient(LENS_ENDPOINT);
  const query = gql`
    query Publication($postId: InternalPublicationId!) {
      publication(request: {publicationId: $postId}) {
        ... on Post {
          id
          by { handle, metadata { displayName, picture { ... on Image { raw { uri } } } } }
          metadata { content, media { original { url } } }
          stats { upvotes, comments }
        }
      }
    }
  `;
  const variables = { postId: pubId };
  const resp = await client.request(query, variables);
  const post = resp.publication;
  if (!post) return null;

  return {
    network: 'lens',
    externalId: post.id,
    author: {
      name: post.by?.metadata?.displayName || post.by?.handle || "",
      handle: post.by?.handle ? "@" + post.by.handle : "",
      avatar: post.by?.metadata?.picture?.raw?.uri || "",
    },
    text: post.metadata?.content || "",
    images: Array.isArray(post.metadata?.media)
      ? post.metadata.media.map((m: any) => m.original?.url).filter(Boolean)
      : [],
    stats: {
      likes: post.stats?.upvotes || 0,
      replies: post.stats?.comments || 0,
    },
  };
}