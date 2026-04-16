import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../config/index.js';
import crypto from 'crypto';

const client = new QdrantClient({
  url: config.qdrant.url,
  port: 443,
  apiKey: config.qdrant.apiKey || undefined,
});

/**
 * Ensures the Qdrant collection exists. If not, it creates it.
 * Note: You should adjust the vector size based on your specific embedding model output.
 * Gemini embeddings are typically 768 dimensions, but you should verify this constraint for gemini-embedding-2-preview.
 */
export const initializeCollection = async (vectorSize: number = 768) => {
  try {
    const collections = await client.getCollections();
    const exists = collections.collections.some(c => c.name === config.qdrant.collectionName);

    if (!exists) {
      await client.createCollection(config.qdrant.collectionName, {
        vectors: {
          size: vectorSize,
          distance: 'Cosine'
        }
      });
      console.log(`Qdrant collection '${config.qdrant.collectionName}' created.`);
    }
  } catch (error) {
    console.error('Failed to initialize Qdrant collection:', error);
  }
};

/**
 * Saves the given embedding vector mapped to a unique ID in Qdrant.
 */
export const saveEmbedding = async (vector: number[], metadata: Record<string, any> = {}) => {
  const id = crypto.randomUUID();

  await client.upsert(config.qdrant.collectionName, {
    points: [
      {
        id,
        vector,
        payload: {
          ...metadata,
          uploadedAt: new Date().toISOString()
        }
      }
    ]
  });

  return id;
};

/**
 * Searches Qdrant using an embedding vector and returns the top matches.
 */
export const searchByEmbedding = async (vector: number[], category?: string, limit: number = 5) => {
  const filter = category ? {
    must: [
      {
        key: 'category',
        match: {
          value: category
        }
      }
    ]
  } : undefined;

  const results = await client.search(config.qdrant.collectionName, {
    vector,
    limit,
    with_payload: true,
    filter
  });

  return results;
};
