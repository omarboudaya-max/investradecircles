import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { INVESTOR_TYPES, FUND_CATEGORIES } from '@/lib/investmentNetwork';
import { Building2, Landmark, CheckCircle2, Loader2, ShieldCheck, Upload, Image as ImageIcon, X, Check } from 'lucide-react';

const selectCls = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

const DEFAULT_FORM = {
  displayName: '',
  legalName: '',
  organizationType: 'VENTURE_CAPITAL',
  country: 'Tunisia',
  city: '',
  website: '',
  yearFounded: new Date().getFullYear(),
  description: '',
  minimumTicket: '0.1',
  maximumTicket: '2.0',
  preferredSectors: ['sec_tech'],
  preferredStages: ['EARLY_STAGE'],
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  logo: ''
};

export default function InvestorRegisterModal({ open, onClose, onSuccess, orgToEdit = null }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(DEFAULT_FORM);

  const isEditing = Boolean(orgToEdit);

  useEffect(() => {
    if (open) {
      if (orgToEdit) {
        setForm({
          displayName: orgToEdit.display_name || '',
          legalName: orgToEdit.legal_name || '',
          organizationType: orgToEdit.organization_type || 'VENTURE_CAPITAL',
          country: orgToEdit.country || 'Tunisia',
          city: orgToEdit.city || '',
          website: orgToEdit.website || '',
          yearFounded: orgToEdit.year_founded || 2024,
          description: orgToEdit.description || '',
          minimumTicket: orgToEdit.minimum_ticket ? String(orgToEdit.minimum_ticket) : '0.1',
          maximumTicket: orgToEdit.maximum_ticket ? String(orgToEdit.maximum_ticket) : '2.0',
          preferredSectors: orgToEdit.investment_focus || ['sec_tech'],
          preferredStages: orgToEdit.investment_stages || ['EARLY_STAGE'],
          contactName: orgToEdit.contact_name || '',
          contactEmail: orgToEdit.contact_email || '',
          contactPhone: orgToEdit.contact_phone || '',
          logo: orgToEdit.logo_url || orgToEdit.logo || ''
        });
      } else {
        setForm({
          ...DEFAULT_FORM,
          contactEmail: user?.email || '',
          contactName: user?.full_name || '',
        });
      }
      setSubmitted(false);
    }
  }, [open, orgToEdit, user]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX_SIZE = 600;
        let w = img.width;
        let h = img.height;
        if (w > MAX_SIZE || h > MAX_SIZE) {
          if (w > h) {
            h = Math.round((h * MAX_SIZE) / w);
            w = MAX_SIZE;
          } else {
            w = Math.round((w * MAX_SIZE) / h);
            h = MAX_SIZE;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.88);
        handleChange('logo', compressed);
      };
      img.onerror = () => {
        handleChange('logo', reader.result);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSectorToggle = (sectorId) => {
    setForm((prev) => {
      const exists = prev.preferredSectors.includes(sectorId);
      return {
        ...prev,
        preferredSectors: exists
          ? prev.preferredSectors.filter((s) => s !== sectorId)
          : [...prev.preferredSectors, sectorId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.displayName || !form.contactEmail) {
      toast({
        title: 'Required fields missing',
        description: 'Please fill in the organization name and contact email.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        display_name: form.displayName,
        legal_name: form.legalName || form.displayName,
        organization_type: form.organizationType,
        country: form.country,
        city: form.city,
        website: form.website,
        year_founded: parseInt(form.yearFounded) || 2024,
        description: form.description,
        minimum_ticket: parseFloat(form.minimumTicket) || 0.1,
        maximum_ticket: parseFloat(form.maximumTicket) || 2.0,
        investment_focus: form.preferredSectors,
        investment_stages: form.preferredStages,
        contact_email: form.contactEmail,
        contact_phone: form.contactPhone,
        logo: form.logo ? form.logo : null,
        logo_url: form.logo ? form.logo : null,
      };

      let result;
      if (isEditing) {
        result = await base44.entities.InvestmentOrganization.update(orgToEdit.id, payload);
      } else {
        payload.verification_status = 'PENDING';
        payload.official = false;
        payload.featured = false;
        if (user?.id) payload.user_id = user.id;
        result = await base44.entities.InvestmentOrganization.create(payload);
      }

      // Invalidate queries so the directory updates immediately
      queryClient.invalidateQueries({ queryKey: ['investmentOrganizationsList'] });
      queryClient.invalidateQueries({ queryKey: ['investmentVehiclesList'] });
      queryClient.invalidateQueries({ queryKey: ['admin-investor-orgs'] });
      if (orgToEdit?.id) {
        queryClient.invalidateQueries({ queryKey: ['investmentOrganization', orgToEdit.id] });
      }
      if (orgToEdit?.slug) {
        queryClient.invalidateQueries({ queryKey: ['investmentOrganization', orgToEdit.slug] });
      }

      setLoading(false);
      setSubmitted(true);
      toast({
        title: isEditing ? 'Profile Updated' : 'Investor Registered',
        description: isEditing
          ? 'Your investment institution profile has been saved successfully!'
          : 'Your investment institution has been registered and is now listed on the platform!'
      });

      if (onSuccess) onSuccess(result || payload);
    } catch (err) {
      setLoading(false);
      toast({
        title: isEditing ? 'Update failed' : 'Registration failed',
        description: err.message || 'An error occurred while saving.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-white dark:bg-slate-900">
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <Landmark className="w-4 h-4" /> Capital Partner Network
              </div>
              <DialogTitle className="text-xl font-bold text-white">
                {isEditing ? 'Modify Investment Profile' : 'Register Investment Institution / Fund'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300">
                {isEditing
                  ? 'Update institution profile, ticket size, mandate thesis, or logo.'
                  : 'Join the Investraders Investment Network to receive curated dealflow & matching investment projects.'}
              </DialogDescription>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Organization Display Name *</Label>
                  <Input
                    placeholder="e.g. Atlas Capital Partners"
                    value={form.displayName}
                    onChange={(e) => handleChange('displayName', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Legal Registered Name</Label>
                  <Input
                    placeholder="e.g. Atlas Capital SA"
                    value={form.legalName}
                    onChange={(e) => handleChange('legalName', e.target.value)}
                  />
                </div>
              </div>

              {/* Logo / Profile Photo Upload */}
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Organization Logo / Photo
                  </Label>
                  {form.logo && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleChange('logo', '')}
                      className="h-6 text-xs text-destructive hover:text-destructive gap-1 px-2"
                    >
                      <X className="w-3 h-3" /> Remove Photo
                    </Button>
                  )}
                </div>

                {form.logo && (
                  <div className="relative rounded-xl overflow-hidden border bg-background/50 h-24 w-24 p-1">
                    <img
                      src={form.logo}
                      alt="Logo preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}

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
                      placeholder="Or paste image / logo URL (e.g. https://...)"
                      value={form.logo.startsWith('data:') ? 'Image uploaded from file' : form.logo}
                      onChange={(e) => handleChange('logo', e.target.value)}
                      disabled={form.logo.startsWith('data:')}
                      className="text-xs h-9"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Provide your firm brand logo or profile banner (JPG, PNG, WebP up to 5MB).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Institution Type</Label>
                  <select
                    className={selectCls}
                    value={form.organizationType}
                    onChange={(e) => handleChange('organizationType', e.target.value)}
                  >
                    {INVESTOR_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Country HQ</Label>
                  <Input
                    placeholder="e.g. Tunisia, France, United States"
                    value={form.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Min Ticket Size (M TND)</Label>
                  <Input
                    type="number"
                    step="0.05"
                    value={form.minimumTicket}
                    onChange={(e) => handleChange('minimumTicket', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Max Ticket Size (M TND)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.maximumTicket}
                    onChange={(e) => handleChange('maximumTicket', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Website URL</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={form.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Investment Strategy & Thesis</Label>
                <Textarea
                  placeholder="Describe your fund mandate, target check size, value-add, and geographic preferences..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Official Representative Contact Email *</Label>
                  <Input
                    type="email"
                    placeholder="investor@firm.com"
                    value={form.contactEmail}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone / Whatsapp</Label>
                  <Input
                    type="tel"
                    placeholder="+216 ..."
                    value={form.contactPhone}
                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : isEditing ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : null}
                {isEditing ? 'Save Changes' : 'Submit for Verification'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <DialogTitle className="text-xl font-bold">Institution Profile Submitted!</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400 max-w-md mx-auto text-sm">
              Thank you for joining the Investraders Investment Network. Our team will review your mandate details and activate your institutional profile.
            </DialogDescription>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
            >
              Close Window
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
