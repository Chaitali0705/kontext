import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { metricsService } from '../services/api';

interface ProjectContext {
  projectId: string;
  projectName: string;
  projectDescription: string;
  contextSummary: string;
  statistics: {
    totalDecisions: number;
    totalFailures: number;
    teamSize: number;
    tagsCount: number;
    constraintsCount: number;
  };
  topTags: string[];
  topConstraints: string[];
  recentDecisions: any[];
  recentFailures: any[];
  teamMembers: any[];
}

interface ProjectInsights {
  insights: any[];
  recommendations: string[];
  patterns: {
    topTags: any[];
    topConstraints: any[];
  };
  summary: {
    totalDecisions: number;
    totalFailures: number;
    uniqueTags: number;
    uniqueConstraints: number;
  };
}

export default function ProjectContextPage() {
  const { contextId } = useParams<{ contextId: string }>();
  const [context, setContext] = useState<ProjectContext | null>(null);
  const [insights, setInsights] = useState<ProjectInsights | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'insights'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjectInfo = async () => {
      if (!contextId) return;

      setLoading(true);
      try {
        const [contextData, insightsData] = await Promise.all([
          metricsService.getProjectContext(contextId),
          metricsService.getProjectInsights(contextId)
        ]);

        setContext(contextData);
        setInsights(insightsData);
      } catch (error) {
        console.error('Failed to fetch project context', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectInfo();
  }, [contextId]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-[#F2F2F7] border-t-[#FF9500] animate-spin mx-auto mb-4"></div>
            <p className="text-[#8E8E93]">Loading project context...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!context) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-[#8E8E93]">Failed to load project context</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#1C1C1E] mb-3">{context.projectName}</h1>
          <p className="text-lg text-[#8E8E93] mb-6">{context.projectDescription || 'No description provided'}</p>

          {/* AI Summary */}
          <div className="bg-gradient-to-r from-[#FFF5E6] to-[#FFE8CC] border border-[#FFD580] rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✨</span>
              <div>
                <h3 className="font-semibold text-[#1C1C1E] mb-2">AI-Generated Overview</h3>
                <p className="text-[#3C3C43]">{context.contextSummary}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 mb-8 border-b border-black/10">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-2 font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'text-[#FF9500] border-b-2 border-[#FF9500]'
                : 'text-[#8E8E93] hover:text-[#3C3C43]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`pb-4 px-2 font-semibold transition-colors ${
              activeTab === 'insights'
                ? 'text-[#FF9500] border-b-2 border-[#FF9500]'
                : 'text-[#8E8E93] hover:text-[#3C3C43]'
            }`}
          >
            AI Insights
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                <div className="text-3xl font-bold text-[#FF9500] mb-2">
                  {context.statistics.totalDecisions}
                </div>
                <div className="text-sm text-[#8E8E93]">Total Decisions</div>
              </div>

              <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                <div className="text-3xl font-bold text-[#FF3B30] mb-2">
                  {context.statistics.totalFailures}
                </div>
                <div className="text-sm text-[#8E8E93]">Documented Failures</div>
              </div>

              <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                <div className="text-3xl font-bold text-[#6B7A3E] mb-2">
                  {context.statistics.teamSize}
                </div>
                <div className="text-sm text-[#8E8E93]">Team Members</div>
              </div>

              <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                <div className="text-3xl font-bold text-[#34C759] mb-2">
                  {context.statistics.tagsCount}
                </div>
                <div className="text-sm text-[#8E8E93]">Focus Areas</div>
              </div>

              <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                <div className="text-3xl font-bold text-[#007AFF] mb-2">
                  {context.statistics.constraintsCount}
                </div>
                <div className="text-sm text-[#8E8E93]">Key Constraints</div>
              </div>
            </div>

            {/* Tags & Constraints */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-black/10 rounded-2xl p-6">
                <h3 className="font-semibold text-[#1C1C1E] mb-4">🏷️ Top Focus Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {context.topTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-[#E8F5E9] text-[#6B7A3E] px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-black/10 rounded-2xl p-6">
                <h3 className="font-semibold text-[#1C1C1E] mb-4">⚙️ Key Constraints</h3>
                <div className="flex flex-wrap gap-2">
                  {context.topConstraints.map((constraint, idx) => (
                    <span
                      key={idx}
                      className="bg-[#FFE8CC] text-[#FF9500] px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {constraint}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Decisions */}
              <div className="bg-white border border-black/10 rounded-2xl p-6">
                <h3 className="font-semibold text-[#1C1C1E] mb-4">📋 Recent Decisions</h3>
                <div className="space-y-3">
                  {context.recentDecisions.length > 0 ? (
                    context.recentDecisions.map((decision) => (
                      <div key={decision.id} className="pb-3 border-b border-black/5 last:border-0">
                        <div className="font-medium text-[#1C1C1E] text-sm">{decision.title}</div>
                        <div className="text-xs text-[#8E8E93] mt-1">
                          by {decision.author} • {new Date(decision.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[#8E8E93]">No decisions logged yet</p>
                  )}
                </div>
              </div>

              {/* Recent Failures */}
              <div className="bg-white border border-black/10 rounded-2xl p-6">
                <h3 className="font-semibold text-[#1C1C1E] mb-4">⚠️ Recent Failures</h3>
                <div className="space-y-3">
                  {context.recentFailures.length > 0 ? (
                    context.recentFailures.map((failure) => (
                      <div key={failure.id} className="pb-3 border-b border-black/5 last:border-0">
                        <div className="font-medium text-[#1C1C1E] text-sm">{failure.title}</div>
                        <div className="text-xs text-[#8E8E93] mt-1">
                          by {failure.author} • {new Date(failure.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[#8E8E93]">No failures documented yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Team Members */}
            {context.teamMembers.length > 0 && (
              <div className="bg-white border border-black/10 rounded-2xl p-6">
                <h3 className="font-semibold text-[#1C1C1E] mb-4">👥 Team Members</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {context.teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="p-4 bg-[#F2F2F7] rounded-xl text-center"
                    >
                      <div className="font-medium text-[#1C1C1E]">{member.name || 'Team Member'}</div>
                      <div className="text-xs text-[#8E8E93]">{member.email}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && insights && (
          <div className="space-y-6">
            {/* Insights List */}
            {insights.insights.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-[#1C1C1E] mb-4">🤖 AI-Powered Insights</h2>
                {insights.insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className={`p-6 rounded-2xl border ${
                      insight.type === 'warning'
                        ? 'bg-[#FFF5E6] border-[#FFD580]'
                        : insight.type === 'success'
                        ? 'bg-[#E8F5E9] border-[#A5D6A7]'
                        : 'bg-[#E3F2FD] border-[#90CAF9]'
                    }`}
                  >
                    <h4 className="font-semibold text-[#1C1C1E] mb-2">{insight.title}</h4>
                    <p className="text-[#3C3C43] text-sm">{insight.description}</p>
                    {insight.relatedCount && (
                      <div className="text-xs text-[#8E8E93] mt-3">
                        Related items: {insight.relatedCount}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {insights.recommendations.length > 0 && (
              <div className="bg-[#E8F5E9] border border-[#A5D6A7] rounded-2xl p-6">
                <h3 className="font-semibold text-[#1C1C1E] mb-4">💡 Recommendations</h3>
                <ul className="space-y-2">
                  {insights.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex gap-3 text-[#3C3C43]">
                      <span className="text-[#34C759]">✓</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pattern Summary */}
            {insights.patterns && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {insights.patterns.topTags.length > 0 && (
                  <div className="bg-white border border-black/10 rounded-2xl p-6">
                    <h4 className="font-semibold text-[#1C1C1E] mb-4">📈 Focus Area Patterns</h4>
                    <div className="space-y-3">
                      {insights.patterns.topTags.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-[#3C3C43]">{item.tag}</span>
                          <div className="bg-[#E8F5E9] text-[#6B7A3E] px-3 py-1 rounded-full text-sm font-medium">
                            {item.count} items
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {insights.patterns.topConstraints.length > 0 && (
                  <div className="bg-white border border-black/10 rounded-2xl p-6">
                    <h4 className="font-semibold text-[#1C1C1E] mb-4">⚙️ Constraint Patterns</h4>
                    <div className="space-y-3">
                      {insights.patterns.topConstraints.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-[#3C3C43]">{item.constraint}</span>
                          <div className="bg-[#FFE8CC] text-[#FF9500] px-3 py-1 rounded-full text-sm font-medium">
                            {item.count} items
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
