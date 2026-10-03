import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { INVESTOR_TYPES, FUND_CATEGORIES } from '@/lib/investmentNetwork';
import { Building2, Landmark, CheckCircle2, Loader2, ShieldCheck, Upload } from 'lucide-react';

const selectCls = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export default function InvestorRegisterModal({ open, onClose, onSuccess }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
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
    contactPhone: ''
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
        verification_status: 'PENDING',
        official: false,
        featured: false,
        contact_email: form.contactEmail,
        contact_phone: form.contactPhone
      };

      await base44.entities.InvestmentOrganization.create(payload);

      setLoading(false);
      setSubmitted(true);
      toast({
        title: 'Registration Submitted',
        description: 'Your investment institution registration has been submitted for review.'
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      setLoading(false);
      toast({
        title: 'Registration failed',
        description: err.message || 'An error occurred while registering.',
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
              <DialogTitle className="text-xl font-bold text-white">Register Investment Institution / Fund</DialogTitle>
              <DialogDescription className="text-xs text-slate-300">
                Join the Investraders Investment Network to receive curated dealflow & matching investment projects.
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
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Submit for Verification
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
