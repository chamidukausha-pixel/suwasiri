import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { getFirebaseApp, getFirebaseAuth, isFirebaseConfigured } from "../firebase";

async function fileToCompressedJpeg(file: File, maxPx = 512, quality = 0.72): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read that image.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Could not compress that image.");
  return blob;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Could not read image"));
    reader.readAsDataURL(blob);
  });
}

/** Compress a clinic/doctor picture. Prefer Firebase Storage; fall back to a small JPEG data URL. */
export async function uploadClinicImage(storagePath: string, file: File): Promise<string> {
  const blob = await fileToCompressedJpeg(file);
  if (isFirebaseConfigured()) {
    try {
      if (getFirebaseAuth().currentUser) {
        const storage = getStorage(getFirebaseApp());
        const r = ref(storage, storagePath);
        await uploadBytes(r, blob, { contentType: "image/jpeg" });
        return await getDownloadURL(r);
      }
    } catch (err) {
      console.warn("Clinic image storage upload failed, embedding image:", err);
    }
  }
  return blobToDataUrl(blob);
}

export async function promoteClinicImage(dataUrl: string, storagePath: string): Promise<string> {
  if (!dataUrl?.startsWith("data:") || !isFirebaseConfigured()) return dataUrl;
  try {
    if (!getFirebaseAuth().currentUser) return dataUrl;
    const blob = await (await fetch(dataUrl)).blob();
    const storage = getStorage(getFirebaseApp());
    const r = ref(storage, storagePath);
    await uploadBytes(r, blob, { contentType: blob.type || "image/jpeg" });
    return await getDownloadURL(r);
  } catch {
    return dataUrl;
  }
}

export async function deleteClinicImage(storagePath: string): Promise<void> {
  if (!isFirebaseConfigured() || !getFirebaseAuth().currentUser) return;
  try {
    await deleteObject(ref(getStorage(getFirebaseApp()), storagePath));
  } catch {
    /* ignore missing object */
  }
}
