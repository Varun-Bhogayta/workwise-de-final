/* eslint-disable @typescript-eslint/no-explicit-any */
import { storage } from "./firebase";
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
 */
async function uploadFileToStorage(
  file: File,
  path: string,
  metadata?: Record<string, any>
): Promise<string> {
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      originalName: file.name,
      ...metadata,
    },
  });

  return getDownloadURL(storageRef);
}

export async function uploadImage(
  file: File,
  folder: string = "images"
): Promise<string> {
  try {
    validateFile(file, MAX_FILE_SIZE_MB, ALLOWED_IMAGE_TYPES);

    const fileExt = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

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
