import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";

interface ConfigItem { key: string; value: string; description?: string | null }
interface FlagItem { key: string; enabled: boolean; description?: string | null }

const AdminConfig: React.FC = () => {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [flags, setFlags] = useState<FlagItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: cfg } = await supabase.from("config").select("key,value,description");
      const { data: ff } = await supabase.from("feature_flags").select("key,enabled,description");
      setConfigs((cfg ?? []).map((c: any) => ({ key: c.key, value: JSON.stringify(c.value), description: c.description })));
      setFlags((ff ?? []).map((f: any) => ({ key: f.key, enabled: !!f.enabled, description: f.description })));
    })();
  }, []);

  async function saveAll() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Upsert configs
      const upConfigs = configs.map((c) => ({ key: c.key, value: JSON.parse(c.value || "{}") }));
      if (upConfigs.length) {
        const { error } = await supabase.from("config").upsert(upConfigs, { onConflict: "key" });
        if (error) throw error;
      }
      // Upsert flags
      if (flags.length) {
        const { error } = await supabase.from("feature_flags").upsert(flags, { onConflict: "key" });
        if (error) throw error;
      }
      setSuccess("Saved configuration");
    } catch (e: any) {
      setError(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function addConfig() {
    setConfigs([...configs, { key: "", value: "{}" }]);
  }
  function addFlag() {
    setFlags([...flags, { key: "", enabled: false }]);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Configuration</h1>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Configs</h2>
              <Button variant="outline" onClick={addConfig}>Add</Button>
            </div>
            <div className="space-y-4">
              {configs.map((c, idx) => (
                <div key={idx} className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Key</Label>
                    <Input value={c.key} onChange={(e) => {
                      const next = [...configs];
                      next[idx] = { ...c, key: e.target.value };
                      setConfigs(next);
                    }} />
                  </div>
                  <div className="space-y-2">
                    <Label>Value (JSON)</Label>
                    <Input value={c.value} onChange={(e) => {
                      const next = [...configs];
                      next[idx] = { ...c, value: e.target.value };
                      setConfigs(next);
                    }} />
                  </div>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Feature Flags</h2>
              <Button variant="outline" onClick={addFlag}>Add</Button>
            </div>
            <div className="space-y-4">
              {flags.map((f, idx) => (
                <div key={idx} className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Key</Label>
                    <Input value={f.key} onChange={(e) => {
                      const next = [...flags];
                      next[idx] = { ...f, key: e.target.value };
                      setFlags(next);
                    }} />
                  </div>
                  <div className="space-y-2">
                    <Label>Enabled</Label>
                    <Input type="checkbox" checked={f.enabled} onChange={(e) => {
                      const next = [...flags];
                      next[idx] = { ...f, enabled: e.currentTarget.checked };
                      setFlags(next);
                    }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={saveAll} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              {error && <div className="text-red-600 self-center">{error}</div>}
              {success && <div className="text-green-700 self-center">{success}</div>}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminConfig;

