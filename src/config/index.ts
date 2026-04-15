import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    modelName: 'gemini-embedding-2-preview',
  },
  qdrant: {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY || '',
    collectionName: process.env.QDRANT_COLLECTION || 'images_collection',
  },
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
    dbName: process.env.FIREBASE_DB_NAME || ''
  },
  s3 : {
    bucketName: process.env.S3_BUCKET_NAME || '',
    endpoint: process.env.S3_ENDPOINT || '',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  }
};

export const validateConfig = () => {
  const required = [
    { key: 'GEMINI_API_KEY', value: config.gemini.apiKey },
    { key: 'QDRANT_URL', value: config.qdrant.url },
    { key: 'QDRANT_API_KEY', value: config.qdrant.apiKey },
    { key: 'FIREBASE_PROJECT_ID', value: config.firebase.projectId }
  ];

  const missing = required.filter(item => !item.value);

  if (missing.length > 0) {
    const errorMsg = `FATAL: Missing required environment variables: ${missing.map(m => m.key).join(', ')}`;
    console.error(errorMsg);
    // In production, we want to fail fast
    process.exit(1);
  }

  console.log('✅ Configuration validated successfully.');
};
