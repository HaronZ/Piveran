"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteDialog } from "@/components/delete-dialog";
import { ImagePlus, VideoIcon, Loader2, Trash2, Images, Video as VideoLucide } from "lucide-react";
import { toast } from "sonner";
import { uploadMedia, validateFile, MEDIA_FOLDERS } from "@/lib/supabase/storage";
import {
  addChecklistPhoto, deleteChecklistPhoto,
  addChecklistVideo, deleteChecklistVideo,
} from "@/lib/actions/checklists";
import type { ChecklistMedia } from "@/lib/db/queries/checklists";

interface Props {
  checklistId: string;
  photos: ChecklistMedia[];
  videos: ChecklistMedia[];
}

export function ChecklistMediaSection({ checklistId, photos, videos }: Props) {
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [photoComment, setPhotoComment] = useState("");
  const [videoComment, setVideoComment] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);

  const photoToDelete = photos.find((p) => p.id === deletePhotoId) ?? null;
  const videoToDelete = videos.find((v) => v.id === deleteVideoId) ?? null;

  async function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file, "image");
    if (err) { toast.error(err); e.target.value = ""; return; }

    setUploadingPhoto(true);
    try {
      const { publicUrl } = await uploadMedia(file, MEDIA_FOLDERS.checklists, checklistId, "image");
      const result = await addChecklistPhoto(checklistId, publicUrl, photoComment || null);
      if (result.error) toast.error(result.error);
      else { toast.success("Photo uploaded"); setPhotoComment(""); }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  }

  async function onVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file, "video");
    if (err) { toast.error(err); e.target.value = ""; return; }

    setUploadingVideo(true);
    try {
      const { publicUrl } = await uploadMedia(file, MEDIA_FOLDERS.checklists, checklistId, "video");
      const result = await addChecklistVideo(checklistId, publicUrl, videoComment || null);
      if (result.error) toast.error(result.error);
      else { toast.success("Video uploaded"); setVideoComment(""); }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingVideo(false);
      e.target.value = "";
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Photos */}
      <Card className="border-border/40 bg-card/60 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Images className="h-4 w-4 text-violet-500" />
            Photos
            <Badge variant="secondary" className="bg-violet-500/10 text-violet-500 border-violet-500/20 text-[10px]">
              {photos.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={photoComment} onChange={(e) => setPhotoComment(e.target.value)} placeholder="Optional comment" disabled={uploadingPhoto} className="flex-1" />
            <input ref={photoRef} type="file" accept="image/*" hidden onChange={onPhotoChange} />
            <Button onClick={() => photoRef.current?.click()} disabled={uploadingPhoto}>
              {uploadingPhoto ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading...</> : <><ImagePlus className="h-4 w-4 mr-2" />Upload</>}
            </Button>
          </div>

          {photos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No photos uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="group relative aspect-square rounded-lg overflow-hidden border border-border/40 bg-muted">
                  <Image
                    src={photo.url}
                    alt={photo.comment || "Checklist photo"}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                  {photo.comment && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-xs text-white truncate">{photo.comment}</p>
                    </div>
                  )}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => setDeletePhotoId(photo.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Videos */}
      <Card className="border-border/40 bg-card/60 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <VideoLucide className="h-4 w-4 text-rose-500" />
            Videos
            <Badge variant="secondary" className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[10px]">
              {videos.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={videoComment} onChange={(e) => setVideoComment(e.target.value)} placeholder="Optional comment" disabled={uploadingVideo} className="flex-1" />
            <input ref={videoRef} type="file" accept="video/*" hidden onChange={onVideoChange} />
            <Button onClick={() => videoRef.current?.click()} disabled={uploadingVideo}>
              {uploadingVideo ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading...</> : <><VideoIcon className="h-4 w-4 mr-2" />Upload</>}
            </Button>
          </div>

          {videos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No videos uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {videos.map((video) => (
                <div key={video.id} className="group relative rounded-lg overflow-hidden border border-border/40 bg-muted">
                  <video src={video.url} controls className="w-full aspect-video object-cover" />
                  {video.comment && (
                    <div className="p-2 border-t border-border/40 bg-card/60">
                      <p className="text-xs text-muted-foreground truncate">{video.comment}</p>
                    </div>
                  )}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => setDeleteVideoId(video.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {photoToDelete && (
        <DeleteDialog
          open={deletePhotoId !== null}
          onOpenChange={(o) => !o && setDeletePhotoId(null)}
          title="Delete photo?"
          description="This will permanently remove the photo."
          onConfirm={async () => {
            const res = await deleteChecklistPhoto(photoToDelete.id, checklistId, photoToDelete.url);
            if (res.error) throw new Error(res.error);
          }}
        />
      )}
      {videoToDelete && (
        <DeleteDialog
          open={deleteVideoId !== null}
          onOpenChange={(o) => !o && setDeleteVideoId(null)}
          title="Delete video?"
          description="This will permanently remove the video."
          onConfirm={async () => {
            const res = await deleteChecklistVideo(videoToDelete.id, checklistId, videoToDelete.url);
            if (res.error) throw new Error(res.error);
          }}
        />
      )}
    </div>
  );
}
