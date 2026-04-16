import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { processImage } from "./services/image-processor.js";
import { generateImageEmbedding } from "./services/embedding-service.js";
import { saveEmbedding, searchByEmbedding } from "./services/qdrant-service.js";
import { getImageUrlFromFirestore } from "./services/firebase-service.js";
import { uploadToS3, deleteFromS3 } from "./services/s3_service.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Ensure an internal directory to store the actual images that get uploaded
const uploadsDir = path.join(process.cwd(), "internal_uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: 'No image file provided. Field should be "image".' });
    }

    // 1. Process image
    const processedImageBuffer = await processImage(req.file.buffer);

    // 2. Generate vector embeddings
    const vector = await generateImageEmbedding(processedImageBuffer);

    // 3. Setup variables for S3 upload and atomicity
    const uniqueFileName = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    let s3Url: string | null = null;
    let pointId: string | undefined;

    try {
      // Upload to S3
      s3Url = await uploadToS3(processedImageBuffer, uniqueFileName);

      // Save to Qdrant with the S3 URL
      pointId = await saveEmbedding(vector, {
        originalName: req.file.originalname,
        s3Url,
        ...(req.body.category && { category: req.body.category }),
      });

    } catch (innerError) {
      if (s3Url && !pointId) {
        console.log(`Rolling back S3 upload for ${uniqueFileName} due to Qdrant failure.`);
        try {
          await deleteFromS3(uniqueFileName);
        } catch (rollbackError) {
           console.error(`Failed to rollback S3 upload for ${uniqueFileName}:`, rollbackError);
        }
      }
      throw innerError; // Let the outer catch handle the response
    }

    res.status(201).json({
      message: "Image uploaded and embedded successfully.",
      pointId,
      s3Url,
    });
  } catch (error: any) {
    console.error("Error in /upload:", error);
    res.status(500).json({ error: error.message || "Internal server error." });
  }
});

router.post("/search", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: 'No image file provided. Field should be "image".' });
    }

    // 1. Process image in the same way
    const processedImageBuffer = await processImage(req.file.buffer);

    // 2. Generate vector embeddings for the query image
    const vector = await generateImageEmbedding(processedImageBuffer);

    // 3. Search Qdrant
    const category = req.body.category;
    const results = await searchByEmbedding(vector, category);

    // 4. Hydrate Qdrant results with Firestore image URLs
    const hydratedResults = await Promise.all(
      results.map(async (match) => {
        const payload = (match.payload as Record<string, any>) || {};
        let pulledImageUrl = null;

        if (payload.firestoreId) {
          pulledImageUrl = await getImageUrlFromFirestore(payload.firestoreId);
        }

        return {
          ...match,
          imageUrl: pulledImageUrl,
        };
      }),
    );

    res.status(200).json({
      message: "Search completed.",
      results: hydratedResults,
    });
  } catch (error: any) {
    console.error("Error in /search:", error);
    res.status(500).json({ error: error.message || "Internal server error." });
  }
});

export default router;
