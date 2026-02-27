import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { useContextStore } from './store/useContextStore';

// Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const ProjectCreationPage = lazy(() => import('./pages/ProjectCreationPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TeamManagementPage = lazy(() => import('./pages/TeamManagementPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const KnowledgeGraphPage = lazy(() => import('./pages/KnowledgeGraphPage'));

export default function App() {
  const store = useContextStore();

  useEffect(() => {
    store.fetchCurrentUser();
    store.fetchContexts();
  }, []);

  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-[#8E8E93] bg-[#F2F2F7]">Loading...</div>}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create-project" element={<ProjectCreationPage />} />
        <Route path="/dashboard/:contextId" element={<DashboardPage />} />
        <Route path="/team/:contextId" element={<TeamManagementPage />} />
        <Route path="/onboarding/:contextId" element={<OnboardingPage />} />
        <Route path="/graph/:contextId" element={<KnowledgeGraphPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
