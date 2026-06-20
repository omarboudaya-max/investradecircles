import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3, Plus, X } from 'lucide-react';

export default function CreatePoll() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '']);
  const [loading, setLoading] = useState(false);

  const addOption = () => setOptions([...options, '']);
  const removeOption = (i) => setOptions(options.filter((_, idx) => idx !== i));
  const updateOption = (i, val) => {
    const copy = [...options];
    copy[i] = val;
    setOptions(copy);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    const optionText = options.filter(Boolean).map((o) => `• ${o}`).join('\n');
    await supabase.from('Post').insert({
      content: `📊 Poll: ${question}\n\n${optionText}`,
      post_type: 'poll',
      visibility: 'public',
      author_name: user?.full_name || user?.email?.split('@')[0] || 'User',
    });
    setLoading(false);
    navigate('/');
  };

  return (
    <div className="max-w-xl mx-auto">
      <Link to="/home" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="bg-card rounded-2xl border shadow-sm p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Create Poll</h1>
            <p className="text-sm text-muted-foreground">Ask your community and get insights</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Question</label>
            <Textarea placeholder="What do you want to ask?" value={question} onChange={(e) => setQuestion(e.target.value)} className="min-h-[80px]" />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Options</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    className="h-10"
                  />
                  {options.length > 2 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(i)} className="shrink-0">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={addOption} className="mt-2 rounded-full text-sm" size="sm">
              <Plus className="w-3 h-3 mr-1" /> Add Option
            </Button>
          </div>

          <Button type="submit" disabled={loading || !question.trim()} className="w-full h-12 rounded-full bg-gradient-to-r from-blue-700 to-blue-500 text-white font-semibold shadow-lg">
            {loading ? 'Creating...' : 'Create Poll'}
          </Button>
        </form>
      </div>
    </div>
  );
}
