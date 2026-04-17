"use client";

import { useState, useMemo, useActionState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, Plus, MoreHorizontal, Pencil, Trash2, Loader2,
  Shield, Users, UserPlus, KeyRound, Eye as EyeIcon,
} from "lucide-react";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/delete-dialog";
import {
  createRole, updateRole, deleteRole,
  assignRole, removeRole,
} from "@/lib/actions/security";
import {
  AVAILABLE_VIEWS,
  AVAILABLE_TABLES,
  ACCESS_METHODS,
  type UserWithRolesRow,
  type RoleWithViewsRow,
  type RoleSelectorRow,
  type AccessMethod,
} from "@/lib/db/queries/security-types";

type Tab = "users" | "roles";

interface SecurityClientProps {
  users: UserWithRolesRow[];
  roles: RoleWithViewsRow[];
  rolesForSelector: RoleSelectorRow[];
}

export function SecurityClient({ users, roles, rolesForSelector }: SecurityClientProps) {
  const [tab, setTab] = useState<Tab>("users");

  const totalUsers = users.length;
  const totalRoles = roles.length;
  const usersWithRoles = users.filter((u) => u.roles.length > 0).length;

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "users", label: "Users", icon: <Users className="h-4 w-4" />, count: totalUsers },
    { key: "roles", label: "Roles", icon: <KeyRound className="h-4 w-4" />, count: totalRoles },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Roles Defined</p>
                <p className="text-2xl font-bold">{totalRoles}</p>
              </div>
              <KeyRound className="h-8 w-8 text-purple-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Users with Roles</p>
                <p className="text-2xl font-bold">{usersWithRoles}</p>
              </div>
              <Shield className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border/40">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? "border-orange-500 text-orange-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">{t.count}</Badge>
          </button>
        ))}
      </div>

      {tab === "users" && <UsersTab users={users} rolesForSelector={rolesForSelector} />}
      {tab === "roles" && <RolesTab roles={roles} />}
    </div>
  );
}

// ═══════════════════════════════════════
//  USERS TAB
// ═══════════════════════════════════════
function UsersTab({
  users,
  rolesForSelector,
}: {
  users: UserWithRolesRow[];
  rolesForSelector: RoleSelectorRow[];
}) {
  const [search, setSearch] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRolesRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.firstName && u.firstName.toLowerCase().includes(q)) ||
        (u.lastName && u.lastName.toLowerCase().includes(q)) ||
        u.roles.some((r) => r.toLowerCase().includes(q))
    );
  }, [users, search]);

  return (
    <div className="space-y-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 border-border/40 bg-card/60 backdrop-blur-md"
        />
      </div>

      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground/20 mb-2" />
                  <p>No users found</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => {
                const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.nickName || "—";
                const initials = name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <TableRow key={u.id} className="border-border/40 hover:bg-orange-500/5 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-xs font-bold text-orange-500">
                          {initials}
                        </div>
                        <span className="font-medium text-sm">{name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length > 0 ? (
                          [...new Set(u.roles)].map((r, idx) => (
                            <Badge key={`${u.id}-${r}-${idx}`} variant="secondary" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20">
                              {r}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No roles</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => { setSelectedUser(u); setAssignOpen(true); }}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {selectedUser && (
        <AssignRoleDialog
          open={assignOpen}
          onOpenChange={(o) => { if (!o) { setAssignOpen(false); setSelectedUser(null); } }}
          user={selectedUser}
          allRoles={rolesForSelector}
        />
      )}
    </div>
  );
}

function AssignRoleDialog({
  open,
  onOpenChange,
  user,
  allRoles,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user: UserWithRolesRow;
  allRoles: RoleSelectorRow[];
}) {
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [pending, setPending] = useState(false);

  const userName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const assignedRoleNames = user.roles;
  const availableRoles = allRoles.filter((r) => !assignedRoleNames.includes(r.name));

  async function handleAssign() {
    if (!selectedRoleId) return;
    setPending(true);
    const result = await assignRole(user.id, parseInt(selectedRoleId));
    setPending(false);
    if (result.success) {
      toast.success("Role assigned");
      onOpenChange(false);
    } else {
      toast.error(result.error || "Failed");
    }
  }

  async function handleRemove(roleName: string) {
    const role = allRoles.find((r) => r.name === roleName);
    if (!role) return;
    setPending(true);
    const result = await removeRole(user.id, role.id);
    setPending(false);
    if (result.success) {
      toast.success(`Removed "${roleName}"`);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] border-border/40 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-400" />
            Manage Roles — {userName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Current roles */}
          <div className="space-y-1.5">
            <Label className="text-xs">Current Roles</Label>
            <div className="flex flex-wrap gap-2">
              {assignedRoleNames.length > 0 ? (
                [...new Set(assignedRoleNames)].map((r, idx) => (
                  <Badge
                    key={`assign-${r}-${idx}`}
                    variant="secondary"
                    className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/20 gap-1 pr-1"
                  >
                    {r}
                    <button
                      type="button"
                      onClick={() => handleRemove(r)}
                      className="ml-1 h-4 w-4 rounded-full hover:bg-red-500/20 flex items-center justify-center text-red-400"
                      disabled={pending}
                    >
                      ×
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">No roles assigned</span>
              )}
            </div>
          </div>

          {/* Assign new role */}
          {availableRoles.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Assign New Role</Label>
              <div className="flex gap-2">
                <Select value={selectedRoleId} onValueChange={(val) => { if (val) setSelectedRoleId(val); }}>
                  <SelectTrigger className="border-border/40 bg-card/60 flex-1">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="border-border/40 bg-card/95 backdrop-blur-xl">
                    {availableRoles.map((r) => (
                      <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAssign}
                  disabled={!selectedRoleId || pending}
                  size="sm"
                  className="bg-gradient-to-r from-orange-600 to-amber-600"
                >
                  {pending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                  Assign
                </Button>
              </div>
            </div>
          )}

          {availableRoles.length === 0 && assignedRoleNames.length > 0 && (
            <p className="text-xs text-muted-foreground">✅ All available roles are assigned</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════
//  ROLES TAB
// ═══════════════════════════════════════
function RolesTab({ roles }: { roles: RoleWithViewsRow[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<RoleWithViewsRow | null>(null);
  const [delItem, setDelItem] = useState<RoleWithViewsRow | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
        >
          <Plus className="h-4 w-4 mr-1.5" /> New Role
        </Button>
      </div>

      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead>Role</TableHead>
              <TableHead className="hidden sm:table-cell">Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-center">Users</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <KeyRound className="h-10 w-10 mx-auto text-muted-foreground/20 mb-2" />
                  <p>No roles defined</p>
                  <Button size="sm" variant="outline" onClick={() => setAddOpen(true)} className="mt-2">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Create your first role
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              roles.map((r) => (
                <TableRow key={r.id} className="border-border/40 hover:bg-orange-500/5 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 shrink-0">
                        <Shield className="h-4 w-4 text-purple-400" />
                      </div>
                      <span className="font-medium text-sm">{r.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    <span className="line-clamp-1">{r.description || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap gap-1">
                        {r.views.length > 0 ? (
                          <>
                            {r.views.slice(0, 3).map((v) => (
                              <Badge key={v} variant="secondary" className="text-[10px]">
                                {AVAILABLE_VIEWS.find((av) => av.value === v)?.label || v}
                              </Badge>
                            ))}
                            {r.views.length > 3 && (
                              <Badge variant="secondary" className="text-[10px]">+{r.views.length - 3}</Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">No pages</span>
                        )}
                      </div>
                      {r.tables.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20 self-start">
                          {r.tables.length} table{r.tables.length === 1 ? "" : "s"}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="text-[10px] px-1.5">
                      {r.userCount}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-border/40 bg-card/95 backdrop-blur-xl">
                        <DropdownMenuItem onClick={() => setEditItem(r)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDelItem(r)}
                          className="text-red-500 focus:text-red-500"
                          disabled={r.userCount > 0}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {r.userCount > 0 ? "In use" : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RoleDialog open={addOpen} onOpenChange={setAddOpen} />
      {editItem && (
        <RoleDialog
          open={!!editItem}
          onOpenChange={(o) => { if (!o) setEditItem(null); }}
          item={editItem}
        />
      )}
      {delItem && (
        <DeleteDialog
          open={!!delItem}
          onOpenChange={(o) => { if (!o) setDelItem(null); }}
          title="Delete Role"
          description={`Are you sure you want to delete role "${delItem.name}"? This cannot be undone.`}
          onConfirm={async () => { await deleteRole(delItem.id); }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════
//  ROLE DIALOG (Add / Edit with Checkboxes)
// ═══════════════════════════════════════
function RoleDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  item?: RoleWithViewsRow;
}) {
  const isEdit = !!item;
  const [checkedViews, setCheckedViews] = useState<Set<string>>(new Set(item?.views || []));
  const [tablePerms, setTablePerms] = useState<Record<string, AccessMethod | "none">>(() => {
    const initial: Record<string, AccessMethod | "none"> = {};
    for (const t of AVAILABLE_TABLES) initial[t.value] = "none";
    for (const p of item?.tables || []) {
      if (p.accessMethod) initial[p.tableName] = p.accessMethod;
    }
    return initial;
  });
  const setTableAccess = (tableName: string, access: AccessMethod | "none") =>
    setTablePerms((prev) => ({ ...prev, [tableName]: access }));

  const boundAction = item
    ? updateRole.bind(null, item.id)
    : createRole;
  const [state, formAction, isPending] = useActionState(boundAction, {});

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Role updated" : "Role created");
      onOpenChange(false);
    }
  }, [state?.success, onOpenChange, isEdit]);

  function toggleView(view: string) {
    setCheckedViews((prev) => {
      const next = new Set(prev);
      if (next.has(view)) next.delete(view);
      else next.add(view);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        key={`role-${item?.id || "new"}`}
        className="sm:max-w-[480px] border-border/40 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-purple-400" />
            {isEdit ? "Edit Role" : "New Role"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4 mt-2">
          {state?.error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-500">
              {state.error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="role-name" className="text-xs">
              Role Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="role-name"
              name="name"
              defaultValue={item?.name || ""}
              required
              className="border-border/40 bg-card/60"
              placeholder="e.g. Admin, Manager, Cashier..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role-desc" className="text-xs">Description</Label>
            <Textarea
              id="role-desc"
              name="description"
              defaultValue={item?.description || ""}
              className="border-border/40 bg-card/60 min-h-[50px]"
              placeholder="What can this role do?"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Page Permissions</Label>
            <p className="text-[10px] text-muted-foreground">
              Select which pages users with this role can access
            </p>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/40 bg-card/60 p-3">
              {AVAILABLE_VIEWS.map((view) => (
                <label
                  key={view.value}
                  className="flex items-center gap-2 cursor-pointer hover:bg-orange-500/5 rounded px-2 py-1.5 transition-colors"
                >
                  <input
                    type="checkbox"
                    name={`view_${view.value}`}
                    checked={checkedViews.has(view.value)}
                    onChange={() => toggleView(view.value)}
                    className="rounded border-border/40 text-orange-500 focus:ring-orange-500/20 h-4 w-4"
                  />
                  <span className="text-xs">{view.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-[10px] h-6"
                onClick={() => setCheckedViews(new Set(AVAILABLE_VIEWS.map((v) => v.value)))}
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-[10px] h-6"
                onClick={() => setCheckedViews(new Set())}
              >
                Clear All
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Table Permissions</Label>
            <p className="text-[10px] text-muted-foreground">
              Grant this role access to specific database tables
            </p>
            <div className="max-h-[260px] overflow-y-auto rounded-lg border border-border/40 bg-card/60 p-3 space-y-1.5">
              {AVAILABLE_TABLES.map((t) => {
                const current = tablePerms[t.value] ?? "none";
                return (
                  <div key={t.value} className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono">{t.label}</span>
                    <select
                      name={`table_${t.value}`}
                      value={current}
                      onChange={(e) => setTableAccess(t.value, e.target.value as AccessMethod | "none")}
                      className="h-7 rounded-md border border-border/40 bg-card/80 px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                    >
                      <option value="none">None</option>
                      {ACCESS_METHODS.map((a) => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-[10px] h-6"
                onClick={() => {
                  const next: Record<string, AccessMethod | "none"> = {};
                  for (const t of AVAILABLE_TABLES) next[t.value] = "read";
                  setTablePerms(next);
                }}
              >
                All Read
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-[10px] h-6"
                onClick={() => {
                  const next: Record<string, AccessMethod | "none"> = {};
                  for (const t of AVAILABLE_TABLES) next[t.value] = "none";
                  setTablePerms(next);
                }}
              >
                Clear All
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Role"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
