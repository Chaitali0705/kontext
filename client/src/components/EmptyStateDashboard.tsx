import { CheckCircle, AlertTriangle, Users } from 'lucide-react';

interface EmptyStateDashboardProps {
    onAddDecision: () => void;
    onLogFailure: () => void;
    onInviteTeam: () => void;
}

export default function EmptyStateDashboard({
    onAddDecision,
    onLogFailure,
    onInviteTeam
}: EmptyStateDashboardProps) {
    return (
        <div className="flex-1 flex items-center justify-center px-6 py-12">
            <div className="max-w-2xl w-full">
                <h2 className="text-3xl font-bold text-[#1C1C1E] mb-2 text-center">
                    No decisions yet
                </h2>
                <p className="text-[#8E8E93] text-center mb-12">
                    Start building your knowledge base
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Add Decision Card */}
                    <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] group">
                        <div className="w-12 h-12 bg-[#FF9500]/15 rounded-xl flex items-center justify-center mb-4 transition-colors">
                            <CheckCircle className="w-6 h-6 text-[#FF9500]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#1C1C1E] mb-2">Add Decision</h3>
                        <p className="text-sm text-[#8E8E93] mb-4">
                            Document the decisions your team makes, including rationale and constraints.
                        </p>
                        <button
                            onClick={onAddDecision}
                            className="w-full bg-gradient-to-r from-[#FFB340] to-[#FF9500] hover:brightness-105 text-white font-medium py-2.5 rounded-xl transition-all"
                        >
                            Add First Decision
                        </button>
                    </div>

                    {/* Log Failure Card */}
                    <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] group">
                        <div className="w-12 h-12 bg-[#FF3B30]/15 rounded-xl flex items-center justify-center mb-4 transition-colors">
                            <AlertTriangle className="w-6 h-6 text-[#FF3B30]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#1C1C1E] mb-2">Log Failure</h3>
                        <p className="text-sm text-[#8E8E93] mb-4">
                            Capture what failed and why to build organizational learning.
                        </p>
                        <button
                            onClick={onLogFailure}
                            className="w-full bg-[#FF3B30] hover:brightness-95 text-white font-medium py-2.5 rounded-xl transition-all"
                        >
                            Log First Failure
                        </button>
                    </div>

                    {/* Invite Team Card */}
                    <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] group">
                        <div className="w-12 h-12 bg-[#6B7A3E]/15 rounded-xl flex items-center justify-center mb-4 transition-colors">
                            <Users className="w-6 h-6 text-[#6B7A3E]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#1C1C1E] mb-2">Invite Team</h3>
                        <p className="text-sm text-[#8E8E93] mb-4">
                            Add team members to collaborate and build knowledge together.
                        </p>
                        <button
                            onClick={onInviteTeam}
                            className="w-full bg-[#6B7A3E] hover:brightness-95 text-white font-medium py-2.5 rounded-xl transition-all"
                        >
                            Invite Team
                        </button>
                    </div>
                </div>

                {/* Info Section */}
                <div className="mt-12 bg-white/70 border border-black/10 rounded-2xl p-6 text-center backdrop-blur-xl">
                    <p className="text-[#1C1C1E] mb-2">
                        <span className="font-semibold text-[#6B7A3E]">Pro Tip:</span> The value of Kontext grows as your team adds more decisions and failures.
                    </p>
                    <p className="text-sm text-[#8E8E93]">
                        Start with your most recent decisions and failures to build a foundation.
                    </p>
                </div>
            </div>
        </div>
    );
}
