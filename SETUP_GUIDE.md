# API Keys & Services Setup Guide

This guide walks you through obtaining and configuring all the API keys required for the AI Workflow Builder.

---

## Quick Reference

| Service | Required? | Purpose | Free Tier? |
|---------|-----------|---------|------------|
| OpenRouter | ✅ Required | LLM API (GPT, Gemini, Claude, etc.) | $5 free credits |
| OpenAI | ✅ Required | Text Embeddings | Pay-as-you-go |
| SerpAPI | ⚪ Optional | Web Search | 100 free searches/month |
| Cloudflare R2 | ⚪ Optional | File Storage | 10GB free |

---

## 1. OpenRouter API Key

OpenRouter provides access to 100+ LLMs through a single API, including GPT-5.2, Gemini 3, Claude 4.5, DeepSeek, and more.

### Steps:
1. Go to [openrouter.ai](https://openrouter.ai/)
2. Click **"Sign In"** (use Google, GitHub, or email)
3. Navigate to **Keys** in the left sidebar
4. Click **"Create Key"**
5. Give it a name (e.g., "AI Workflow Builder")
6. Copy the key (starts with `sk-or-...`)

### Configuration:
```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Verify:
```bash
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer sk-or-v1-your-key-here"
```

---

## 2. OpenAI API Key

Used for generating text embeddings (`text-embedding-3-small`) to power the Knowledge Base vector search.

### Steps:
1. Go to [platform.openai.com](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to **API Keys** in the left sidebar
4. Click **"Create new secret key"**
5. Name it (e.g., "Embeddings")
6. Copy the key (starts with `sk-...`)

### Configuration:
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Pricing:
- `text-embedding-3-small`: ~$0.00002 per 1K tokens
- A typical PDF (~10 pages) costs < $0.01 to embed

### Verify:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-your-key-here"
```

---

## 3. SerpAPI Key (Optional)

Enables the "Web Search" toggle in the LLM Engine node to fetch real-time search results.

### Steps:
1. Go to [serpapi.com](https://serpapi.com/)
2. Click **"Register"** (Google or email)
3. After login, go to **Dashboard**
4. Find your API key in the top section
5. Copy the key

### Configuration:
```env
SERPAPI_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Free Tier:
- 100 searches per month
- No credit card required

### Verify:
```bash
curl "https://serpapi.com/search?q=test&api_key=YOUR_KEY"
```

---

## 4. Cloudflare R2 (Optional)

Used for storing uploaded PDF files. If not configured, the app will still work but file uploads will fail.

### Steps:
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com/)
2. Sign in or create a free account
3. In the sidebar, click **R2 Object Storage**
4. Click **"Create bucket"**
5. Name it (e.g., `ai-workflow-docs`)
6. Go to **R2 > Overview > Manage R2 API Tokens**
7. Click **"Create API Token"**
8. Select permissions: **Object Read & Write**
9. Copy the **Access Key ID** and **Secret Access Key**

### Configuration:
```env
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=ai-workflow-docs
R2_PUBLIC_URL_BASE=https://your-bucket.r2.dev  # Optional
```

### Finding Your Account ID:
- Go to any Cloudflare dashboard page
- Look at the URL: `dash.cloudflare.com/ACCOUNT_ID_HERE/...`

---

## Complete `.env` Example

Create a file at `backend/.env`:

```env
# ==========================================
# Database
# ==========================================
DATABASE_URL=postgresql://user:password@localhost/aiworkflow

# ==========================================
# AI Services (Required)
# ==========================================
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx

# ==========================================
# Web Search (Optional)
# ==========================================
SERPAPI_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ==========================================
# File Storage (Optional)
# ==========================================
R2_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=ai-workflow-docs
R2_PUBLIC_URL_BASE=https://your-bucket.r2.dev
```

---

## Troubleshooting

### "OPENAI_API_KEY not found"
- Make sure `.env` is in the `backend/` directory
- Restart the backend server after adding keys
- Check for typos in variable names

### "401 Unauthorized" from OpenRouter
- Verify your API key is correct
- Check if you have remaining credits at openrouter.ai/credits
- Ensure the key hasn't been revoked

### "SerpAPI returned no results"
- Free tier has rate limits
- Check your usage at serpapi.com/dashboard
- Verify the API key is correct

### "R2 Upload Error"
- Verify all 4 R2 environment variables are set
- Check bucket permissions (Object Read & Write)
- Ensure the bucket exists

---

## Security Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use different keys for dev/prod** - Create separate API keys
3. **Rotate keys periodically** - Delete old keys after rotation
4. **Monitor usage** - Set up billing alerts on paid services
5. **Use environment variables in Docker** - Pass via `docker-compose.yml`

---

## Cost Estimation

| Usage | OpenRouter | OpenAI | SerpAPI | R2 |
|-------|------------|--------|---------|-----|
| Light (10 queries/day) | ~$1/month | ~$0.50/month | Free | Free |
| Medium (100 queries/day) | ~$10/month | ~$2/month | ~$10/month | Free |
| Heavy (1000 queries/day) | ~$50/month | ~$10/month | ~$50/month | ~$1/month |

*Costs vary based on model selection and document sizes.*
