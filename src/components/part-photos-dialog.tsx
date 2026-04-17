"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DeleteDialog } from "@/components/delete-dialog";
import { ImagePlus, Loader2, Trash2, Images, Package } from "lucide-react";
import { toast } from "sonner";
import { uploadMedia, validateFile, MEDIA_FOLDERS } from "@/lib/supabase/storage";
import { addPartPhoto, deletePartPhoto, listPartPhotos } from "@/lib/actions/parts";
import type { PartPhotoRow } from "@/lib/db/queries/parts";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  partId: string;
  partName: string;
  partNumber?: string | null;
}

export function PartPhotosDialog({ open, onOpenChange, partId, partName, partNumber }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PartPhotoRow[] | null>(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const toDelete = photos?.find((p) => p.id === deleteId) ?? null;

  const refresh = async () => {
    const rows = await listPartPhotos(partId);
    setPhotos(rows);
  };

  useEffect(() => {
    if (open) {
      setPhotos(null);
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, partId]);

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
      const { publicUrl } = await uploadMedia(file, MEDIA_FOLDERS.parts, partId, "image");
      const result = await addPartPhoto(partId, publicUrl, notes || null);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Photo uploaded");
        setNotes("");
        refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(photo: PartPhotoRow) {
    const result = await deletePartPhoto(photo.id, photo.photoUrl);
    if (result.error) throw new Error(result.error);
    refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] border-border/40 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-400" />
            {partName}
            {partNumber && (
              <span className="text-xs text-muted-foreground font-mono">({partNumber})</span>
            )}
            <Badge variant="secondary" className="ml-auto text-[10px] flex items-center gap-1">
              <Images className="h-3 w-3" />
              {photos?.length ?? 0}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional note (e.g. brand variant, condition)"
              disabled={uploading}
              className="flex-1"
            />
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFileChange} />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="sm:w-auto">
              {uploading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading...</>
              ) : (
                <><ImagePlus className="h-4 w-4 mr-2" />Upload</>
              )}
            </Button>
          </div>

          {photos === null ? (
            <div className="py-10 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : photos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No photos uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-border/40 bg-muted"
                >
                  <Image
                    src={photo.photoUrl}
                    alt={photo.notes || "Part photo"}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                  {photo.notes && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-xs text-white truncate">{photo.notes}</p>
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
        </div>

        {toDelete && (
          <DeleteDialog
            open={deleteId !== null}
            onOpenChange={(o) => !o && setDeleteId(null)}
            title="Delete photo?"
            description="This will permanently remove the photo."
            onConfirm={() => handleDelete(toDelete)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
