import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Plus, Shield, Briefcase } from 'lucide-react';
import { useContextStore } from '../store/useContextStore';
import MainLayout from '../components/MainLayout';
import { getApiErrorMessage } from '../services/api';

const TECH_ROLES = [
  'Frontend Engineer',
  'Backend Engineer',
  'Full Stack Engineer',
  'DevOps Engineer',
  'QA Engineer',
  'Solutions Architect',
  'Database Administrator',
  'Security Engineer',
];

const MANAGERIAL_ROLES = [
  'Engineering Manager',
  'Tech Lead',
  'Product Manager',
  'Project Manager',
  'Director of Engineering',
  'VP of Engineering',
  'CTO',
];

const GENERAL_ROLES = [
  'Designer',
  'Product Designer',
  'UX Research',
  'Data Analyst',
  'Business Analyst',
  'Marketing',
];

const ACCESS_LEVELS = [
  { value: 'view', label: 'View Only', description: 'Can view decisions and failures' },
  { value: 'edit', label: 'Editor', description: 'Can view and create decisions/failures' },
  { value: 'admin', label: 'Admin', description: 'Can manage team and content' },
  { value: 'owner', label: 'Owner', description: 'Full access and project ownership' },
];

export default function TeamManagementPage() {
  const { contextId } = useParams<{ contextId: string }>();
  const store = useContextStore();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Frontend Engineer');
  const [accessLevel, setAccessLevel] = useState('edit');
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

  useEffect(() => {
    if (store.activeContext?.teamId) {
      store.fetchTeamMembers(store.activeContext.teamId);
    }
  }, [store.activeContext?.teamId]);

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
      await store.inviteTeamMember(trimmedEmail, name.trim() || undefined, `${role} (${accessLevel})`);
      setEmail('');
      setName('');
      setRole('Frontend Engineer');
      setAccessLevel('edit');
      setSuccessMessage('Invite sent successfully!');
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
              <div className="bg-white border border-black/10 rounded-3xl p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                <h3 className="text-2xl font-bold text-[#1C1C1E] mb-1 flex items-center gap-2">
                  <Plus className="w-6 h-6" />
                  Invite Team
                </h3>
                <p className="text-sm text-[#8E8E93] mb-6">Add new members to your team</p>

                <form onSubmit={handleInvite} className="space-y-5">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-bold text-[#1C1C1E] mb-2">Email *</label>
                    <input
                      type="email"
                      placeholder="hello@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#F2F2F7] border-0 rounded-2xl px-4 py-3.5 text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#FF9500] transition-all"
                      required
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-bold text-[#1C1C1E] mb-2">Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#F2F2F7] border-0 rounded-2xl px-4 py-3.5 text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#FF9500] transition-all"
                    />
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-bold text-[#1C1C1E] mb-3 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Role / Position
                    </label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-[#8E8E93] px-3 py-1 uppercase tracking-wider">Engineering</p>
                        {TECH_ROLES.map((r) => (
                          <label key={r} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F2F2F7] cursor-pointer transition">
                            <input
                              type="radio"
                              name="role"
                              value={r}
                              checked={role === r}
                              onChange={(e) => setRole(e.target.value)}
                              className="w-4 h-4 text-[#FF9500] cursor-pointer"
                            />
                            <span className="text-sm font-medium text-[#1C1C1E]">{r}</span>
                          </label>
                        ))}
                      </div>

                      <div className="mb-3">
                        <p className="text-xs font-semibold text-[#8E8E93] px-3 py-1 uppercase tracking-wider">Management</p>
                        {MANAGERIAL_ROLES.map((r) => (
                          <label key={r} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F2F2F7] cursor-pointer transition">
                            <input
                              type="radio"
                              name="role"
                              value={r}
                              checked={role === r}
                              onChange={(e) => setRole(e.target.value)}
                              className="w-4 h-4 text-[#FF9500] cursor-pointer"
                            />
                            <span className="text-sm font-medium text-[#1C1C1E]">{r}</span>
                          </label>
                        ))}
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-[#8E8E93] px-3 py-1 uppercase tracking-wider">Other</p>
                        {GENERAL_ROLES.map((r) => (
                          <label key={r} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F2F2F7] cursor-pointer transition">
                            <input
                              type="radio"
                              name="role"
                              value={r}
                              checked={role === r}
                              onChange={(e) => setRole(e.target.value)}
                              className="w-4 h-4 text-[#FF9500] cursor-pointer"
                            />
                            <span className="text-sm font-medium text-[#1C1C1E]">{r}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Access Level Selection */}
                  <div>
                    <label className="block text-sm font-bold text-[#1C1C1E] mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Access Level
                    </label>
                    <div className="space-y-2">
                      {ACCESS_LEVELS.map((level) => (
                        <label key={level.value} className="flex items-start gap-3 p-3 rounded-2xl border-2 border-transparent cursor-pointer transition hover:bg-[#F2F2F7]"
                               style={{
                                 borderColor: accessLevel === level.value ? '#FF9500' : 'transparent',
                                 backgroundColor: accessLevel === level.value ? '#FFF4E5' : 'transparent'
                               }}>
                          <input
                            type="radio"
                            name="access"
                            value={level.value}
                            checked={accessLevel === level.value}
                            onChange={(e) => setAccessLevel(e.target.value)}
                            className="w-4 h-4 text-[#FF9500] cursor-pointer mt-1 shrink-0"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-[#1C1C1E]">{level.label}</div>
                            <p className="text-xs text-[#8E8E93] mt-0.5">{level.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Messages */}
                  {successMessage && (
                    <div className="bg-[#34C759]/15 border border-[#34C759]/40 rounded-2xl p-4 text-[#34C759] text-sm font-medium">
                      ✓ {successMessage}
                    </div>
                  )}
                  {errorMessage && (
                    <div className="bg-[#FF3B30]/15 border border-[#FF3B30]/40 rounded-2xl p-4 text-[#FF3B30] text-sm font-medium">
                      ✕ {errorMessage}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !email}
                    className="w-full font-bold py-3.5 rounded-2xl transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-lg"
                    style={{
                      background: isSubmitting || !email ? '#E5E5EA' : 'linear-gradient(135deg, #FF9500 0%, #FFAA33 100%)',
                      color: isSubmitting || !email ? '#8E8E93' : 'white',
                    }}
                  >
                    {isSubmitting ? 'Sending Invite...' : 'Send Invite'}
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
