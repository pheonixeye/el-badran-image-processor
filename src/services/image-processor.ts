import sharp from 'sharp';

/**
 * Processes an image according to the requirements:
 * 1. Resize to 224x224
 * 2. Convert to RGB (remove alpha channel, set colorspace)
 * 3. Remove EXIF orientation (rotate without args)
 * 
 * Note: Pixel value normalization (0-1 / mean-std) is typically handled internally
 * by the Google embedding model when sending a standard image format.
 * Therefore, we output a standard compressed JPEG format.
 */
export const processImage = async (inputBuffer: Buffer): Promise<Buffer> => {
  return await sharp(inputBuffer)
    .rotate() // removes EXIF orientation
    .resize(224, 224, {
      fit: 'cover',
      position: 'center'
    }) // Resize to 224x224
    .toColorspace('srgb') // Convert to standard RGB
    .flatten({ background: { r: 255, g: 255, b: 255 } }) // Removes alpha by blending with white
    .jpeg({ quality: 90 }) // Export as standard image
    .toBuffer();
};
