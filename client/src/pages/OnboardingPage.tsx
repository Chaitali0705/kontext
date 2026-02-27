import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useContextStore } from '../store/useContextStore';
import MainLayout from '../components/MainLayout';

export default function OnboardingPage() {
  const { contextId } = useParams<{ contextId: string }>();
  const navigate = useNavigate();
  const store = useContextStore();
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (!contextId) return;
    const context = store.contexts.find((c) => c.id === contextId);
    if (context && context.id !== store.activeContext?.id) {
      store.setActiveContext(context);
    }
  }, [contextId, store.contexts, store.activeContext?.id]);

  useEffect(() => {
    if (store.currentUser?.onboardingStep) {
      setCurrentStep(Math.min(4, Math.max(1, store.currentUser.onboardingStep)));
    }
  }, [store.currentUser?.onboardingStep]);

  const totalSteps = 4;

  const handleSkip = () => navigate(`/dashboard/${contextId}`);

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      const next = currentStep + 1;
      setCurrentStep(next);
      await store.updateOnboardingStep(next, false);
      return;
    }
    await store.markOnboardingComplete();
    navigate(`/dashboard/${contextId}`);
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
        <div className="h-16 border-b border-black/10 flex items-center justify-between px-8 bg-white/70 backdrop-blur-xl shrink-0">
          <h1 className="text-xl font-semibold text-[#1C1C1E] flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Onboarding
          </h1>
          <div className="text-sm text-[#8E8E93]">
            Step {currentStep} of {totalSteps}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-8 py-8">
          <div className="mb-8 flex gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  i < currentStep ? 'bg-[#FF9500]' : 'bg-black/10'
                }`}
              />
            ))}
          </div>

          <div className="bg-white border border-black/10 rounded-3xl p-8 mb-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            {currentStep === 1 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-[#1C1C1E]">Step 1: Project Overview</h2>
                <p className="text-[#8E8E93]">{store.activeContext.description || 'No description added yet.'}</p>
              </section>
            )}

            {currentStep === 2 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-[#1C1C1E]">Step 2: Decisions</h2>
                {store.decisions.length === 0 ? (
                  <p className="text-[#8E8E93]">No decisions yet. Add your first one from dashboard.</p>
                ) : (
                  <ul className="space-y-2">
                    {store.decisions.slice(0, 5).map((decision) => (
                      <li key={decision.id} className="p-3 rounded-xl bg-[#FFF4E5] border border-[#FFD9A3] text-[#1C1C1E]">
                        {decision.title}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {currentStep === 3 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-[#1C1C1E]">Step 3: Failures</h2>
                {store.failures.length === 0 ? (
                  <p className="text-[#8E8E93]">No failures logged yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {store.failures.slice(0, 5).map((failure) => (
                      <li key={failure.id} className="p-3 rounded-xl bg-[#FFEDEC] border border-[#FFC8C4] text-[#1C1C1E]">
                        {failure.title}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {currentStep === 4 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-[#1C1C1E]">Step 4: Team Roles</h2>
                {store.teamMembers.length === 0 ? (
                  <p className="text-[#8E8E93]">No members invited yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {store.teamMembers.slice(0, 8).map((member) => (
                      <li key={member.id} className="p-3 rounded-xl bg-[#F1F4E8] border border-[#D8DFC2] text-[#1C1C1E]">
                        {member.name || member.email} ({member.email})
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>

          <div className="flex gap-3 justify-between">
            <button
              onClick={handleSkip}
              className="bg-[#F2F2F7] hover:bg-[#EAEAEE] text-[#1C1C1E] font-medium px-6 py-2.5 rounded-xl transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="bg-gradient-to-r from-[#FFB340] to-[#FF9500] hover:brightness-105 text-white font-medium px-6 py-2.5 rounded-xl transition-all flex items-center gap-2"
            >
              {currentStep === totalSteps ? 'Complete' : 'Next'}
              {currentStep < totalSteps && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
