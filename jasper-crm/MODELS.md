# JASPER AI Model Routing Strategy

> Audited and designed by Bakiel Nxumalo, Technical Director - Kutlwano Holdings

## Overview

JASPER uses a 6-tier AI model routing strategy via OpenRouter to optimise cost and performance across different task types.

---

## Model Tiers

| Tier | Name | Model ID | Input/Output Cost | Task Allocation |
|------|------|----------|-------------------|-----------------|
| **1** | Workhorse | `openai/gpt-5-nano` | $0.05 / $0.40 per 1M | 55-70% |
| **2** | Precision | `openai/gpt-5.1-codex-mini` | $0.25 / $2.00 per 1M | 15% |
| **2.5** | Research | `moonshotai/kimi-k2` | $0.45 / $2.35 per 1M | 10% |
| **3** | Long-form | `deepseek/deepseek-chat` | $0.27 / $0.40 per 1M | 15-20% |
| **Budget** | Ultra-simple | `deepseek/deepseek-r1-distill-qwen-8b` | $0.02 / $0.10 per 1M | 5% |
| **Fallback** | Free | `google/gemini-2.0-flash-exp:free` | FREE | Fallback |

---

## Task Routing

### Tier 1: Workhorse (GPT-5 Nano)
**55-70% of all tasks**

- Lead scoring and qualification
- Email classification and sorting
- Data extraction from forms
- Intent classification
- Quick categorisation tasks

**Why:** Fastest, cheapest OpenAI model. Optimised for high-volume, low-latency tasks.

---

### Tier 2: Precision (GPT-5.1-Codex-Mini)
**15% of tasks**

- Client-facing email drafts
- Code generation
- Professional correspondence
- API integrations
- Template generation

**Why:** Higher quality output for client-visible content. Code-optimised.

---

### Tier 2.5: Research (Kimi K2)
**10% of tasks**

- DFI matching and analysis
- Deep research queries
- Complex reasoning tasks
- Multi-step analysis
- Funding opportunity identification

**Why:** Strong reasoning capabilities at competitive pricing. Excellent for research-heavy tasks.

---

### Tier 3: Long-form (DeepSeek Chat)
**15-20% of tasks**

- Proposal drafting
- Blog content creation
- Detailed reports
- Executive summaries
- Investment memoranda

**Why:** Best value for long-form content. High quality at low cost.

---

### Budget Tier (DeepSeek R1 Distill Qwen 8B)
**5% of tasks**

- Ultra-simple queries
- Basic formatting
- Simple translations
- Trivial classifications

**Why:** Absolute minimum cost for trivial tasks.

---

### Fallback Tier (Gemini 2.0 Flash - FREE)
**Fallback only**

- Used when other models fail
- Rate limit overflow
- Non-critical background tasks

**Why:** Zero cost fallback ensures service continuity.

---

## Cost Optimisation

### Estimated Monthly Cost (1M tokens/month)

| Scenario | Tokens | Cost |
|----------|--------|------|
| Light usage | 500K | ~$0.15 |
| Medium usage | 2M | ~$0.60 |
| Heavy usage | 10M | ~$3.00 |

### Cost Comparison vs Single Model

| Strategy | 10M tokens/month |
|----------|------------------|
| GPT-4o only | ~$25.00 |
| Claude 3.5 only | ~$30.00 |
| **JASPER tiered** | ~$3.00 |

**Savings: 88-90%**

---

## Implementation

```python
from services import AITask, ai_router

# Lead qualification (Tier 1 - GPT-5 Nano)
result = await ai_router.route(
    task=AITask.CLASSIFICATION,
    prompt="Score this lead: ...",
    system_prompt="You are a lead qualification assistant..."
)

# Client email (Tier 2 - Codex-Mini)
result = await ai_router.route(
    task=AITask.PRECISION,
    prompt="Draft a follow-up email...",
    system_prompt="You are a professional business writer..."
)

# DFI research (Tier 2.5 - Kimi K2)
result = await ai_router.route(
    task=AITask.RESEARCH,
    prompt="Identify suitable DFIs for...",
    system_prompt="You are a DFI funding specialist..."
)

# Proposal draft (Tier 3 - DeepSeek)
result = await ai_router.route(
    task=AITask.LONG_FORM,
    prompt="Write a funding proposal...",
    system_prompt="You are a financial proposal writer...",
    max_tokens=4000
)
```

---

## OpenRouter Configuration

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

All requests go through: `https://openrouter.ai/api/v1/chat/completions`

---

## Model Sources

- [GPT-5 Nano](https://openrouter.ai/openai/gpt-5-nano)
- [GPT-5.1-Codex-Mini](https://openrouter.ai/openai/gpt-5.1-codex-mini)
- [Kimi K2](https://openrouter.ai/moonshotai/kimi-k2)
- [DeepSeek Chat](https://openrouter.ai/deepseek/deepseek-chat)
- [DeepSeek R1 Distill](https://openrouter.ai/deepseek/deepseek-r1-distill-qwen-8b)
- [Gemini 2.0 Flash Free](https://openrouter.ai/google/gemini-2.0-flash-exp:free)

---

*Last updated: December 2025*
