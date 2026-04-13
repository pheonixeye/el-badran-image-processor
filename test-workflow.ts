import fs from 'fs';
import path from 'path';
import { processImage } from './src/services/image-processor.js';
import { generateImageEmbedding } from './src/services/embedding-service.js';
import { searchByEmbedding } from './src/services/qdrant-service.js';
import { getImageUrlFromFirestore } from './src/services/firebase-service.js';

const runTest = async () => {
  try {
    const cwd = process.cwd();
    const sourceImage = path.join(cwd, 'image.jpg');
    const resultDir = path.join(cwd, 'result-test');

    if (!fs.existsSync(resultDir)) {
      fs.mkdirSync(resultDir, { recursive: true });
    }

    console.log('1. Reading image.jpg...');
    const imageBuffer = fs.readFileSync(sourceImage);

    console.log('2. Processing image...');
    const processedBuffer = await processImage(imageBuffer);
    
    // Save processed query image to result-test folder
    fs.writeFileSync(path.join(resultDir, 'query_processed.jpg'), processedBuffer);
    console.log('-> Processed query image saved to result-test/query_processed.jpg');

    console.log('3. Generating embeddings...');
    const vector = await generateImageEmbedding(processedBuffer);

    console.log('4. Searching Qdrant collection...');
    const results = await searchByEmbedding(vector);

    console.log('Search Results:', JSON.stringify(results, null, 2));

    // Download images from the returned URLs
    for (const [index, match] of results.entries()) {
      let pulledUrl = null;
      
      // Since test-workflow script queries Qdrant directly without passing through the route logic,
      // it doesn't get the 'hydrated' array that /search returns.
      // We must manually call Firebase here to mimic the route hydration!
      const payload = match.payload as Record<string, any>;
      if (payload && payload.firestoreId) {
         pulledUrl = await getImageUrlFromFirestore(payload.firestoreId);
      }

      if (pulledUrl) {
         const outPath = path.join(resultDir, `match_${index}.jpg`);
         try {
           const response = await fetch(pulledUrl);
           if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
           const buf = Buffer.from(await response.arrayBuffer());
           fs.writeFileSync(outPath, buf);
           console.log(`-> Saved match ${index} (from Firebase URL) to result-test/match_${index}.jpg`);
         } catch (e) {
           console.log(`-> Match ${index} Download Failed from ${pulledUrl}:`, e);
         }
      } else {
         console.log(`-> Match ${index} contained no Firestore ID or valid image URL.`);
      }
    }

    console.log('Test complete!');
  } catch (err) {
    console.error('Test Execution Error:', err);
  }
};

runTest();
