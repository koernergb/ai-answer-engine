import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: 'https://dashing-whippet-49781.upstash.io',
  token: '*********',
});

export async function createShareLink(messages: any[], contextFromUrls?: any) {
  const shareId = await redis.set(`conversation:${nanoid(10)}`, JSON.stringify({
    messages,
    contextFromUrls,
    createdAt: new Date().toISOString(),
  }));

  return shareId;
}

export async function getSharedConversation(shareId: string) {
  const conversationData = await redis.get(`conversation:${shareId}`);
  return conversationData ? JSON.parse(conversationData) : null;
}