import express from "express";
import cors from "cors";
import { config, validateConfig } from "./config/index.js";
import routes from "./routes.js";
import { requestLogger } from "./middlewares/logger.js";
import { spamBlocker } from "./middlewares/spam-blocker.js";
import { initializeCollection } from "./services/qdrant-service.js";

// Validate configuration before anything else
validateConfig();

const app = express();

app.use(cors());
app.use(express.json());

// Use custom Morgan logger
app.use(requestLogger);

// Use spam blocker middleware to deny malicious paths early
app.use(spamBlocker);

app.use("/api", routes);

app.listen(config.port, async () => {
  console.log(`Server is running on port ${config.port}`);

  // Initialize Qdrant collection on startup
  // Note: Model dimension for gemini-embedding-2-preview may vary depending on actual returned sizes.
  // Standard multimodal embeddings size is typically 768.
  await initializeCollection(768);
});
