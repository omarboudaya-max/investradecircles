import React, { useEffect, useState, useRef } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, MapPin, AlertCircle, Link2, Sparkles, Image as ImageIcon, Upload, X, Check } from 'lucide-react';
import { STAGE_LABELS, TYPE_LABELS } from '@/lib/investment';

const EMPTY = {
  title: '',
  company_name: '',
  promoter_name: '',
  email: '',
  phone: '',
  city: '',
  governorate_id: '',
  sector_id: '',
  project_type: 'GREENFIELD',
  investment_stage: 'READY_FOR_INVESTMENT',
  investment_required: '',
  expected_roi: '',
  jobs_created: '',
  short_description: '',
  description: '',
  image_url: '',
};

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default function ProjectSubmitForm({
  open,
  onClose,
  governorate = null,
  governorates: passedGovernorates = [],
  sector = null,
  sectors: passedSectors = [],
  projectToEdit = null,
  onSaved = null,
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Self-load governorates and sectors if not supplied by parent
  const { data: fetchedGovernorates = [] } = useQuery({
    queryKey: ['investment-all-govs'],
    queryFn: () => base44.entities.Governorate.list(),
    enabled: passedGovernorates.length === 0 && open,
  });
  const { data: fetchedSectors = [] } = useQuery({
    queryKey: ['investment-all-sectors'],
    queryFn: () => base44.entities.Sector.list(),
    enabled: passedSectors.length === 0 && open,
  });

  const allGovernorates = passedGovernorates.length > 0 ? passedGovernorates : fetchedGovernorates;
  const allSectors = passedSectors.length > 0 ? passedSectors : fetchedSectors;

  const isEditing = !!projectToEdit;

  useEffect(() => {
    if (open) {
      if (projectToEdit) {
        setForm({
          title: projectToEdit.title || '',
          company_name: projectToEdit.company_name || '',
          promoter_name: projectToEdit.promoter_name || '',
          email: projectToEdit.email || '',
          phone: projectToEdit.phone || '',
          city: projectToEdit.city || '',
          governorate_id: projectToEdit.governorate_id || '',
          sector_id: projectToEdit.sector_id || '',
          project_type: projectToEdit.project_type || 'GREENFIELD',
          investment_stage: projectToEdit.investment_stage || 'READY_FOR_INVESTMENT',
          investment_required: projectToEdit.investment_required ? String(projectToEdit.investment_required) : '',
          expected_roi: projectToEdit.expected_roi ? String(projectToEdit.expected_roi) : '',
          jobs_created: projectToEdit.jobs_created ? String(projectToEdit.jobs_created) : '',
          short_description: projectToEdit.short_description || '',
          description: projectToEdit.description || '',
          image_url: projectToEdit.image_url || '',
        });
      } else {
        setForm({
          ...EMPTY,
          governorate_id: governorate?.id || '',
          sector_id: sector?.id || '',
          promoter_name: user?.full_name || '',
          email: user?.email || '',
        });
      }
      setError('');
    }
  }, [open, user, governorate, sector, projectToEdit]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setValue = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Selected image is too large. Please select an image under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX_W = 1200;
        const MAX_H = 800;
        let w = img.width;
        let h = img.height;
        if (w > MAX_W || h > MAX_H) {
          if (w / h > MAX_W / MAX_H) {
            h = Math.round((h * MAX_W) / w);
            w = MAX_W;
          } else {
            w = Math.round((w * MAX_H) / h);
            h = MAX_H;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        setForm((f) => ({ ...f, image_url: compressed }));
      };
      img.onerror = () => {
        setForm((f) => ({ ...f, image_url: reader.result }));
      };
      img.src = reader.result;
    };
    reader.onerror = () => {
      setError('Could not read image file.');
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    const targetGovId = governorate?.id || form.governorate_id;
    if (!targetGovId) return setError('Please choose a governorate for this opportunity.');
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
        short_description: form.short_description.trim() || form.title.trim(),
        description: form.description.trim() || form.short_description.trim() || form.title.trim(),
        governorate_id: targetGovId,
        sector_id: sector?.id || form.sector_id,
        city: form.city.trim(),
        project_type: form.project_type,
        investment_stage: form.investment_stage,
        investment_required: Number(form.investment_required),
        company_name: form.company_name.trim() || 'Independent Promoter',
        promoter_name: form.promoter_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        image_url: form.image_url ? form.image_url.trim() : null,
        photo_url: form.image_url ? form.image_url.trim() : null,
        image: form.image_url ? form.image_url.trim() : null,
        logo: form.image_url ? form.image_url.trim() : null,
      };
      if (form.expected_roi) payload.expected_roi = Number(form.expected_roi);
      if (form.jobs_created) payload.jobs_created = Number(form.jobs_created);

      let savedRecord;
      if (isEditing) {
        savedRecord = await base44.entities.InvestmentProject.update(projectToEdit.id, payload);
      } else {
        payload.project_status = 'PUBLISHED';
        payload.is_verified = false;
        payload.featured = false;
        if (user?.id) payload.user_id = user.id;
        savedRecord = await base44.entities.InvestmentProject.create(payload);
      }

      // Invalidate queries so the new or updated project appears everywhere immediately
      queryClient.invalidateQueries({ queryKey: ['investment-projects'] });
      queryClient.invalidateQueries({ queryKey: ['investmentProjectsForNetwork'] });
      queryClient.invalidateQueries({ queryKey: ['allProjectsForMatch'] });
      queryClient.invalidateQueries({ queryKey: ['admin-projects-all'] });

      toast({
        title: isEditing ? 'Opportunity Updated' : 'Opportunity Published',
        description: isEditing
          ? 'Your changes have been saved successfully!'
          : 'Your project is now live on the investment platform!',
      });

      if (onSaved) onSaved(savedRecord || payload);
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
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> {isEditing ? 'Edit Opportunity' : 'Propose Investment Opportunity'}
          </div>
          <DialogTitle>{isEditing ? 'Modify Investment Opportunity' : 'Submit an Opportunity'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the project parameters, description, financial requirements, or cover photo.'
              : governorate
              ? `This opportunity will be linked to ${governorate.name}${sector ? ` and ${sector.name}` : ''}. It will appear directly on the platform.`
              : 'Add an opportunity to connect with institutional funds and verified investors.'}
          </DialogDescription>
        </DialogHeader>

        {governorate && !isEditing ? (
          <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <MapPin className="w-3.5 h-3.5" /> {governorate.name}, {governorate.region}
          </div>
        ) : (
          <Field label="Governorate *">
            <Select value={form.governorate_id} onValueChange={setValue('governorate_id')}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a governorate" />
              </SelectTrigger>
              <SelectContent>
                {allGovernorates.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name} ({g.region})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Project title *">
              <Input value={form.title} onChange={set('title')} placeholder="e.g. Solar-powered cold storage facility" />
            </Field>
          </div>

          {sector && !isEditing ? (
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
                  {allSectors.map((s) => (
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

          {/* Photo / Image Upload Section */}
          <div className="sm:col-span-2 rounded-xl border border-dashed border-border p-4 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-primary" /> Project Cover Photo
              </Label>
              {form.image_url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setForm((f) => ({ ...f, image_url: '' }))}
                  className="h-6 text-xs text-destructive hover:text-destructive gap-1 px-2"
                >
                  <X className="w-3 h-3" /> Remove Photo
                </Button>
              )}
            </div>

            {form.image_url ? (
              <div className="relative rounded-lg overflow-hidden border bg-background/50 h-36 max-w-sm">
                <img
                  src={form.image_url}
                  alt="Opportunity Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs gap-1.5 shrink-0"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Image File
              </Button>
              <div className="flex-1">
                <Input
                  type="url"
                  placeholder="Or paste an image URL (e.g. https://...)"
                  value={form.image_url.startsWith('data:') ? 'Image uploaded from file' : form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                  disabled={form.image_url.startsWith('data:')}
                  className="text-xs h-9"
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Add a compelling project banner (JPG, PNG, WebP up to 5MB).
            </p>
          </div>

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
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : isEditing ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {isEditing ? 'Save Changes' : 'Submit for approval'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
