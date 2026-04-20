"use server";

import { db } from "@/lib/db";
import {
  qualityChecklists,
  checklistPhotos,
  checklistVideos,
} from "@/lib/db/schema/garage";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/actions";
import { deleteMediaByUrl } from "@/lib/supabase/storage-server";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export type ChecklistFormState = { success?: boolean; error?: string };

export async function createChecklist(
  _prev: ChecklistFormState,
  formData: FormData
): Promise<ChecklistFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const userId = await requireUserId();
  await db.insert(qualityChecklists).values({
    name: parsed.data.name,
    description: parsed.data.description || null,
    createdBy: userId,
    updatedBy: userId,
  });

  revalidatePath("/dashboard/checklists");
  return { success: true };
}

export async function updateChecklist(
  id: string,
  _prev: ChecklistFormState,
  formData: FormData
): Promise<ChecklistFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const userId = await requireUserId();
  await db
    .update(qualityChecklists)
    .set({
      name: parsed.data.name,
      description: parsed.data.description || null,
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(qualityChecklists.id, id));

  revalidatePath("/dashboard/checklists");
  revalidatePath(`/dashboard/checklists/${id}`);
  return { success: true };
}

export async function deleteChecklist(id: string): Promise<ChecklistFormState> {
  const photos = await db
    .select({ photoUrl: checklistPhotos.photoUrl })
    .from(checklistPhotos)
    .where(eq(checklistPhotos.checklistId, id));
  const videos = await db
    .select({ videoUrl: checklistVideos.videoUrl })
    .from(checklistVideos)
    .where(eq(checklistVideos.checklistId, id));

  await db.delete(qualityChecklists).where(eq(qualityChecklists.id, id));

  const urls = [...photos.map((p) => p.photoUrl), ...videos.map((v) => v.videoUrl)];
  if (urls.length > 0) await deleteMediaByUrl(urls).catch(() => {});

  revalidatePath("/dashboard/checklists");
  return { success: true };
}

// ─── Media ───
export async function addChecklistPhoto(
  checklistId: string,
  photoUrl: string,
  comment: string | null
): Promise<ChecklistFormState> {
  if (!photoUrl) return { error: "Photo URL is required" };
  try {
    const userId = await requireUserId();
    await db.insert(checklistPhotos).values({
      checklistId,
      photoUrl,
      comment: comment?.trim() || null,
      createdBy: userId,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add photo" };
  }
  revalidatePath(`/dashboard/checklists/${checklistId}`);
  revalidatePath("/dashboard/checklists");
  return { success: true };
}

export async function deleteChecklistPhoto(
  id: string,
  checklistId: string,
  photoUrl: string
): Promise<ChecklistFormState> {
  try {
    await db.delete(checklistPhotos).where(eq(checklistPhotos.id, id));
    await deleteMediaByUrl([photoUrl]).catch(() => {});
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete photo" };
  }
  revalidatePath(`/dashboard/checklists/${checklistId}`);
  revalidatePath("/dashboard/checklists");
  return { success: true };
}

export async function addChecklistVideo(
  checklistId: string,
  videoUrl: string,
  comment: string | null
): Promise<ChecklistFormState> {
  if (!videoUrl) return { error: "Video URL is required" };
  try {
    const userId = await requireUserId();
    await db.insert(checklistVideos).values({
      checklistId,
      videoUrl,
      comment: comment?.trim() || null,
      createdBy: userId,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add video" };
  }
  revalidatePath(`/dashboard/checklists/${checklistId}`);
  revalidatePath("/dashboard/checklists");
  return { success: true };
}

export async function deleteChecklistVideo(
  id: string,
  checklistId: string,
  videoUrl: string
): Promise<ChecklistFormState> {
  try {
    await db.delete(checklistVideos).where(eq(checklistVideos.id, id));
    await deleteMediaByUrl([videoUrl]).catch(() => {});
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete video" };
  }
  revalidatePath(`/dashboard/checklists/${checklistId}`);
  revalidatePath("/dashboard/checklists");
  return { success: true };
}
