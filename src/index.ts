import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import routes from './routes.js';
import { initializeCollection } from './services/qdrant-service.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.listen(config.port, async () => {
  console.log(`Server is running on port ${config.port}`);

  // Initialize Qdrant collection on startup
  // Note: Model dimension for gemini-embedding-2-preview may vary depending on actual returned sizes.
  // Standard multimodal embeddings size is typically 768.
  await initializeCollection(768);
});
