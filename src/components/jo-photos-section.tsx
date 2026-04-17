"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteDialog } from "@/components/delete-dialog";
import { ImagePlus, Loader2, Trash2, Images } from "lucide-react";
import { toast } from "sonner";
import { uploadMedia, validateFile, MEDIA_FOLDERS } from "@/lib/supabase/storage";
import { addJoPhoto, deleteJoPhoto } from "@/lib/actions/jo-detail";
import type { JoPhotoRow } from "@/lib/db/queries/jo-detail";

interface Props {
  joId: string;
  photos: JoPhotoRow[];
}

export function JoPhotosSection({ joId, photos }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const photoToDelete = photos.find((p) => p.id === deleteId) ?? null;

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, "image");
    if (validation) {
      toast.error(validation);
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const { publicUrl } = await uploadMedia(file, MEDIA_FOLDERS.jobs, joId, "image");
      const result = await addJoPhoto(joId, publicUrl, comment || null);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Photo uploaded");
        setComment("");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(photo: JoPhotoRow) {
    const result = await deleteJoPhoto(photo.id, joId, photo.photoUrl);
    if (result.error) throw new Error(result.error);
  }

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Images className="h-4 w-4 text-violet-500" />
          Photos
          <Badge
            variant="secondary"
            className="bg-violet-500/10 text-violet-500 border-violet-500/20 text-[10px]"
          >
            {photos.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional caption"
            disabled={uploading}
            className="flex-1"
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onFileChange}
          />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="sm:w-auto"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </div>

        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No photos uploaded yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square rounded-lg overflow-hidden border border-border/40 bg-muted"
              >
                <Image
                  src={photo.photoUrl}
                  alt={photo.comment || "Job order photo"}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  className="object-cover"
                  unoptimized
                />
                {photo.comment && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-xs text-white truncate">{photo.comment}</p>
                  </div>
                )}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-7 w-7"
                    onClick={() => setDeleteId(photo.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {photoToDelete && (
          <DeleteDialog
            open={deleteId !== null}
            onOpenChange={(o) => !o && setDeleteId(null)}
            title="Delete photo?"
            description="This will permanently remove the photo."
            onConfirm={() => handleDelete(photoToDelete)}
          />
        )}
      </CardContent>
    </Card>
  );
}
