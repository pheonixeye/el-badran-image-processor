import { 
  S3Client, 
  GetObjectCommand, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  ListObjectsV2Command 
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from '../config/index.js';

// Initialize S3 client with environment configuration
const s3 = new S3Client({
  endpoint: config.s3.endpoint || undefined, // Use custom endpoint (e.g., MinIO, RustFS) or AWS default
  forcePathStyle: true, // Required for S3-compatible storage like RustFS
  region: 'us-east-1', // Default region; can be overridden in production if needed
  credentials: (config.s3.accessKeyId && config.s3.secretAccessKey) ? {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  } : undefined,
});

/**
 * Uploads a file to S3 and returns the public URL.
 */
export const uploadToS3 = async (fileBuffer: Buffer, fileName: string): Promise<string> => {
  try {
    const command = new PutObjectCommand({
      Bucket: config.s3.bucketName,
      Key: fileName, // The S3 path/identifier for the file
      Body: fileBuffer,
    });

    await s3.send(command);
    
    // Construct public URL
    if (config.s3.endpoint) {
       const endpointStr = config.s3.endpoint.replace(/\/$/, "");
       return `${endpointStr}/${config.s3.bucketName}/${fileName}`;
    }
    
    return `https://${config.s3.bucketName}.s3.amazonaws.com/${fileName}`;
  } catch (error: any) {
    console.error(`Error uploading to S3 for ${fileName}:`, error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

/**
 * Generates a presigned URL for secure access to an S3 object.
 */
export const getPresignedUrl = async (fileName: string): Promise<string | null> => {
  try {
    if (config.s3.bucketName && config.s3.accessKeyId) {
      const command = new GetObjectCommand({
        Bucket: config.s3.bucketName,
        Key: fileName,
      });

      // Generate a presigned URL that expires in 1 hour (3600 seconds)
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      return url;
    } else {
      console.warn(`S3 bucket '${config.s3.bucketName}' has no public access configured.`);
      return null;
    }
  } catch (error: any) {
    console.error(`Error getting S3 object ${fileName}:`, error);
    throw new Error(`Failed to retrieve file from S3: ${error.message}`);
  }
};

/**
 * Deletes a file from S3.
 */
export const deleteFromS3 = async (fileName: string): Promise<void> => {
  try {
    await s3.send(new DeleteObjectCommand({
      Bucket: config.s3.bucketName,
      Key: fileName,
    }));
  } catch (error: any) {
    console.error(`Error deleting from S3 for ${fileName}:`, error);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
};

/**
 * Lists objects in a specific folder/prefix within the bucket.
 */
export const listObjectsInBucket = async (prefix?: string): Promise<string[]> => {
  try {
    if (prefix) {
      console.log(`Listing objects with prefix: ${prefix}`);
    }
    
    const command = new ListObjectsV2Command({
      Bucket: config.s3.bucketName,
      Prefix: prefix,
    });
    
    const response = await s3.send(command);
    if (!response.Contents) {
      return [];
    }
    
    return response.Contents.map(obj => obj.Key).filter((key): key is string => key !== undefined);
  } catch (error: any) {
    console.error('Error listing S3 objects:', error);
    throw new Error('Failed to list files in S3: ' + error.message);
  }
};
