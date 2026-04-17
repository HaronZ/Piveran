"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteDialog } from "@/components/delete-dialog";
import { Loader2, MessageSquare, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addJoComment, deleteJoComment } from "@/lib/actions/jo-detail";
import type { JoCommentRow } from "@/lib/db/queries/jo-detail";

interface Props {
  joId: string;
  comments: JoCommentRow[];
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function JoCommentsSection({ joId, comments }: Props) {
  const boundAdd = addJoComment.bind(null, joId);
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
    const result = await deleteJoComment(id, joId);
    if (result.error) throw new Error(result.error);
  }

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-sky-500" />
          Comments
          <Badge
            variant="secondary"
            className="bg-sky-500/10 text-sky-500 border-sky-500/20 text-[10px]"
          >
            {comments.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form ref={formRef} action={formAction} className="space-y-2">
          <Input
            name="commentFrom"
            placeholder="From (optional — e.g. customer, staff)"
            className="border-border/40 bg-card/60"
          />
          <div className="flex gap-2">
            <Textarea
              name="comment"
              placeholder="Write a comment..."
              required
              className="flex-1 border-border/40 bg-card/60 min-h-[60px]"
            />
            <Button
              type="submit"
              disabled={isPending}
              className="self-end bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>

        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No comments yet.
          </p>
        ) : (
          <div className="space-y-2">
            {comments.map((c) => (
              <div
                key={c.id}
                className="group rounded-lg border border-border/40 bg-card/40 p-3 hover:bg-orange-500/5 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-xs font-medium text-foreground">
                        {c.commentFrom || "Staff"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {fmtDate(c.createdAt)}
                      </span>
                    </div>
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
      </CardContent>
    </Card>
  );
}
