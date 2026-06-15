import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { Upload, Mail, CheckCircle2, XCircle, Loader2, FileText } from 'lucide-react';

function parseEmails(text) {
  // Extract all valid-looking emails from any format (CSV, newline, space, semicolon separated)
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  return [...new Set(matches)]; // deduplicate
}

export default function BulkInviteModal({ open, onClose, circleId, circleName, currentUser }) {
  const [emailText, setEmailText] = useState('');
  const [results, setResults] = useState(null); // { sent: [], failed: [], notFound: [] }
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setEmailText(evt.target.result);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSend = async () => {
    const emails = parseEmails(emailText);
    if (!emails.length) return;

    setLoading(true);
    setResults(null);

    const sent = [];
    const notFound = [];
    const failed = [];

    // Look up platform users by email
    let allUsers = [];
    try {
      allUsers = await supabase.from('profiles').select('*').then(res => res.data || []);
    } catch (_) {}

    const userMap = {};
    allUsers.forEach((u) => { if (u.email) userMap[u.email.toLowerCase()] = u; });

    for (const email of emails) {
      const matchedUser = userMap[email.toLowerCase()];
      if (!matchedUser) {
        notFound.push(email);
        continue;
      }
      try {
        await supabase.from('CircleInvite').insert({
          circle_id: circleId,
          circle_name: circleName,
          inviter_id: currentUser.id,
          inviter_name: currentUser.full_name,
          invitee_id: matchedUser.id,
          status: 'pending',
        });
        sent.push(email);
      } catch (_) {
        failed.push(email);
      }
    }

    setResults({ sent, notFound, failed });
    setLoading(false);
  };

  const emailCount = parseEmails(emailText).length;

  const handleClose = () => {
    setEmailText('');
    setResults(null);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg w-full rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" /> Bulk Invite by Email
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Paste emails or upload a CSV file. We'll match them to platform users and send invites.
          </p>
        </DialogHeader>

        {!results ? (
          <div className="space-y-4 mt-2">
            {/* Upload CSV */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                variant="outline"
                className="w-full rounded-xl border-dashed gap-2 h-11"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                Upload CSV / TXT file
                <span className="ml-1 text-muted-foreground text-xs">(emails extracted automatically)</span>
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex-1 h-px bg-border" />
              or paste emails below
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Paste area */}
            <Textarea
              placeholder="john@example.com, jane@example.com&#10;bob@company.org&#10;..."
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              className="min-h-[140px] rounded-xl text-sm font-mono"
            />

            {emailCount > 0 && (
              <p className="text-xs text-primary font-medium flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {emailCount} unique email{emailCount !== 1 ? 's' : ''} detected
              </p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-full" onClick={handleClose}>Cancel</Button>
              <Button
                className="flex-1 rounded-full bg-primary"
                disabled={emailCount === 0 || loading}
                onClick={handleSend}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...</>
                ) : (
                  `Send ${emailCount} Invite${emailCount !== 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Results summary */
          <div className="space-y-4 mt-2">
            {results.sent.length > 0 && (
              <div className="rounded-xl p-4 bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-2 font-semibold text-green-700 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> {results.sent.length} invite{results.sent.length !== 1 ? 's' : ''} sent
                </div>
                <ul className="text-xs text-green-700 space-y-0.5 max-h-28 overflow-y-auto">
                  {results.sent.map((e) => <li key={e}>{e}</li>)}
                </ul>
              </div>
            )}

            {results.notFound.length > 0 && (
              <div className="rounded-xl p-4 bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 mb-2 font-semibold text-amber-700 text-sm">
                  <XCircle className="w-4 h-4" /> {results.notFound.length} not found on platform
                </div>
                <ul className="text-xs text-amber-700 space-y-0.5 max-h-28 overflow-y-auto">
                  {results.notFound.map((e) => <li key={e}>{e}</li>)}
                </ul>
              </div>
            )}

            {results.failed.length > 0 && (
              <div className="rounded-xl p-4 bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 mb-2 font-semibold text-red-700 text-sm">
                  <XCircle className="w-4 h-4" /> {results.failed.length} failed to send
                </div>
                <ul className="text-xs text-red-700 space-y-0.5 max-h-28 overflow-y-auto">
                  {results.failed.map((e) => <li key={e}>{e}</li>)}
                </ul>
              </div>
            )}

            <Button className="w-full rounded-full bg-primary" onClick={handleClose}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}