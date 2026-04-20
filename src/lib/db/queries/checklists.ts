import { db } from "@/lib/db";
import {
  qualityChecklists,
  checklistPhotos,
  checklistVideos,
  laborTypeChecklists,
} from "@/lib/db/schema/garage";
import { eq, sql, asc, desc } from "drizzle-orm";

export type ChecklistRow = {
  id: string;
  name: string;
  description: string | null;
  photosCount: number;
  videosCount: number;
  laborTypesCount: number;
  createdAt: string | null;
};

export async function getChecklists(): Promise<ChecklistRow[]> {
  const rows = await db
    .select({
      id: qualityChecklists.id,
      name: qualityChecklists.name,
      description: qualityChecklists.description,
      photosCount: sql<number>`(select count(*) from ${checklistPhotos} where ${checklistPhotos.checklistId} = ${qualityChecklists.id})`.as("photos_count"),
      videosCount: sql<number>`(select count(*) from ${checklistVideos} where ${checklistVideos.checklistId} = ${qualityChecklists.id})`.as("videos_count"),
      laborTypesCount: sql<number>`(select count(*) from ${laborTypeChecklists} where ${laborTypeChecklists.checklistId} = ${qualityChecklists.id})`.as("labor_types_count"),
      createdAt: sql<string>`${qualityChecklists.createdAt}`.as("created_at"),
    })
    .from(qualityChecklists)
    .orderBy(asc(qualityChecklists.name));

  return rows.map((r) => ({
    ...r,
    photosCount: Number(r.photosCount),
    videosCount: Number(r.videosCount),
    laborTypesCount: Number(r.laborTypesCount),
  }));
}

export type ChecklistMedia = {
  id: string;
  url: string;
  comment: string | null;
  createdAt: string | null;
};

export type ChecklistDetail = {
  id: string;
  name: string;
  description: string | null;
  photos: ChecklistMedia[];
  videos: ChecklistMedia[];
};

export async function getChecklistDetail(id: string): Promise<ChecklistDetail | null> {
  const [row] = await db
    .select({
      id: qualityChecklists.id,
      name: qualityChecklists.name,
      description: qualityChecklists.description,
    })
    .from(qualityChecklists)
    .where(eq(qualityChecklists.id, id))
    .limit(1);

  if (!row) return null;

  const photos = await db
    .select({
      id: checklistPhotos.id,
      url: checklistPhotos.photoUrl,
      comment: checklistPhotos.comment,
      createdAt: sql<string>`${checklistPhotos.createdAt}`.as("created_at"),
    })
    .from(checklistPhotos)
    .where(eq(checklistPhotos.checklistId, id))
    .orderBy(desc(checklistPhotos.createdAt));

  const videos = await db
    .select({
      id: checklistVideos.id,
      url: checklistVideos.videoUrl,
      comment: checklistVideos.comment,
      createdAt: sql<string>`${checklistVideos.createdAt}`.as("created_at"),
    })
    .from(checklistVideos)
    .where(eq(checklistVideos.checklistId, id))
    .orderBy(desc(checklistVideos.createdAt));

  return { ...row, photos, videos };
}

export type ChecklistSelectorRow = { id: string; name: string };

export async function getChecklistsForSelector(): Promise<ChecklistSelectorRow[]> {
  return db
    .select({ id: qualityChecklists.id, name: qualityChecklists.name })
    .from(qualityChecklists)
    .orderBy(asc(qualityChecklists.name));
}
