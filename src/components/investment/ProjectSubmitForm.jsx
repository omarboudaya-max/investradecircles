import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, MapPin, AlertCircle, Link2 } from 'lucide-react';
import { STAGE_LABELS, TYPE_LABELS } from '@/lib/investment';

const EMPTY = {
  title: '',
  company_name: '',
  promoter_name: '',
  email: '',
  phone: '',
  city: '',
  sector_id: '',
  project_type: 'GREENFIELD',
  investment_stage: 'READY_FOR_INVESTMENT',
  investment_required: '',
  expected_roi: '',
  jobs_created: '',
  short_description: '',
  description: '',
};

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default function ProjectSubmitForm({ open, onClose, governorate, sector = null, sectors = [] }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        ...EMPTY,
        sector_id: sector?.id || '',
        promoter_name: user?.full_name || '',
        email: user?.email || '',
      });
      setError('');
    }
  }, [open, user, sector]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setValue = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    if (!governorate) return setError('No governorate is linked to this page.');
    if (!form.title.trim()) return setError('Please enter a project title.');
    if (!sector && !form.sector_id) return setError('Please choose a sector.');
    if (!form.investment_required || Number(form.investment_required) <= 0) {
      return setError('Please enter the investment amount required.');
    }

    setError('');
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        short_description: form.short_description.trim(),
        description: form.description.trim(),
        governorate_id: governorate?.id,
        sector_id: sector?.id || form.sector_id,
        city: form.city.trim(),
        project_type: form.project_type,
        investment_stage: form.investment_stage,
        investment_required: Number(form.investment_required),
        company_name: form.company_name.trim(),
        promoter_name: form.promoter_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        project_status: 'SUBMITTED',
        is_verified: false,
        featured: false,
      };
      if (form.expected_roi) payload.expected_roi = Number(form.expected_roi);
      if (form.jobs_created) payload.jobs_created = Number(form.jobs_created);

      await base44.entities.InvestmentProject.create(payload);
      toast({
        title: 'Project submitted',
        description: 'An administrator will review it before it appears on the map.',
      });
      onClose();
    } catch (e) {
      setError(e.message || 'Could not submit the project. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !submitting && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit a project</DialogTitle>
          <DialogDescription>
            {governorate
              ? `This opportunity will be linked to ${governorate.name}${sector ? ` and ${sector.name}` : ''}. It is reviewed by an administrator before it appears on the map.`
              : 'New projects are reviewed by an administrator before they appear on the map.'}
          </DialogDescription>
        </DialogHeader>

        {governorate && (
          <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <MapPin className="w-3.5 h-3.5" /> {governorate.name}, {governorate.region}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Project title *">
              <Input value={form.title} onChange={set('title')} placeholder="e.g. Solar-powered cold storage facility" />
            </Field>
          </div>

          {sector ? (
            <Field label="Sector">
              <div className="flex items-center gap-2 h-9 rounded-md border bg-muted/40 px-3 text-sm">
                <Link2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{sector.name}</span>
              </div>
            </Field>
          ) : (
            <Field label="Sector *">
              <Select value={form.sector_id} onValueChange={setValue('sector_id')}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a sector" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field label="City">
            <Input value={form.city} onChange={set('city')} placeholder="e.g. Sousse" />
          </Field>

          <Field label="Project type">
            <Select value={form.project_type} onValueChange={setValue('project_type')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Project stage">
            <Select value={form.investment_stage} onValueChange={setValue('investment_stage')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STAGE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Investment required (MTND) *">
            <Input type="number" min="0" value={form.investment_required} onChange={set('investment_required')} placeholder="e.g. 12" />
          </Field>

          <Field label="Expected ROI (%)">
            <Input type="number" min="0" value={form.expected_roi} onChange={set('expected_roi')} placeholder="e.g. 14" />
          </Field>

          <Field label="Jobs created">
            <Input type="number" min="0" value={form.jobs_created} onChange={set('jobs_created')} placeholder="e.g. 45" />
          </Field>

          <Field label="Company">
            <Input value={form.company_name} onChange={set('company_name')} placeholder="Promoting company" />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Short summary">
              <Input value={form.short_description} onChange={set('short_description')} placeholder="One line describing the opportunity" />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Full description">
              <Textarea value={form.description} onChange={set('description')} rows={4} placeholder="Describe the project, the market and what the investment will fund" />
            </Field>
          </div>

          <Field label="Contact name">
            <Input value={form.promoter_name} onChange={set('promoter_name')} />
          </Field>

          <Field label="Contact email">
            <Input type="email" value={form.email} onChange={set('email')} />
          </Field>

          <Field label="Contact phone">
            <Input value={form.phone} onChange={set('phone')} />
          </Field>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Submit for approval
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
