import { useState } from 'react';
import { X } from 'lucide-react';

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export default function DecisionModal({ isOpen, onClose, onSubmit, isLoading = false }: DecisionModalProps) {
  const [title, setTitle] = useState('');
  const [decision, setDecision] = useState('');
  const [rationale, setRationale] = useState('');
  const [constraintsInput, setConstraintsInput] = useState('');
  const [alternativesInput, setAlternativesInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const toList = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !decision.trim() || !rationale.trim()) {
      setErrorMessage('Please fix the highlighted fields');
      return;
    }
    setErrorMessage('');
    await onSubmit({
      title: title.trim(),
      content: decision.trim(),
      rationale: rationale.trim(),
      constraints: toList(constraintsInput),
      alternatives: toList(alternativesInput)
    });
    setTitle('');
    setDecision('');
    setRationale('');
    setConstraintsInput('');
    setAlternativesInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 backdrop-blur-sm px-4">
      <div className="bg-white border border-black/10 w-full max-w-2xl rounded-3xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="p-5 border-b border-black/10 flex justify-between items-center bg-white/80 backdrop-blur-xl">
          <h3 className="font-semibold text-[#1C1C1E]">Add Decision</h3>
          <button onClick={onClose} className="hover:bg-black/5 p-1.5 rounded-lg transition-colors">
            <X className="w-5 h-5 text-[#8E8E93]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1C1C1E] mb-2">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-[#1C1C1E] focus:outline-none focus:border-[#FF9500]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1C1C1E] mb-2">Decision *</label>
            <textarea
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              rows={3}
              className="w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-[#1C1C1E] focus:outline-none focus:border-[#FF9500]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1C1C1E] mb-2">Rationale *</label>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={3}
              className="w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-[#1C1C1E] focus:outline-none focus:border-[#FF9500]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1C1C1E] mb-2">Constraints</label>
            <input
              placeholder="Comma separated, e.g. budget cap, 2-week timeline"
              value={constraintsInput}
              onChange={(e) => setConstraintsInput(e.target.value)}
              className="w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-[#1C1C1E] focus:outline-none focus:border-[#FF9500]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1C1C1E] mb-2">Alternatives</label>
            <input
              placeholder="Comma separated alternatives"
              value={alternativesInput}
              onChange={(e) => setAlternativesInput(e.target.value)}
              className="w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-[#1C1C1E] focus:outline-none focus:border-[#FF9500]"
            />
          </div>

          {errorMessage && <div className="text-sm text-[#FF3B30]">{errorMessage}</div>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#F2F2F7] hover:bg-[#EAEAEE] text-[#1C1C1E] font-medium py-2.5 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-[#FFB340] to-[#FF9500] hover:brightness-105 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl transition-all"
            >
              {isLoading ? 'Saving...' : 'Add Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
