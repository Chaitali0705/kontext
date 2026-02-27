# LLM Integration Guide for Kontext

## Overview
Kontext now has a flexible LLM service layer that supports multiple AI providers. The infrastructure is ready - you just need to add your API credentials and uncomment the integration code.

---

## 🚀 Quick Start

### 1. Choose Your LLM Provider

Add to `server/.env`:

**Option A: OpenAI (GPT-4)**
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4-turbo
```

**Option B: Anthropic (Claude)**
```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

**Option C: Local LLM (Ollama)**
```env
LLM_PROVIDER=local
LOCAL_LLM_ENDPOINT=http://localhost:11434
LOCAL_LLM_MODEL=llama2
```

**Option D: Mock (No LLM)**
```env
LLM_PROVIDER=mock
# No API key needed - uses simple extraction
```

---

## 📦 Installation

### For OpenAI:
```bash
cd server
npm install openai
```

Then uncomment lines 56-69 in `server/src/services/llmService.ts`

### For Anthropic:
```bash
cd server
npm install @anthropic-ai/sdk
```

Then uncomment lines 90-102 in `server/src/services/llmService.ts`

### For Local LLM (Ollama):
1. Install Ollama: https://ollama.ai
2. Pull a model: `ollama pull llama2`
3. Uncomment lines 120-133 in `server/src/services/llmService.ts`

---

## 🔧 Implementation Guide

### File Structure
```
server/src/services/llmService.ts  <- Main LLM service
server/src/controllers/graphController.ts  <- Uses LLM for summaries
```

### Current Features Using LLM:
1. **Knowledge Graph Summaries** - Auto-generates concise summaries for graph nodes
2. **Decision Insights** (stub) - Ready for advanced analysis
3. **Failure Analysis** (stub) - Ready for root cause identification

---

## 📝 Integration Steps

### Step 1: Install SDK (example for OpenAI)
```bash
cd server
npm install openai
```

### Step 2: Update Environment Variables
```bash
# server/.env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-xxxxxxxxx
OPENAI_MODEL=gpt-4-turbo
```

### Step 3: Uncomment Integration Code

Open `server/src/services/llmService.ts` and uncomment the OpenAI section (lines 56-69):

```typescript
async function generateWithOpenAI(text: string, maxWords: number, context: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4-turbo';
    
    if (!apiKey) {
        console.warn('OPENAI_API_KEY not set, falling back to mock');
        return generateMockSummary(text, maxWords);
    }
    
    // Uncomment this:
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
        model: model,
        messages: [{
            role: 'system',
            content: `You are a concise summarizer for ${context}s. Generate a ${maxWords}-word summary.`
        }, {
            role: 'user',
            content: text
        }],
        max_tokens: maxWords * 2
    });
    return completion.choices[0].message.content || generateMockSummary(text, maxWords);
}
```

### Step 4: Restart Server
```bash
npm run dev
```

### Step 5: Test It!
1. Open Kontext
2. Navigate to any project
3. Click "Graph" button
4. You should see AI-generated summaries on graph nodes

---

## 🎯 Advanced Features (Ready to Implement)

### 1. Decision Insights
Function: `generateDecisionInsights()` in `llmService.ts`

**Use Case**: Generate risks and recommendations for decisions

**Example Implementation**:
```typescript
export async function generateDecisionInsights(decision) {
    const prompt = `Analyze this decision:
    Title: ${decision.title}
    Rationale: ${decision.rationale}
    Constraints: ${decision.constraints.join(', ')}
    Alternatives: ${decision.alternatives.join(', ')}
    
    Provide:
    1. Summary (20 words)
    2. Top 3 risks
    3. Top 3 recommendations`;
    
    // Call your LLM here
    const response = await callLLM(prompt);
    
    return {
        summary: extractSummary(response),
        risks: extractRisks(response),
        recommendations: extractRecommendations(response)
    };
}
```

### 2. Failure Analysis
Function: `generateFailureAnalysis()` in `llmService.ts`

**Use Case**: Root cause analysis and prevention steps

---

## 💡 Usage Examples

### In Controllers:
```typescript
import { generateAISummary } from '../services/llmService';

// Simple summary
const summary = await generateAISummary('Your long text here', 15);

// With context
const summary = await generateAISummary({
    text: 'Your decision rationale...',
    maxWords: 20,
    context: 'decision'
});
```

### Testing:
```bash
# Test with mock (no API needed)
LLM_PROVIDER=mock npm run dev

# Test with OpenAI
LLM_PROVIDER=openai npm run dev
```

---

## 🔒 Security Notes

1. **Never commit API keys** - Always use environment variables
2. **Add to .gitignore**:
   ```
   .env
   .env.local
   ```
3. **Rate limiting** - Consider adding rate limits for LLM calls
4. **Cost monitoring** - OpenAI/Anthropic charge per token

---

## 🐛 Troubleshooting

**Issue**: "OPENAI_API_KEY not set"
- **Fix**: Add key to `server/.env` file

**Issue**: Summaries still use mock
- **Fix**: Set `LLM_PROVIDER=openai` in .env

**Issue**: "Cannot find module 'openai'"
- **Fix**: Run `npm install openai` in server directory

**Issue**: Slow response times
- **Fix**: Consider caching summaries in database

---

## 📊 Cost Optimization

### Caching Strategy:
1. Store generated summaries in database
2. Only regenerate if content changes
3. Add `summary` field to Decision/Failure models

### Batch Processing:
1. Generate summaries async in background
2. Use queue system (Bull, BullMQ)
3. Process during off-peak hours

---

## 🚀 Next Steps

1. ✅ Infrastructure is ready
2. 🔧 You integrate your LLM API
3. 🎨 Extend with more AI features:
   - Chat-based assistant
   - Smart search
   - Decision recommendations
   - Automated tagging

---

**The foundation is built. Plug in your LLM and watch Kontext come alive with AI!** 🧠✨
