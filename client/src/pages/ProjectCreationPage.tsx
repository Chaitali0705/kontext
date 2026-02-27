import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, ArrowLeft } from 'lucide-react';
import { useContextStore } from '../store/useContextStore';
import { getApiErrorMessage } from '../services/api';

export default function ProjectCreationPage() {
    const navigate = useNavigate();
    const { createProject } = useContextStore();
    const [projectName, setProjectName] = useState('');
    const [description, setDescription] = useState('');
    const [teamSize, setTeamSize] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ projectName?: string; teamSize?: string }>({});
    const [globalError, setGlobalError] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const validate = () => {
        const errors: { projectName?: string; teamSize?: string } = {};
        if (!projectName.trim()) errors.projectName = 'Project name is required';
        if (!teamSize.trim()) errors.teamSize = 'Team size is required';
        return errors;
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setGlobalError('');

        const errors = validate();
        setFieldErrors(errors);
        if (Object.keys(errors).length) {
            setStatus('error');
            return;
        }

        setStatus('loading');
        try {
            const created = await createProject(
                projectName.trim(),
                description.trim() || undefined,
                teamSize
            );
            setStatus('success');
            if (created?.id) {
                navigate(`/dashboard/${created.id}`);
                return;
            }
            setGlobalError('Server error');
            setStatus('error');
        } catch (error) {
            setStatus('error');
            setGlobalError(getApiErrorMessage(error));
        }
    };

    return (
        <div className="min-h-screen bg-[#F2F2F7] text-[#1C1C1E] flex flex-col">
            {/* Header */}
            <div className="border-b border-black/10 bg-white/70 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-black/5 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-[#8E8E93] hover:text-[#1C1C1E]" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-br from-[#4A90E2] to-[#2E5C8A] p-2 rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                            <BrainCircuit className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-[#1C1C1E]">Kontext</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    <h1 className="text-3xl font-bold text-[#1C1C1E] mb-2">Create New Project</h1>
                    <p className="text-[#8E8E93] mb-8">
                        Start building your team's knowledge base by creating a project.
                    </p>

                    <form onSubmit={handleCreateProject} className="space-y-6 bg-white border border-black/10 rounded-3xl p-7 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                        {/* Project Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-[#1C1C1E] mb-2">
                                Project Name *
                            </label>
                            <input
                                id="name"
                                type="text"
                                placeholder="e.g., Mobile App Redesign"
                                value={projectName}
                                onChange={(e) =>
                                    setProjectName(e.target.value)
                                }
                                className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none focus:border-[#FF9500] transition-colors"
                            />
                            {fieldErrors.projectName && <p className="text-[#FF3B30] text-sm mt-1">{fieldErrors.projectName}</p>}
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-[#1C1C1E] mb-2">
                                Description / Goal
                            </label>
                            <textarea
                                id="description"
                                placeholder="What is this project about? What are the main goals?"
                                value={description}
                                onChange={(e) =>
                                    setDescription(e.target.value)
                                }
                                rows={4}
                                className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none focus:border-[#FF9500] transition-colors"
                            />
                        </div>

                        {/* Team Size */}
                        <div>
                            <label htmlFor="teamSize" className="block text-sm font-medium text-[#1C1C1E] mb-2">
                                Team Size
                            </label>
                            <select
                                id="teamSize"
                                value={teamSize}
                                onChange={(e) =>
                                    setTeamSize(e.target.value)
                                }
                                className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-[#1C1C1E] focus:outline-none focus:border-[#FF9500] transition-colors"
                            >
                                <option value="">Select team size...</option>
                                <option value="1-5">1-5 people</option>
                                <option value="6-10">6-10 people</option>
                                <option value="10-20">10-20 people</option>
                                <option value="21+">21+ people</option>
                            </select>
                            {fieldErrors.teamSize && <p className="text-[#FF3B30] text-sm mt-1">{fieldErrors.teamSize}</p>}
                        </div>

                        {/* Error Message */}
                        {globalError && <p className="text-[#FF3B30] mt-1 text-sm">{globalError}</p>}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full bg-gradient-to-r from-[#FFB340] to-[#FF9500] hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-2xl transition-all shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
                        >
                            {status === 'loading' ? 'Creating...' : 'Create Project'}
                        </button>
                    </form>

                    {/* Info Box */}
                    <div className="mt-8 bg-white/70 border border-black/10 rounded-2xl p-4 backdrop-blur-xl">
                        <p className="text-sm text-[#1C1C1E]">
                            <span className="font-semibold text-[#6B7A3E]">Tip:</span> You can invite team members and add decisions and failures after creating your project.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

