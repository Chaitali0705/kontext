import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Plus } from 'lucide-react';
import { useContextStore } from '../store/useContextStore';
import MainLayout from '../components/MainLayout';
import { getApiErrorMessage } from '../services/api';

export default function TeamManagementPage() {
  const { contextId } = useParams<{ contextId: string }>();
  const store = useContextStore();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!contextId) return;
    const context = store.contexts.find((c) => c.id === contextId);
    if (context && context.id !== store.activeContext?.id) {
      store.setActiveContext(context);
    }
  }, [contextId, store.contexts, store.activeContext?.id]);

  // Intelligent Routing: Respecting your friend's flow!
  useEffect(() => {
    if (store.currentUser && !store.isLoading) {
      // 1. If they have no projects, send them to your friend's Project Creation flow
      if (store.contexts.length === 0) {
        navigate('/create-project');
      } 
      // 2. If they already have a project, send them to the Dashboard
      else if (store.activeContext) {
        navigate(`/dashboard/${store.activeContext.id}`);
      }
    }
  }, [store.currentUser, store.activeContext, store.contexts.length, store.isLoading, navigate]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Invalid email format');
      return;
    }

    if (store.teamMembers.some((member) => member.email.toLowerCase() === trimmedEmail)) {
      setErrorMessage('Member already invited');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await store.inviteTeamMember(trimmedEmail, name.trim() || undefined, role);
      setEmail('');
      setName('');
      setRole('Editor');
      setSuccessMessage('Invite sent');
      setTimeout(() => setSuccessMessage(''), 2500);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!store.activeContext) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center text-[#8E8E93]">Loading project...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="h-16 border-b border-black/10 flex items-center px-8 bg-white/70 backdrop-blur-xl shrink-0">
          <h1 className="text-xl font-semibold text-[#1C1C1E] flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Management
          </h1>
        </div>

        <div className="max-w-5xl mx-auto px-8 py-8">
          <div className="bg-white border border-black/10 rounded-2xl p-6 mb-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <h2 className="text-lg font-semibold text-[#1C1C1E] mb-2">{store.activeContext.name}</h2>
            {store.activeContext.description && (
              <p className="text-[#8E8E93] text-sm">{store.activeContext.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                <h3 className="text-lg font-semibold text-[#1C1C1E] mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Invite Team Member
                </h3>

                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1C1C1E] mb-2">Email *</label>
                    <input
                      type="email"
                      placeholder="hello@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none focus:border-[#FF9500] transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1C1C1E] mb-2">Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none focus:border-[#FF9500] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1C1C1E] mb-2">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-[#1C1C1E] focus:outline-none focus:border-[#FF9500] transition-colors"
                    >
                      <option>Editor</option>
                      <option>Admin</option>
                      <option>Viewer</option>
                    </select>
                  </div>

                  {successMessage && (
                    <div className="bg-[#34C759]/10 border border-[#34C759]/40 rounded-lg p-3 text-[#34C759] text-sm">
                      {successMessage}
                    </div>
                  )}
                  {errorMessage && (
                    <div className="bg-[#FF3B30]/10 border border-[#FF3B30]/40 rounded-lg p-3 text-[#FF3B30] text-sm">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !email}
                    className="w-full bg-gradient-to-r from-[#FFB340] to-[#FF9500] hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all"
                  >
                    {isSubmitting ? 'Inviting...' : 'Send Invite'}
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                <h3 className="text-lg font-semibold text-[#1C1C1E] mb-4">
                  Team Members ({store.teamMembers.length})
                </h3>

                {store.teamMembers.length === 0 ? (
                  <div className="text-center py-8 text-[#8E8E93]">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No team members yet.</p>
                    <p className="text-sm">Invite someone to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {store.teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-4 bg-[#F8F8FB] border border-black/10 rounded-xl"
                      >
                        <div className="w-10 h-10 bg-[#FF9500] rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {(member.name || member.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-[#1C1C1E] font-medium truncate">{member.name || 'Unnamed'}</div>
                          <div className="text-sm text-[#8E8E93] truncate">{member.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
