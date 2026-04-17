import { createClient as createBrowserSupabase } from "@/lib/supabase/client";

export const BUCKET = "sir-keith-media";

export const MEDIA_FOLDERS = {
  parts: "parts",
  cars: "cars",
  customers: "customers",
  jobs: "jobs",
  joMaterials: "jo-materials",
  joLabors: "jo-labors",
  prLines: "pr-lines",
  checklists: "checklists",
} as const;

export type MediaFolder = (typeof MEDIA_FOLDERS)[keyof typeof MEDIA_FOLDERS];

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
]);

const VIDEO_MIMES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export type UploadKind = "image" | "video";

export function validateFile(file: File, kind: UploadKind): string | null {
  if (kind === "image") {
    if (!IMAGE_MIMES.has(file.type)) return "Unsupported image type";
    if (file.size > MAX_IMAGE_BYTES) return "Image must be under 10 MB";
  } else {
    if (!VIDEO_MIMES.has(file.type)) return "Unsupported video type";
    if (file.size > MAX_VIDEO_BYTES) return "Video must be under 50 MB";
  }
  return null;
}

function extensionFor(file: File): string {
  const byName = file.name.split(".").pop();
  if (byName && byName.length <= 5) return byName.toLowerCase();
  const byMime = file.type.split("/")[1];
  return byMime || "bin";
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export type UploadResult = { path: string; publicUrl: string };

export async function uploadMedia(
  file: File,
  folder: MediaFolder,
  entityId: string,
  kind: UploadKind = "image"
): Promise<UploadResult> {
  const validation = validateFile(file, kind);
  if (validation) throw new Error(validation);

  const supabase = createBrowserSupabase();
  const path = `${folder}/${entityId}/${randomId()}.${extensionFor(file)}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export function pathFromPublicUrl(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}
