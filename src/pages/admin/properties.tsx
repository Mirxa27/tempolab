import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";

interface NewPropertyForm {
  title: string;
  image_url: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  host_name: string;
}

const AdminProperties: React.FC = () => {
  const [form, setForm] = useState<NewPropertyForm>({
    title: "",
    image_url: "",
    location: "",
    bedrooms: 1,
    bathrooms: 1,
    host_name: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function ensureHost(name: string): Promise<string> {
    const { data: existing, error: selErr } = await supabase
      .from("hosts")
      .select("id")
      .eq("name", name)
      .maybeSingle();
    if (selErr) throw selErr;
    if (existing?.id) return existing.id;
    const { data, error } = await supabase
      .from("hosts")
      .insert({ name, rating: 5 })
      .select("id")
      .single();
    if (error) throw error;
    return data!.id as string;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const hostId = await ensureHost(form.host_name || "Unknown Host");
      const { data: prop, error: insErr } = await supabase
        .from("properties")
        .insert({
          title: form.title,
          image_url: form.image_url,
          location: form.location,
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          host_id: hostId,
        })
        .select("id")
        .single();
      if (insErr) throw insErr;
      setSuccess(`Created property ${prop?.id}`);
      setForm({ title: "", image_url: "", location: "", bedrooms: 1, bathrooms: 1, host_name: "" });
    } catch (e: any) {
      setError(e?.message ?? "Failed to create property");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Manage Properties</h1>
        <Card>
          <CardContent className="p-6 space-y-6">
            <h2 className="text-xl font-semibold">Create New Property</h2>
            <Separator />
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bedrooms</Label>
                  <Input type="number" min={0} value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: Number(e.target.value) })} required />
                </div>
                <div className="space-y-2">
                  <Label>Bathrooms</Label>
                  <Input type="number" min={0} value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: Number(e.target.value) })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Host Name</Label>
                <Input value={form.host_name} onChange={(e) => setForm({ ...form, host_name: e.target.value })} required />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Create"}</Button>
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

export default AdminProperties;

