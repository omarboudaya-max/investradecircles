import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Check, Download, GraduationCap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { listTrainingRegistrations, registerForTraining } from '@/api/platform';

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

function downloadCsv(rows, circleName) {
  const header = ['Date', 'Course', 'Full name', 'Email', 'Phone', 'Company', 'Status'];
  const lines = rows.map((r) => [r.created_date ? format(new Date(r.created_date), 'yyyy-MM-dd HH:mm') : '', r.course_title, r.full_name, r.email, r.phone, r.company, r.status].map(csvCell).join(','));
  // The BOM makes Excel read accented names correctly.
  const blob = new Blob([`﻿${[header.map(csvCell).join(','), ...lines].join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `registrations-${(circleName || 'academy').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * A chamber's training catalogue. A registration is stored and the circle's
 * organisers are notified; organisers see the list and can export it.
 */
export default function TrainingAcademy({ circle, user, isManager, title, description, courses }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [course, setCourse] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', company: '' });
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(() => new Set());

  const { data: registrations } = useQuery({
    queryKey: ['training-registrations', circle?.id],
    queryFn: () => listTrainingRegistrations(circle.id),
    enabled: Boolean(circle?.id) && Boolean(user?.id),
    staleTime: 30000,
  });
  const rows = registrations?.rows || [];
  const mine = new Set([...rows.filter((r) => r.user_id === user?.id).map((r) => r.course_title), ...registered]);

  const open = (c) => {
    setCourse(c);
    setForm({ fullName: user?.full_name || '', email: user?.email || '', phone: user?.phone || '', company: user?.company || user?.headline || '' });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!course) return;
    setSubmitting(true);
    try {
      const result = await registerForTraining({ user, circle, course, form });
      setRegistered((prev) => new Set(prev).add(course.title));
      queryClient.invalidateQueries({ queryKey: ['training-registrations', circle?.id] });
      toast({
        title: 'Registration sent',
        description: result.notified
          ? `The ${circle?.name || 'academy'} team has been notified and will contact you to confirm your place.`
          : 'Your registration has been recorded.',
      });
      setCourse(null);
    } catch (error) {
      toast({ title: 'Could not register', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key, text, props = {}) => (
    <div>
      <Label htmlFor={`training-${key}`} className="mb-1.5 block text-xs">{text}</Label>
      <Input id={`training-${key}`} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} {...props} />
    </div>
  );

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div>
        <h3 className="flex items-center gap-2 text-base font-bold text-foreground"><GraduationCap className="h-5 w-5 text-primary" /> {title}</h3>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {courses.map((c) => {
          const done = mine.has(c.title);
          return (
            <div key={c.title} className="flex flex-col justify-between rounded-2xl border bg-card p-4">
              <div>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">{c.status}</span>
                <p className="mt-2 text-sm font-semibold text-foreground">{c.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{c.type}</p>
                {c.summary && <p className="mt-2 text-xs text-foreground/80">{c.summary}</p>}
              </div>
              <Button size="sm" className="mt-4 w-full gap-1.5" variant={done ? 'outline' : 'default'} disabled={done || !c.open} onClick={() => open(c)}>
                {done ? <><Check className="h-3.5 w-3.5" /> Registration sent</> : c.open ? 'Register' : 'Registration opens soon'}
              </Button>
            </div>
          );
        })}
      </div>

      {isManager && (
        <section className="rounded-2xl border bg-card">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
            <h4 className="text-sm font-semibold text-foreground">Registrations received · {rows.length}</h4>
            <Button size="sm" variant="outline" className="gap-1.5" disabled={!rows.length} onClick={() => downloadCsv(rows, circle?.name)}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </header>
          {registrations && !registrations.available ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              Registrations currently reach you as notifications. Once the database update has been applied they will also be listed and exportable here.
            </p>
          ) : rows.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">No registration yet.</p>
          ) : (
            <ul className="divide-y">
              {rows.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="block font-medium text-foreground">{r.full_name}{r.company ? ` · ${r.company}` : ''}</span>
                    <span className="block truncate text-xs text-muted-foreground">{r.course_title} — {r.email}{r.phone ? `, ${r.phone}` : ''}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{r.created_date ? format(new Date(r.created_date), 'd MMM yyyy') : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <Dialog open={Boolean(course)} onOpenChange={(isOpen) => !isOpen && !submitting && setCourse(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>Register for a training</DialogTitle>
              <DialogDescription>{course?.title}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {field('fullName', 'Full name *', { required: true, maxLength: 120, autoComplete: 'name' })}
              {field('email', 'Email *', { required: true, type: 'email', maxLength: 200, autoComplete: 'email' })}
              {field('phone', 'Phone *', { required: true, type: 'tel', maxLength: 40, autoComplete: 'tel', placeholder: '+216 …' })}
              {field('company', 'Company / organisation', { maxLength: 160, autoComplete: 'organization' })}
              <p className="text-xs text-muted-foreground">These details are shared with the organisers of {circle?.name || 'this circle'} so they can confirm your place.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCourse(null)} disabled={submitting}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Confirm registration</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
