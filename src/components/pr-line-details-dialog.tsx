"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DeleteDialog } from "@/components/delete-dialog";
import { ImagePlus, Loader2, Trash2, Images, MessageSquare, Send, Package } from "lucide-react";
import { toast } from "sonner";
import { uploadMedia, validateFile, MEDIA_FOLDERS } from "@/lib/supabase/storage";
import {
  addPrLinePhoto, deletePrLinePhoto,
  addPrLineComment, deletePrLineComment,
} from "@/lib/actions/purchase-requests";
import type {
  PrLineRow, PrLinePhotoRow, PrLineCommentRow,
} from "@/lib/db/queries/purchase-requests";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  prId: string;
  line: PrLineRow;
  photos: PrLinePhotoRow[];
  comments: PrLineCommentRow[];
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

type SubTab = "photos" | "comments";

export function PrLineDetailsDialog({
  open, onOpenChange, prId, line, photos, comments,
}: Props) {
  const [subTab, setSubTab] = useState<SubTab>("photos");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] border-border/40 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-400" />
            {line.partName || "Line Item"}
            {line.partNumber && (
              <span className="text-xs text-muted-foreground font-mono">({line.partNumber})</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 border-b border-border/40">
          <button
            type="button"
            onClick={() => setSubTab("photos")}
            className={`px-3 py-2 text-sm flex items-center gap-1.5 border-b-2 transition-colors ${
              subTab === "photos"
                ? "border-violet-500 text-violet-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Images className="h-4 w-4" />
            Photos
            <Badge variant="secondary" className="text-[10px]">{photos.length}</Badge>
          </button>
          <button
            type="button"
            onClick={() => setSubTab("comments")}
            className={`px-3 py-2 text-sm flex items-center gap-1.5 border-b-2 transition-colors ${
              subTab === "comments"
                ? "border-sky-500 text-sky-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Comments
            <Badge variant="secondary" className="text-[10px]">{comments.length}</Badge>
          </button>
        </div>

        <div className="pt-2">
          {subTab === "photos" && (
            <PhotosPanel prId={prId} prLineId={line.id} photos={photos} />
          )}
          {subTab === "comments" && (
            <CommentsPanel prId={prId} prLineId={line.id} comments={comments} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PhotosPanel({
  prId, prLineId, photos,
}: { prId: string; prLineId: string; photos: PrLinePhotoRow[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const toDelete = photos.find((p) => p.id === deleteId) ?? null;

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
      const { publicUrl } = await uploadMedia(file, MEDIA_FOLDERS.prLines, prLineId, "image");
      const result = await addPrLinePhoto(prLineId, prId, publicUrl, caption || null);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Photo uploaded");
        setCaption("");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(photo: PrLinePhotoRow) {
    const result = await deletePrLinePhoto(photo.id, prId, photo.photoUrl);
    if (result.error) throw new Error(result.error);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Optional caption"
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

      {photos.length === 0 ? (
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
                alt={photo.comment || "Line photo"}
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

      {toDelete && (
        <DeleteDialog
          open={deleteId !== null}
          onOpenChange={(o) => !o && setDeleteId(null)}
          title="Delete photo?"
          description="This will permanently remove the photo."
          onConfirm={() => handleDelete(toDelete)}
        />
      )}
    </div>
  );
}

function CommentsPanel({
  prId, prLineId, comments,
}: { prId: string; prLineId: string; comments: PrLineCommentRow[] }) {
  const boundAdd = addPrLineComment.bind(null, prLineId, prId);
  const [state, formAction, isPending] = useActionState(boundAdd, {});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const toDelete = comments.find((c) => c.id === deleteId) ?? null;

  useEffect(() => {
    if (state?.success) {
      toast.success("Comment added");
      formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  async function handleDelete(id: string) {
    const result = await deletePrLineComment(id, prId);
    if (result.error) throw new Error(result.error);
  }

  return (
    <div className="space-y-3">
      <form ref={formRef} action={formAction} className="flex gap-2">
        <Textarea
          name="comment"
          placeholder="Write a comment..."
          required
          className="flex-1 border-border/40 bg-card/60 min-h-[60px]"
        />
        <Button
          type="submit"
          disabled={isPending}
          className="self-end bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No comments yet.</p>
      ) : (
        <div className="space-y-2">
          {comments.map((c) => (
            <div
              key={c.id}
              className="group rounded-lg border border-border/40 bg-card/40 p-3 hover:bg-purple-500/5 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-muted-foreground">{fmtDate(c.createdAt)}</div>
                  <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap break-words">
                    {c.comment}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-500 hover:bg-red-500/10"
                  onClick={() => setDeleteId(c.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {toDelete && (
        <DeleteDialog
          open={deleteId !== null}
          onOpenChange={(o) => !o && setDeleteId(null)}
          title="Delete comment?"
          description="This will permanently remove the comment."
          onConfirm={() => handleDelete(toDelete.id)}
        />
      )}
    </div>
  );
}
