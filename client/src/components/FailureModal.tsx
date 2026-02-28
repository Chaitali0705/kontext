import { X } from 'lucide-react';
import { useState } from 'react';

interface FailureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export default function FailureModal({ isOpen, onClose, onSubmit, isLoading = false }: FailureModalProps) {
  const [whatFailed, setWhatFailed] = useState('');
  const [whyFailed, setWhyFailed] = useState('');
  const [cost, setCost] = useState('');
  const [learning, setLearning] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatFailed.trim() || !whyFailed.trim()) {
      setErrorMessage('Please fix the highlighted fields');
      return;
    }
    setErrorMessage('');
    const title = whatFailed.trim().slice(0, 80);
    await onSubmit({
      title,
      whatFailed: whatFailed.trim(),
      whyFailed: learning.trim() ? `${whyFailed.trim()}\nLearning: ${learning.trim()}` : whyFailed.trim(),
      costEstimate: cost ? parseInt(cost, 10) : 0,
      learning: learning.trim() || undefined
    });
    setWhatFailed('');
    setWhyFailed('');
    setCost('');
    setLearning('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 backdrop-blur-sm px-4">
      <div className="bg-white border border-black/10 w-full max-w-2xl rounded-3xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-black/10 flex justify-between items-center bg-white/80 backdrop-blur-xl shrink-0">
          <h3 className="font-semibold text-[#1C1C1E]">Log Failure</h3>
          <button onClick={onClose} className="hover:bg-black/5 p-1.5 rounded-lg transition-colors">
            <X className="w-5 h-5 text-[#8E8E93]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-[#1C1C1E] mb-2">What failed? *</label>
            <textarea
              value={whatFailed}
              onChange={(e) => setWhatFailed(e.target.value)}
              rows={3}
              className="w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-[#1C1C1E] focus:outline-none focus:border-[#FF3B30]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1C1C1E] mb-2">Why did it fail? *</label>
            <textarea
              value={whyFailed}
              onChange={(e) => setWhyFailed(e.target.value)}
              rows={3}
              className="w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-[#1C1C1E] focus:outline-none focus:border-[#FF3B30]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1C1C1E] mb-2">Cost (hours)</label>
            <input
              type="number"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-[#1C1C1E] focus:outline-none focus:border-[#FF3B30]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1C1C1E] mb-2">Learning</label>
            <textarea
              value={learning}
              onChange={(e) => setLearning(e.target.value)}
              rows={2}
              className="w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-[#1C1C1E] focus:outline-none focus:border-[#FF3B30]"
            />
          </div>

          {errorMessage && <div className="text-sm text-[#FF3B30]">{errorMessage}</div>}
          </div>

          <div className="px-6 py-4 border-t border-black/10 bg-white/80 backdrop-blur-xl flex gap-3 shrink-0">
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
              className="flex-1 bg-[#FF3B30] hover:brightness-95 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl transition-all"
            >
              {isLoading ? 'Saving...' : 'Log Failure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
