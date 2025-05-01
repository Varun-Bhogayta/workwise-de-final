/* eslint-disable @typescript-eslint/no-explicit-any */
import { storage, auth } from "./firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  list,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { validateFile } from "./utils";
import { showErrorToast } from "./error-utils";

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/**
 * Base function to upload a file to Firebase Storage
 * With improved CORS error handling and retry logic
 */
async function uploadFileToStorage(
  file: File,
  path: string,
  metadata?: Record<string, any>
): Promise<string> {
  const storageRef = ref(storage, path);
  
  // Try upload with retry logic
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      attempts++;
      
      // Set CORS-friendly metadata to help with cross-origin issues
      const uploadMetadata = {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          ...metadata,
        },
      };
      
      // Add a cache-busting parameter to avoid CORS caching issues
      const cacheBuster = `?cacheBust=${new Date().getTime()}`;
      const effectivePath = path + cacheBuster;
      const effectiveRef = ref(storage, effectivePath);
      
      const snapshot = await uploadBytes(effectiveRef, file, uploadMetadata);
      
      // If successful, return the download URL
      const downloadUrl = await getDownloadURL(snapshot.ref);
      console.log(`File uploaded successfully to ${path}`);
      return downloadUrl;
    } catch (error: any) {
      console.error(`Upload attempt ${attempts} failed:`, error);
      
      // If this was the last attempt, throw the error
      if (attempts >= maxAttempts) {
        throw error;
      }
      
      // If CORS error, wait a bit before retrying
      if (
        error.message?.includes("CORS") || 
        error.code === "storage/unauthorized" ||
        error.name === "QuotaExceededError" // Another common CORS-related error
      ) {
        console.log(`CORS issue detected, retrying in ${attempts * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, attempts * 1000));
      }
    }
  }
  
  throw new Error("Maximum upload attempts exceeded");
}

export async function uploadImage(
  file: File,
  folder: string = "images"
): Promise<string> {
  try {
    validateFile(file, MAX_FILE_SIZE_MB, ALLOWED_IMAGE_TYPES);

    const fileExt = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    
    // Use the correct path structure based on storage rules
    // If folder is "avatars", map it to "images" as per storage rules
    // If folder is "company_logos", map it to "companies" as per storage rules
    let storageFolder = folder;
    if (folder === "avatars") {
      storageFolder = "images";
    } else if (folder === "company_logos") {
      storageFolder = "companies";
    }
    
    // Get current user ID from auth if possible
    const currentUser = auth.currentUser;
    const userId = currentUser?.uid || "anonymous";
    
    // Use the correct path structure: /{storageFolder}/{userId}/{fileName}
    const filePath = `${storageFolder}/${userId}/${fileName}`;
    
    console.log(`Uploading to path: ${filePath}`);
    return await uploadFileToStorage(file, filePath);
  } catch (error) {
    showErrorToast(error, "Image upload failed");
    throw error;
  }
}

export async function uploadResume(
  file: File,
  userId: string
): Promise<string> {
  try {
    validateFile(file, MAX_FILE_SIZE_MB, ALLOWED_RESUME_TYPES);

    const fileExt = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `resumes/${userId}/${fileName}`;

    return await uploadFileToStorage(file, filePath, { userId });
  } catch (error) {
    showErrorToast(error, "Resume upload failed");
    throw error;
  }
}

export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    // Extract the path from the download URL
    const decodedUrl = decodeURIComponent(fileUrl);
    const matches = decodedUrl.match(/([^/]+)%2F(.+?)\?/);
    if (!matches) throw new Error("Invalid file URL");

    const [, folder, filename] = matches;
    const filePath = `${folder}/${filename}`;
    const fileRef = ref(storage, filePath);

    await deleteObject(fileRef);
  } catch (error) {
    showErrorToast(error, "File deletion failed");
    throw error;
  }
}

export async function listUserFiles(
  userId: string,
  folder: string = "resumes"
): Promise<string[]> {
  try {
    const listRef = ref(storage, `${folder}/${userId}`);
    const result = await list(listRef, { maxResults: 100 });
    const urls = await Promise.all(
      result.items.map((item) => getDownloadURL(item))
    );
    return urls;
  } catch (error) {
    showErrorToast(error, "Failed to list files");
    throw error;
  }
}
