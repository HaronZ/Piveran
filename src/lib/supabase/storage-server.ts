import "server-only";
import { createClient } from "@/lib/supabase/server";
import { BUCKET, pathFromPublicUrl } from "@/lib/supabase/storage";

export async function deleteMediaByPath(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw new Error(error.message);
}

export async function deleteMediaByUrl(urls: string[]): Promise<void> {
  const paths = urls.map(pathFromPublicUrl).filter((p): p is string => !!p);
  await deleteMediaByPath(paths);
}
