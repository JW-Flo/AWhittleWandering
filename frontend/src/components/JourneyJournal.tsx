import React, { useState, useEffect, useCallback } from 'react';
import { Plus, MapPin, Calendar, Edit3, Trash2, Brain, Zap, TrendingUp, Battery, MessageSquare, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api-config';

const JOURNEY_ID = 'continental-usa-2025';
const TOKEN_KEY = 'aww_auth_token';

interface JournalEntry {
  id: number;
  title: string;
  content: string;
  location: string | null;
  mood: string;
  entry_type: string;
  auto_generated: number;
  created_at: string;
}

const getIcon = (entry: JournalEntry) => {
  if (entry.entry_type === 'charging_started' || entry.entry_type === 'charging_completed') return <Zap className="h-4 w-4 text-yellow-500" />;
  if (entry.entry_type === 'location_change') return <MapPin className="h-4 w-4 text-blue-500" />;
  if (entry.entry_type === 'efficiency_milestone') return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (entry.auto_generated) return <Brain className="h-4 w-4 text-purple-500" />;
  return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
};

export default function JourneyJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', location: '' });

  const authHeader = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch(`${api.baseUrl}/api/v1/journal/${JOURNEY_ID}`);
      const data = await res.json() as { ok: boolean; entries?: JournalEntry[] };
      if (data.ok) setEntries(data.entries ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${api.baseUrl}/api/v1/journal/${JOURNEY_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ title: form.title, content: form.content, location: form.location || undefined }),
      });
      if (res.ok) {
        setForm({ title: '', content: '', location: '' });
        setIsAdding(false);
        await fetchEntries();
      }
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${api.baseUrl}/api/v1/journal/${JOURNEY_ID}/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch { /* silent */ }
  };

  const quickTemplates = ['Charging stop', 'Scenic view', 'Food break', 'Rest stop', 'Milestone reached', 'State crossed'];

  return (
    <Card className="h-[520px] flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Edit3 className="w-4 h-4" />
            Journey Journal
          </CardTitle>
          <Button size="sm" onClick={() => setIsAdding(true)} className="gap-1.5 h-7 text-xs" disabled={isAdding}>
            <Plus className="w-3 h-3" />
            Add Entry
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
        {isAdding && (
          <div className="p-4 border-b bg-muted/30 flex-shrink-0">
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <Input
                placeholder="Entry title…"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                autoFocus
                className="text-sm"
              />
              <Textarea
                placeholder="What happened on your journey?"
                value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                rows={3}
                className="resize-none text-sm"
              />
              <Input
                placeholder="Location (optional)"
                value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1 gap-1" disabled={saving}>
                  {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                  Save
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Edit3 className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No journal entries yet.</p>
              <p className="text-xs mt-1">Add your first entry to document the journey.</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {entries.map(entry => (
                <div key={entry.id} className="border rounded-lg p-3.5 bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {getIcon(entry)}
                      <span className="font-medium text-sm truncate">{entry.title}</span>
                      {!!entry.auto_generated && (
                        <Badge variant="secondary" className="text-xs h-4 px-1"><Brain className="w-2.5 h-2.5 mr-0.5" />AI</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost" size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{entry.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    {entry.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{entry.location}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t bg-muted/20 flex-shrink-0">
          <p className="text-xs text-muted-foreground mb-1.5">Quick templates:</p>
          <div className="flex flex-wrap gap-1">
            {quickTemplates.map(t => (
              <Button key={t} variant="outline" size="sm" className="h-6 px-2 text-xs"
                onClick={() => { setForm(p => ({ ...p, title: t })); setIsAdding(true); }}>
                {t}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
