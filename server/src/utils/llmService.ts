// server/src/utils/llmService.ts
// LLM Service for AI-powered features in Kontext

interface SummaryRequest {
    text: string;
    maxWords?: number;
    context?: 'decision' | 'failure' | 'general';
}

/**
 * Generate AI summary using configured LLM provider
 * Supports: OpenAI, Anthropic, Local LLM, or Mock (fallback)
 */
export async function generateAISummary(request: SummaryRequest | string, maxWords?: number): Promise<string> {
    // Handle both object and string inputs for backward compatibility
    const text = typeof request === 'string' ? request : request.text;
    const words = typeof request === 'string' ? (maxWords || 15) : (request.maxWords || 15);
    const context = typeof request === 'object' ? request.context : 'general';
    
    const provider = (process.env.LLM_PROVIDER as any) || 'mock';
    
    switch (provider) {
        case 'openai':
            return await generateWithOpenAI(text, words, context || 'general');
        case 'anthropic':
            return await generateWithAnthropic(text, words, context || 'general');
        case 'local':
            return await generateWithLocalLLM(text, words, context || 'general');
        default:
            return generateMockSummary(text, words);
    }
}

/**
 * OpenAI integration (GPT-4, GPT-3.5, etc.)
 * TODO: Install 'openai' package: npm install openai
 */
async function generateWithOpenAI(text: string, maxWords: number, context: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4-turbo';
    
    if (!apiKey) {
        console.warn('⚠️  OPENAI_API_KEY not set, falling back to mock summaries');
        return generateMockSummary(text, maxWords);
    }
    
    try {
        // TODO: Uncomment after installing 'openai' package
        // const { OpenAI } = require('openai');
        // const openai = new OpenAI({ apiKey });
        // const completion = await openai.chat.completions.create({
        //     model: model,
        //     messages: [{
        //         role: 'system',
        //         content: `You are a concise summarizer for ${context}s. Generate a ${maxWords}-word summary.`
        //     }, {
        //         role: 'user',
        //         content: text
        //     }],
        //     max_tokens: maxWords * 2
        // });
        // return completion.choices[0].message.content || generateMockSummary(text, maxWords);
        
        console.log('OpenAI integration ready but not activated. Using mock.');
        return generateMockSummary(text, maxWords);
    } catch (error) {
        console.error('OpenAI API error:', error);
        return generateMockSummary(text, maxWords);
    }
}

/**
 * Anthropic integration (Claude)
 * TODO: Install '@anthropic-ai/sdk' package: npm install @anthropic-ai/sdk
 */
async function generateWithAnthropic(text: string, maxWords: number, context: string): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229';
    
    if (!apiKey) {
        console.warn('⚠️  ANTHROPIC_API_KEY not set, falling back to mock summaries');
        return generateMockSummary(text, maxWords);
    }
    
    try {
        // TODO: Uncomment after installing '@anthropic-ai/sdk' package
        // const { Anthropic } = require('@anthropic-ai/sdk');
        // const anthropic = new Anthropic({ apiKey });
        // const message = await anthropic.messages.create({
        //     model: model,
        //     max_tokens: maxWords * 2,
        //     messages: [{
        //         role: 'user',
        //         content: `Summarize this ${context} in ${maxWords} words or less:\n\n${text}`
        //     }]
        // });
        // return message.content[0].text || generateMockSummary(text, maxWords);
        
        console.log('Anthropic integration ready but not activated. Using mock.');
        return generateMockSummary(text, maxWords);
    } catch (error) {
        console.error('Anthropic API error:', error);
        return generateMockSummary(text, maxWords);
    }
}

/**
 * Local LLM integration (Ollama, LlamaCpp, etc.)
 */
async function generateWithLocalLLM(text: string, maxWords: number, context: string): Promise<string> {
    const endpoint = process.env.LOCAL_LLM_ENDPOINT || 'http://localhost:11434';
    const model = process.env.LOCAL_LLM_MODEL || 'llama2';
    
    try {
        const response = await fetch(`${endpoint}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                prompt: `Summarize this ${context} in exactly ${maxWords} words or less:\n\n${text}`,
                stream: false
            })
        });
        
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.response || generateMockSummary(text, maxWords);
    } catch (error) {
        console.error('Local LLM error:', error);
        console.log('Falling back to mock summary');
        return generateMockSummary(text, maxWords);
    }
}

/**
 * Mock summary generator (extraction-based, no LLM required)
 * This is the fallback/default implementation - works without any API
 */
function generateMockSummary(text: string, maxWords: number): string {
    // Extract first meaningful sentence
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
    if (sentences.length === 0) return text.substring(0, 100);
    
    const firstSentence = sentences[0];
    const words = firstSentence.split(' ');
    
    if (words.length <= maxWords) {
        return firstSentence;
    }
    
    return words.slice(0, maxWords).join(' ') + '...';
}

/**
 * Generate contextual insights for decisions (Advanced AI feature)
 * TODO: Implement with your LLM
 */
export async function generateDecisionInsights(decision: {
    title: string;
    rationale: string;
    constraints: string[];
    alternatives: string[];
}): Promise<{
    summary: string;
    risks: string[];
    recommendations: string[];
}> {
    return {
        summary: await generateAISummary({ 
            text: `${decision.title}. ${decision.rationale}`,
            maxWords: 20,
            context: 'decision'
        }),
        risks: [], // TODO: Implement with LLM
        recommendations: [] // TODO: Implement with LLM
    };
}

/**
 * Generate failure analysis (Advanced AI feature)
 * TODO: Implement with your LLM
 */
export async function generateFailureAnalysis(failure: {
    title: string;
    whatFailed: string;
    whyFailed: string;
}): Promise<{
    summary: string;
    rootCauses: string[];
    preventionSteps: string[];
}> {
    return {
        summary: await generateAISummary({ 
            text: `${failure.title}. ${failure.whyFailed}`,
            maxWords: 20,
            context: 'failure'
        }),
        rootCauses: [], // TODO: Implement with LLM
        preventionSteps: [] // TODO: Implement with LLM
    };
}
