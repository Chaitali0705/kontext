# Ollama Local LLM Setup Guide

## Step-by-Step Installation

### 1. Install Ollama
Download and install from: https://ollama.ai/download

Or use command line:
```bash
# Windows (PowerShell as Admin)
winget install Ollama.Ollama

# After install, Ollama runs as a background service
```

### 2. Pull a Model
Open a new terminal and run:

```bash
# Recommended: Llama 2 (7B parameters, fast)
ollama pull llama2

# OR Mistral (better quality)
ollama pull mistral

# OR Phi-2 (smallest, fastest)
ollama pull phi
```

This will download the model (~4GB for llama2).

### 3. Test Ollama
```bash
# Test the model
ollama run llama2

# Type a message, you should get a response
# Type /bye to exit
```

### 4. Verify API is Running
```bash
# Check if Ollama API is accessible
curl http://localhost:11434/api/tags
```

You should see a list of installed models.

---

## Integration Steps

### 1. Update .env
Add to `server/.env`:
```env
LLM_PROVIDER=local
LOCAL_LLM_ENDPOINT=http://localhost:11434
LOCAL_LLM_MODEL=llama2
```

### 2. Update llmService.ts
The integration code needs to be uncommented.

### 3. Restart Server
```bash
cd server
npm run dev
```

### 4. Test in Kontext
1. Open a project
2. Go to Graph view
3. Summaries should now be AI-generated!

---

## Troubleshooting

**Issue: "Connection refused"**
- Make sure Ollama is running: `ollama serve`

**Issue: Slow responses**
- Use a smaller model like `phi` instead of `llama2`

**Issue: Out of memory**
- Close other applications
- Use a smaller model

---

## Model Comparison

| Model | Size | Speed | Quality | RAM Needed |
|-------|------|-------|---------|------------|
| phi | 2.7B | ⚡⚡⚡ | ⭐⭐ | 4GB |
| llama2 | 7B | ⚡⚡ | ⭐⭐⭐ | 8GB |
| mistral | 7B | ⚡⚡ | ⭐⭐⭐⭐ | 8GB |
| llama2:13b | 13B | ⚡ | ⭐⭐⭐⭐ | 16GB |

---

Ready to start! Follow the steps above.
