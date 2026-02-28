import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Plus, Shield, Briefcase } from 'lucide-react';
import { useContextStore } from '../store/useContextStore';
import MainLayout from '../components/MainLayout';
import clsx from 'clsx';

const ENGINEERING_ROLES = [
  'Frontend Engineer',
  'Backend Engineer',
  'Full Stack Engineer',
  'DevOps Engineer',
  'QA Engineer',
  'Solutions Architect'
];

const ACCESS_LEVELS = [
  { id: 'view', title: 'View Only', desc: 'Can view decisions and failures' },
  { id: 'editor', title: 'Editor', desc: 'Can view and create decisions/failures' },
  { id: 'admin', title: 'Admin', desc: 'Can manage team and content' },
  { id: 'owner', title: 'Owner', desc: 'Full access and project ownership' }
];

export default function TeamManagementPage() {
  const { contextId } = useParams<{ contextId: string }>();
  const navigate = useNavigate();
  const store = useContextStore();
  
  // UI State
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState('Frontend Engineer');
  const [accessLevel, setAccessLevel] = useState('Editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Sync contextId from URL
  useEffect(() => {
    if (!contextId || store.contexts.length === 0) return;
    const context = store.contexts.find((c: any) => c.id === contextId);
    if (context && context.id !== store.activeContext?.id) {
      store.setActiveContext(context);
    }
  }, [contextId, store.contexts, store.activeContext?.id, store]);

  // 2. Intelligent Routing
  useEffect(() => {
    if (store.currentUser && !store.isLoading) {
      if (store.contexts.length === 0) navigate('/create-project');
    }
  }, [store.currentUser, store.contexts.length, store.isLoading, navigate]);

  // 3. Fetch team members
  useEffect(() => {
    if (store.activeContext?.teamId || store.activeContext?.team_id) {
        store.fetchTeamMembers(store.activeContext.teamId || store.activeContext.team_id);
    }
  }, [store.activeContext, store]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Invalid email format');
      return;
    }

    if (store.teamMembers.some((member: any) => member.email.toLowerCase() === trimmedEmail)) {
      setErrorMessage('Member already invited');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      // Send to Supabase (we pass the name and email, role/access can be added to db schema later!)
      await store.inviteTeamMember(trimmedEmail, name.trim() || undefined);
      setEmail('');
      setName('');
      setSelectedRole('Frontend Engineer');
      setAccessLevel('Editor');
    } catch (error) {
      setErrorMessage("Failed to send invite");
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
      <div className="flex-1 overflow-y-auto bg-[#F2F2F7]">
        {/* Header */}
        <div className="h-16 border-b border-black/10 flex items-center px-8 bg-white/70 backdrop-blur-xl shrink-0">
          <h1 className="text-xl font-semibold text-[#1C1C1E] flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Management
          </h1>
        </div>

        <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
          
          {/* Project Info Card */}
          <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1C1C1E] mb-1">{store.activeContext.name}</h2>
            <p className="text-sm text-[#8E8E93]">{store.activeContext.description || "No description provided."}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT: Invite Form */}
            <div className="lg:col-span-1 bg-white border border-black/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-[#1C1C1E] flex items-center gap-2 mb-1">
                <Plus className="w-6 h-6" /> Invite Team
              </h3>
              <p className="text-sm text-[#8E8E93] mb-6">Add new members to your team</p>

              <form onSubmit={handleInvite} className="space-y-6">
                
                {/* Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1C1C1E] mb-1.5">Email *</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="hello@example.com" 
                      className="w-full bg-[#F2F2F7] border-transparent rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9500]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1C1C1E] mb-1.5">Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe" 
                      className="w-full bg-[#F2F2F7] border-transparent rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9500]/20"
                    />
                  </div>
                </div>

                {/* Role / Position */}
                <div>
                  <h4 className="text-sm font-bold text-[#1C1C1E] flex items-center gap-2 mb-3">
                    <Briefcase className="w-4 h-4" /> Role / Position
                  </h4>
                  <div className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider mb-2 ml-1">
                    Engineering
                  </div>
                  
                  {/* Scrollable Role List */}
                  <div className="max-h-40 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {ENGINEERING_ROLES.map((role) => (
                      <label key={role} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="radio" 
                          name="role"
                          value={role}
                          checked={selectedRole === role}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="w-4 h-4 text-[#007AFF] border-gray-300 focus:ring-[#007AFF]"
                        />
                        <span className="text-sm text-[#1C1C1E] group-hover:text-black">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Access Level */}
                <div>
                  <h4 className="text-sm font-bold text-[#1C1C1E] flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4" /> Access Level
                  </h4>
                  
                  <div className="space-y-2">
                    {ACCESS_LEVELS.map((level) => (
                      <div 
                        key={level.id}
                        onClick={() => setAccessLevel(level.title)}
                        className={clsx(
                          "p-3 rounded-xl border cursor-pointer transition-all flex gap-3 items-start",
                          accessLevel === level.title 
                            ? "border-[#FF9500] bg-[#FF9500]/5 ring-1 ring-[#FF9500]" 
                            : "border-black/5 hover:border-black/15 bg-white"
                        )}
                      >
                        <input 
                          type="radio" 
                          checked={accessLevel === level.title} 
                          onChange={() => {}} // Handled by div onClick
                          className="mt-1 w-4 h-4 text-[#007AFF]"
                        />
                        <div>
                          <div className="text-sm font-bold text-[#1C1C1E]">{level.title}</div>
                          <div className="text-[11px] text-[#8E8E93] leading-tight mt-0.5">{level.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {errorMessage && (
                  <div className="text-[#FF3B30] text-sm font-medium">{errorMessage}</div>
                )}

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={isSubmitting || !email}
                  className="w-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#8E8E93] hover:text-[#1C1C1E] font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 mt-4 cursor-pointer"
                >
                  {isSubmitting ? 'Inviting...' : 'Send Invite'}
                </button>
              </form>
            </div>

            {/* RIGHT: Team Members List */}
            <div className="lg:col-span-2 bg-white border border-black/10 rounded-2xl p-6 shadow-sm h-fit">
              <h3 className="text-lg font-bold text-[#1C1C1E] mb-6">
                Team Members ({store.teamMembers.length})
              </h3>
              
              <div className="space-y-3">
                {store.teamMembers.length === 0 ? (
                  <div className="text-sm text-[#8E8E93] py-4">No team members yet.</div>
                ) : (
                  store.teamMembers.map((member: any) => (
                    <div key={member.id} className="flex items-center gap-4 p-4 border border-black/5 rounded-2xl bg-[#F9F9F9]">
                      <div className="w-10 h-10 rounded-full bg-[#FF9500] flex items-center justify-center text-white font-bold">
                        {(member.name || member.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#1C1C1E]">{member.name || 'Invited User'}</div>
                        <div className="text-xs text-[#8E8E93]">{member.email}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}