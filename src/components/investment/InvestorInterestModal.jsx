import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { INTEREST_LABELS } from '@/lib/investment';
import { Loader2 } from 'lucide-react';

const selectCls = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export default function InvestorInterestModal({ open, onClose, project, user, defaultType = 'EQUITY', mode = 'interest' }) {
  const { toast } = useToast();
  const [type, setType] = useState(defaultType);
  const [capacity, setCapacity] = useState('');
  const [ticket, setTicket] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => { if (open) setType(defaultType); }, [open, defaultType]);

  const isInfo = mode === 'info';

  const submit = async () => {
    if (!project || !user) return;
    setSubmitting(true);
    try {
      await base44.entities.InvestorInterest.create({
        project_id: project.id,
        project_title: project.title,
        investor_user_id: user.id,
        investor_name: user.full_name || user.email,
        interest_type: type,
        investment_capacity: capacity ? Number(capacity) : undefined,
        preferred_ticket: ticket ? Number(ticket) : undefined,
        message,
        status: 'NEW',
      });
      await base44.entities.ProjectView.create({
        project_id: project.id,
        governorate_id: project.governorate_id,
        sector_id: project.sector_id,
        user_id: user.id,
        action: isInfo ? 'REQUEST_DOCUMENTS' : 'INTEREST',
      }).catch(() => {});
      toast({ title: isInfo ? 'Information request sent' : 'Interest submitted', description: 'The project promoter will be notified.' });
      setCapacity(''); setTicket(''); setMessage('');
      onClose();
    } catch (e) {
      toast({ title: 'Could not submit', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isInfo ? 'Request More Information' : 'Express Investor Interest'}</DialogTitle>
          <DialogDescription>{project?.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="mb-1.5 block text-sm">Interest type</Label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={selectCls}>
              {Object.entries(INTEREST_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {!isInfo && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-sm">Capacity (MTND)</Label>
                <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="e.g. 5" />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Preferred ticket (MTND)</Label>
                <Input type="number" value={ticket} onChange={(e) => setTicket(e.target.value)} placeholder="e.g. 2" />
              </div>
            </div>
          )}
          <div>
            <Label className="mb-1.5 block text-sm">Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
              placeholder={isInfo ? 'Tell us which documents you would like and why...' : 'Introduce yourself and your investment interest...'} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isInfo ? 'Send Request' : 'Submit Interest'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
