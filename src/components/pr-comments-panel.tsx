"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DeleteDialog } from "@/components/delete-dialog";
import { Loader2, Trash2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { addPrComment, deletePrComment } from "@/lib/actions/purchase-requests";
import type { PrCommentRow } from "@/lib/db/queries/purchase-requests";

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

interface Props {
  prId: string;
  comments: PrCommentRow[];
}

export function PrCommentsPanel({ prId, comments }: Props) {
  const boundAdd = addPrComment.bind(null, prId);
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
    const result = await deletePrComment(id, prId);
    if (result.error) throw new Error(result.error);
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md p-4 space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-sky-500" />
        <h2 className="text-sm font-semibold">Comments</h2>
        <Badge variant="secondary" className="text-[10px]">{comments.length}</Badge>
      </div>

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
        <p className="text-sm text-muted-foreground py-4 text-center">No comments yet.</p>
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
