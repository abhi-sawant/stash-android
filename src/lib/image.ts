import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Downscales a picked image to keep custom cover images small (the server caps
 * the JSON backup at 10MB and thumbnails at 5MB). Returns a local file:// URI
 * pointing at the compressed JPEG.
 */
export async function downscaleImage(uri: string, maxDim = 1280, quality = 0.82): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: maxDim } }], {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return result.uri;
  } catch {
    // If manipulation fails, fall back to the original picked image.
    return uri;
  }
}
