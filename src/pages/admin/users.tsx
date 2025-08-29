import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";

interface AssignRoleForm { user_id: string; role_name: string }

const AdminUsers: React.FC = () => {
  const [form, setForm] = useState<AssignRoleForm>({ user_id: "", role_name: "admin" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function assignRole(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const { data: role, error: roleErr } = await supabase
        .from("roles").select("id").eq("name", form.role_name).maybeSingle();
      if (roleErr) throw roleErr;
      if (!role?.id) throw new Error("Role not found");
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: form.user_id, role_id: role.id }, { onConflict: "user_id,role_id" });
      if (error) throw error;
      setSuccess("Role assigned");
    } catch (e: any) {
      setError(e?.message ?? "Failed to assign role");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Users & Roles</h1>
        <Card>
          <CardContent className="p-6 space-y-6">
            <h2 className="text-xl font-semibold">Assign Role to User</h2>
            <Separator />
            <form className="space-y-4" onSubmit={assignRole}>
              <div className="space-y-2">
                <Label>User ID (UUID)</Label>
                <Input value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input value={form.role_name} onChange={(e) => setForm({ ...form, role_name: e.target.value })} required />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Assign"}</Button>
                {error && <div className="text-red-600 self-center">{error}</div>}
                {success && <div className="text-green-700 self-center">{success}</div>}
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminUsers;

