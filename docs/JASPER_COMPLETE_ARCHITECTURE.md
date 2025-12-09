# JASPER™ Financial Architecture
## Complete Automation System

**Version:** 2.1 (Consolidated + PHP Backend Option)
**Architecture:** PHP 8.x + MySQL + Google Auth (Primary) | Python + Claude SDK (Automation)
**Author:** Bakiel Ben Shomriel Nxumalo
**Last Updated:** December 7, 2025

---

# Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [AI Model Strategy](#3-ai-model-strategy)
4. [Hostinger MCP Integration](#4-hostinger-mcp-integration)
5. [PHP Backend Architecture](#5-php-backend-architecture) ⭐ NEW
6. [Database Schema](#6-database-schema)
7. [Python Services](#7-python-services)
8. [Email Infrastructure](#8-email-infrastructure)
9. [Automation Workflows](#9-automation-workflows)
10. [Cost Analysis](#10-cost-analysis)
11. [Implementation Plan](#11-implementation-plan)
12. [Appendix: Code Templates](#12-appendix-code-templates)

---

# 1. Executive Summary

## What This Document Is

This is the complete technical specification for JASPER™ Financial Architecture's backend infrastructure and automation using:

- **PHP 8.x Backend** for Client Portal & API (Native Hostinger hosting)
- **MySQL Database** for models, clients, projects (FREE with Hostinger)
- **Google OAuth 2.0** for authentication (FREE tier)
- **Pure Python** for automation services (optional VPS)
- **Claude SDK** via OpenRouter for AI operations
- **Hostinger MCP** for infrastructure control (CONFIGURED)
- **GPT-5 Nano + DeepSeek V3.2** for cost-optimized AI

## Why Not n8n?

| n8n | Pure Python + Claude |
|-----|----------------------|
| Visual debugging (complex) | Code I can fix directly |
| Node limitations | Full flexibility |
| Learning curve | Just talk to Claude |
| Scaling issues | No ceiling |
| "Doesn't scale for AI agents" | Built for AI agents |

## The Bottom Line

| Metric | Value |
|--------|-------|
| **Monthly AI cost** | ~R131 ($7.30) |
| **Monthly infrastructure** | R0 (prepaid) |
| **One JASPER client** | $12,000+ |
| **ROI** | 1 client = 7+ years of costs |

---

# 2. Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         JASPER AUTOMATION SYSTEM                             │
│                              December 2025                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     YOUR MAC (Control Center)                        │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  Claude Max (Unlimited)              Hostinger MCP                  │   │
│  │  ────────────────────               ─────────────                   │   │
│  │  • Strategic conversations          • VPS control via conversation │   │
│  │  • Complex analysis                 • Docker management            │   │
│  │  • Proposal final review            • DNS updates                  │   │
│  │  • Document creation                • Firewall rules               │   │
│  │  • This conversation                • Backups & snapshots          │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    │ SSH / API                              │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     HOSTINGER VPS (srv1145603)                       │   │
│  │                     72.61.201.237 | 2 CPU | 8GB RAM                  │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │   │
│  │  │   PostgreSQL     │  │      Redis       │  │   Milvus Lite    │  │   │
│  │  │   (CRM Database) │  │   (Cache/Queue)  │  │   (Vector DB)    │  │   │
│  │  │                  │  │                  │  │                  │  │   │
│  │  │  • contacts      │  │  • session data  │  │  • embeddings    │  │   │
│  │  │  • projects      │  │  • task queue    │  │  • DFI matching  │  │   │
│  │  │  • activities    │  │  • rate limits   │  │  • doc search    │  │   │
│  │  │  • emails        │  │                  │  │                  │  │   │
│  │  │  • ai_costs      │  │                  │  │                  │  │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │                    PYTHON SERVICES (systemd)                  │  │   │
│  │  ├──────────────────────────────────────────────────────────────┤  │   │
│  │  │                                                               │  │   │
│  │  │  email_receiver.py     IMAP listener, 24/7 monitoring        │  │   │
│  │  │  form_handler.py       Flask webhooks for Tally forms        │  │   │
│  │  │  lead_processor.py     AI scoring via GPT-5 Nano             │  │   │
│  │  │  email_sender.py       SMTP automation via Hostinger         │  │   │
│  │  │  proposal_gen.py       Draft generation via DeepSeek V3.2    │  │   │
│  │  │  scheduler.py          Cron-like follow-ups and reminders    │  │   │
│  │  │  blog_generator.py     Content pipeline (DS + Nano Banana)   │  │   │
│  │  │                                                               │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │                    HOSTINGER SMTP (FREE)                      │  │   │
│  │  │                    smtp.hostinger.com:587                     │  │   │
│  │  │                    30,000 emails/month per mailbox            │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    │ HTTPS API Calls                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     EXTERNAL APIs (OpenRouter)                       │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │   │
│  │  │  GPT-5 Nano    │  │ DeepSeek V3.2  │  │ DeepSeek-Qwen  │        │   │
│  │  │  $0.05/$0.40   │  │  $0.27/$0.40   │  │  $0.02/$0.10   │        │   │
│  │  │                │  │                │  │                │        │   │
│  │  │  70% of tasks  │  │  25% of tasks  │  │  5% of tasks   │        │   │
│  │  │  • classify    │  │  • proposals   │  │  • ultra-simple│        │   │
│  │  │  • extract     │  │  • blogs       │  │  • fallback    │        │   │
│  │  │  • score       │  │  • reports     │  │                │        │   │
│  │  │  • quick tasks │  │  • long-form   │  │                │        │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘        │   │
│  │                                                                      │   │
│  │  ┌────────────────┐  ┌────────────────┐                             │   │
│  │  │ Nano Banana Pro│  │ Gemini Flash   │                             │   │
│  │  │ (PREPAID)      │  │ (FREE)         │                             │   │
│  │  │                │  │                │                             │   │
│  │  │  • All images  │  │  • Fallback    │                             │   │
│  │  │  • Unlimited   │  │  • Simple Q&A  │                             │   │
│  │  └────────────────┘  └────────────────┘                             │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Cost |
|-------|------------|------|
| **Compute** | Hostinger VPS (2 CPU, 8GB RAM) | R0 (prepaid 24 months) |
| **Database** | PostgreSQL 16 | Free (self-hosted) |
| **Cache** | Redis 7 | Free (self-hosted) |
| **Vector DB** | Milvus Lite | Free (self-hosted) |
| **Email** | Hostinger SMTP | Free (included) |
| **AI Tier 1** | GPT-5 Nano via OpenRouter | ~R49/month |
| **AI Tier 2** | GPT-5.1-Codex-Mini via OpenRouter | ~R69/month |
| **AI Tier 3** | DeepSeek V3.2 via OpenRouter | ~R57/month |
| **AI Budget** | DeepSeek-Qwen-8B | ~R1/month |
| **AI Fallback** | Gemini 2.0 Flash | Free |
| **Images** | Nano Banana Pro | R0 (prepaid annually) |
| **Strategic AI** | Claude Max | R0 (your subscription) |

---

# 3. AI Model Strategy

## The Cost Pyramid (Three-Tier + Budget)

```
                    ▲
                   ▲▲▲  Claude Max (FREE - Mac)
                  ▲▲▲▲▲  Strategic, polish, complex
                 ▲▲▲▲▲▲▲
                ▲▲▲▲▲▲▲▲▲  GPT-5 Nano ($0.05/$0.40)
               ▲▲▲▲▲▲▲▲▲▲▲  60% - classify, extract, simple
              ▲▲▲▲▲▲▲▲▲▲▲▲▲
             ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲  GPT-5.1-Codex-Mini ($0.25/$2.00)
            ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲  15% - code, drafts, precision tasks
           ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
          ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲  DeepSeek V3.2 ($0.27/$0.40)
         ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲  20% - proposals, blogs, reports
        ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲  Budget + Free (5%)
```

## Model Specifications

### GPT-5 Nano (High-Volume Workhorse)

| Spec | Value |
|------|-------|
| **Provider** | OpenAI via OpenRouter |
| **Model ID** | `openai/gpt-5-nano` |
| **Context** | 400,000 tokens |
| **Input Cost** | $0.05 per 1M tokens |
| **Output Cost** | $0.40 per 1M tokens |
| **Latency** | Ultra-low |
| **Reliability** | 100% success rate |

**Benchmark Performance:**
- Classification: 99%
- Hallucination: 0% (perfect)
- Reasoning: 96%
- Mathematics: 94%
- Coding: 93%
- Instruction Following: 69% (needs explicit prompts)

**Best For:**
- Lead classification
- Email categorization
- Spam detection
- Data extraction
- Quick auto-responses
- Sentiment analysis
- Simple summarization

**Why 60% of tasks:** At $0.05/1M input, GPT-5 Nano handles high-volume classification tasks at 5x lower cost than alternatives. The 99% classification accuracy and 0% hallucination rate make it ideal for automated pipelines.

### GPT-5.1-Codex-Mini (Precision Middle Tier) ⭐ NEW

| Spec | Value |
|------|-------|
| **Provider** | OpenAI via OpenRouter |
| **Model ID** | `openai/gpt-5.1-codex-mini` |
| **Context** | 400,000 tokens |
| **Input Cost** | $0.25 per 1M tokens |
| **Output Cost** | $2.00 per 1M tokens |
| **Released** | November 13, 2025 |
| **Reliability** | 100% success rate |

**Benchmark Performance:**
- SWE-Bench Verified: 71.3%
- Mathematics: 96%
- General Knowledge: 100%
- Ethics: 100%
- Reasoning: 98%
- Instruction Following: 79% (significantly better than Nano's 69%)
- Reliability: 100%

**Best For:**
- Lead scoring (precision matters)
- Email drafting (client-facing)
- Code generation
- Complex instruction following
- Tasks requiring nuanced responses
- Higher-stakes automations

**Why 15% of tasks:** The 10% improvement in instruction following (79% vs 69%) is critical for client-facing communications and lead scoring where nuance matters. Worth the 5x cost premium for these specific use cases.

### DeepSeek V3.2 (Long-Form Specialist)

| Spec | Value |
|------|-------|
| **Provider** | DeepSeek via OpenRouter |
| **Model ID** | `deepseek/deepseek-chat` |
| **Context** | 131,000 tokens |
| **Input Cost** | $0.27 per 1M tokens |
| **Output Cost** | $0.40 per 1M tokens |
| **Parameters** | 671B total, 37B active (MoE) |

**Benchmark Performance:**
- MMLU-Pro: 81.2%
- GPQA: 68.4%
- HumanEval: 65.2%
- GSM8K: 89.3%
- Long-form: 10,000+ words coherent

**Best For:**
- Proposal generation (3,000-5,000 words)
- Blog articles
- Financial reports
- Intake document analysis
- Complex DFI matching

**Why 20% of tasks:** DeepSeek V3.2 uniquely excels at generating coherent 10,000+ word documents. No other model at this price point matches its long-form generation quality.

### DeepSeek-Qwen-8B (Ultra-Budget)

| Spec | Value |
|------|-------|
| **Model ID** | `deepseek/deepseek-r1-distill-qwen-8b` |
| **Input Cost** | $0.02 per 1M tokens |
| **Output Cost** | $0.10 per 1M tokens |

**Best For:**
- Language detection
- Simple binary decisions
- Very basic extraction
- High-volume simple tasks

### Gemini 2.0 Flash (Free Fallback)

| Spec | Value |
|------|-------|
| **Model ID** | `google/gemini-2.0-flash-exp:free` |
| **Cost** | FREE |
| **Limit** | 15 requests/minute |

**Best For:**
- Fallback when other models are down
- Simple lookups
- Rate limit buffer

## Model Comparison Matrix

| Metric | GPT-5 Nano | GPT-5.1-Codex-Mini | DeepSeek V3.2 |
|--------|------------|---------------------|---------------|
| **Input Cost** | $0.05/1M | $0.25/1M | $0.27/1M |
| **Output Cost** | $0.40/1M | $2.00/1M | $0.40/1M |
| **Context** | 400K | 400K | 131K |
| **Classification** | 99% | ~99% | ~85% |
| **Instruction Following** | 69% | 79% | ~85% |
| **Coding** | 93% | 71.3% SWE-bench | 65.2% HumanEval |
| **Long-form** | Limited | Good | Excellent (10K+) |
| **Reliability** | 100% | 100% | ~98% |
| **Best Use** | High-volume simple | Precision tasks | Long documents |

## Task-to-Model Routing

```python
TASK_ROUTING = {
    # GPT-5 Nano (60% of tasks) - High volume, simple
    "lead_classification": "gpt5-nano",
    "email_classification": "gpt5-nano",
    "spam_detection": "gpt5-nano",
    "data_extraction": "gpt5-nano",
    "sentiment_analysis": "gpt5-nano",
    "quick_response": "gpt5-nano",
    "simple_summarization": "gpt5-nano",
    "language_detection": "gpt5-nano",
    
    # GPT-5.1-Codex-Mini (15% of tasks) - Precision, client-facing
    "lead_scoring": "codex-mini",
    "email_drafting": "codex-mini",
    "code_generation": "codex-mini",
    "complex_instructions": "codex-mini",
    "client_response": "codex-mini",
    "math_analysis": "codex-mini",
    
    # DeepSeek V3.2 (20% of tasks) - Long-form generation
    "proposal_generation": "deepseek",
    "blog_writing": "deepseek",
    "financial_report": "deepseek",
    "intake_analysis": "deepseek",
    "long_email": "deepseek",
    "dfi_matching": "deepseek",
    "complex_document": "deepseek",
    
    # Budget (5% of tasks)
    "ultra_simple": "budget",
    "fallback": "free"
}
```

---

# 4. Hostinger MCP Integration

## What is Hostinger MCP?

Model Context Protocol (MCP) allows Claude to directly control your Hostinger infrastructure through natural language conversation.

## Current Configuration Status (✅ ACTIVE)

**API Token:** `8WXyekao3Y3hVw0OZS1ygndk5P7c9HtAlcGlpuSOa24a9263`
**Configuration File:** `/Users/mac/Library/Application Support/Claude/claude_desktop_config.json`
**Status:** Configured and ready (restart Claude Desktop to activate)

## Available Tools (113 Total)

### VPS Management

| Tool | Function | JASPER Use |
|------|----------|------------|
| `VPS_getVirtualMachineDetailsV1` | Get VPS status | Monitor health |
| `VPS_startVirtualMachineV1` | Start VPS | Recovery |
| `VPS_stopVirtualMachineV1` | Stop VPS | Maintenance |
| `VPS_restartVirtualMachineV1` | Restart VPS | Apply updates |
| `VPS_getMetricsV1` | CPU, RAM, disk | Performance |
| `VPS_getBackupsV1` | List backups | Verify backups |
| `VPS_restoreBackupV1` | Restore backup | Disaster recovery |
| `VPS_createSnapshotV1` | Create snapshot | Before changes |

### Hosting Management (For PHP Backend)

| Tool | Function | JASPER Use |
|------|----------|------------|
| `hosting_listWebsitesV1` | List all websites | View domains |
| `hosting_createWebsiteV1` | Create new website | Add JASPER domain |
| `hosting_deployStaticWebsite` | Deploy static files | Deploy PHP app |
| `hosting_listOrdersV1` | List hosting orders | Check plan |

### Docker Management (VPS Only)

| Tool | Function | JASPER Use |
|------|----------|------------|
| `VPS_getProjectListV1` | List Docker projects | Monitor services |
| `VPS_createNewProjectV1` | Deploy docker-compose | Deploy services |
| `VPS_startProjectV1` | Start containers | Service recovery |
| `VPS_stopProjectV1` | Stop containers | Maintenance |
| `VPS_restartProjectV1` | Restart containers | Apply updates |
| `VPS_getProjectLogsV1` | Get container logs | Debugging |

**Note:** Docker deployment via MCP only supports pre-built images from Docker Hub, not custom Dockerfiles.

### DNS Management

| Tool | Function | JASPER Use |
|------|----------|------------|
| `DNS_getDNSRecordsV1` | Get DNS records | Verify config |
| `DNS_updateDNSRecordsV1` | Update records | Add subdomains |

## Setup Instructions (COMPLETED)

### 1. Claude Desktop Config

Location: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "hostinger-api": {
      "command": "npx",
      "args": ["-y", "hostinger-api-mcp@latest"],
      "env": {
        "DEBUG": "false",
        "API_TOKEN": "8WXyekao3Y3hVw0OZS1ygndk5P7c9HtAlcGlpuSOa24a9263"
      }
    }
  }
}
```

### 2. Claude Code Config (Optional)

To add Hostinger MCP to Claude Code projects:

```bash
claude mcp add hostinger-api -e API_TOKEN=8WXyekao3Y3hVw0OZS1ygndk5P7c9HtAlcGlpuSOa24a9263 -- npx -y hostinger-api-mcp@latest
```

### 3. Restart Claude Desktop

After restart, you can say:
- "Check my VPS status"
- "List my Hostinger websites"
- "Show server metrics for the last 24 hours"
- "Create a snapshot before we deploy"
- "Deploy my PHP app to Hostinger"

---

# 5. PHP Backend Architecture ⭐ NEW

## Why PHP for JASPER?

| Factor | PHP 8.x | Python/Docker | Node.js |
|--------|---------|---------------|----------|
| **Hostinger Support** | ✅ Native | Requires VPS | Limited |
| **MySQL Included** | ✅ FREE | Self-hosted | Self-hosted |
| **Setup Complexity** | Simple | Complex | Medium |
| **Deployment** | FTP/Git | Docker compose | Build process |
| **Cost** | R0 | VPS ~R150-300/mo | Varies |
| **Google Auth** | Easy | Easy | Easy |

### Modern PHP 8.x Features

- **JIT Compiler:** 2-3x faster execution
- **Typed Properties:** Full type safety
- **Attributes:** Modern metadata annotations
- **Match Expressions:** Clean switch replacement
- **Native Enums:** First-class enum support
- **Fibers:** Async operations
- **Laravel 11 / Symfony 7:** Enterprise-ready frameworks

## Recommended Stack: Native PHP (Slim Framework)

```
jasper.kutlwano.co.za/
├── public/
│   ├── index.php              # Entry point
│   └── .htaccess              # Apache rewrites
│
├── src/
│   ├── Controllers/
│   │   ├── AuthController.php     # Google OAuth login
│   │   ├── ClientController.php   # Client CRUD
│   │   ├── ProjectController.php  # Project management
│   │   └── ModelController.php    # Financial model configs
│   │
│   ├── Models/
│   │   ├── Client.php
│   │   ├── Project.php
│   │   └── Model.php
│   │
│   ├── Middleware/
│   │   └── AuthMiddleware.php     # JWT/Session validation
│   │
│   └── Services/
│       ├── GoogleAuth.php         # OAuth 2.0 handler
│       ├── ExcelGenerator.php     # PhpSpreadsheet wrapper
│       └── AIService.php          # OpenRouter API calls
│
├── config/
│   ├── database.php           # MySQL connection
│   ├── google.php             # OAuth credentials
│   └── app.php                # App settings
│
├── templates/
│   ├── portal/                # Client portal views
│   └── admin/                 # Admin dashboard views
│
├── storage/
│   ├── models/                # Excel template files
│   └── outputs/               # Generated models
│
├── vendor/                    # Composer dependencies
├── composer.json
└── .env                       # Environment variables
```

## Google OAuth 2.0 Integration

### Setup Requirements

1. **Google Cloud Console** (FREE)
   - Create project at: https://console.cloud.google.com
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://jasper.kutlwano.co.za/auth/callback`

2. **PHP Libraries**
   ```bash
   composer require google/apiclient
   # OR for Slim Framework:
   composer require league/oauth2-google
   ```

### Auth Flow

```
Client → "Sign in with Google" → Google Auth → Callback
   ↓
   └─→ Returns: email, name, avatar, Google ID
           ↓
           └─→ Check MySQL: User exists?
                   ↓
                   ├─→ Yes: Create session/JWT → Dashboard
                   └─→ No: Create user → Create session → Dashboard
```

### Google Auth Controller

```php
<?php
// src/Controllers/AuthController.php

namespace App\Controllers;

use League\OAuth2\Client\Provider\Google;
use Slim\Psr7\Request;
use Slim\Psr7\Response;

class AuthController
{
    private Google $provider;
    
    public function __construct()
    {
        $this->provider = new Google([
            'clientId'     => $_ENV['GOOGLE_CLIENT_ID'],
            'clientSecret' => $_ENV['GOOGLE_CLIENT_SECRET'],
            'redirectUri'  => $_ENV['GOOGLE_REDIRECT_URI'],
        ]);
    }
    
    public function login(Request $request, Response $response): Response
    {
        $authUrl = $this->provider->getAuthorizationUrl([
            'scope' => ['email', 'profile']
        ]);
        
        $_SESSION['oauth2state'] = $this->provider->getState();
        
        return $response
            ->withHeader('Location', $authUrl)
            ->withStatus(302);
    }
    
    public function callback(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        
        // Verify state to prevent CSRF
        if (empty($params['state']) || $params['state'] !== $_SESSION['oauth2state']) {
            unset($_SESSION['oauth2state']);
            throw new \Exception('Invalid state');
        }
        
        // Get access token
        $token = $this->provider->getAccessToken('authorization_code', [
            'code' => $params['code']
        ]);
        
        // Get user info
        $user = $this->provider->getResourceOwner($token);
        $userData = [
            'google_id' => $user->getId(),
            'email'     => $user->getEmail(),
            'name'      => $user->getName(),
            'avatar'    => $user->getAvatar(),
        ];
        
        // Find or create user in MySQL
        $client = $this->findOrCreateClient($userData);
        
        // Create session
        $_SESSION['user_id'] = $client['id'];
        $_SESSION['user_email'] = $client['email'];
        $_SESSION['user_name'] = $client['name'];
        
        return $response
            ->withHeader('Location', '/portal/dashboard')
            ->withStatus(302);
    }
    
    private function findOrCreateClient(array $userData): array
    {
        $db = Database::getConnection();
        
        // Check if user exists
        $stmt = $db->prepare('SELECT * FROM clients WHERE google_id = ? OR email = ?');
        $stmt->execute([$userData['google_id'], $userData['email']]);
        $client = $stmt->fetch();
        
        if ($client) {
            // Update last login
            $update = $db->prepare('UPDATE clients SET last_login = NOW() WHERE id = ?');
            $update->execute([$client['id']]);
            return $client;
        }
        
        // Create new client
        $insert = $db->prepare('
            INSERT INTO clients (google_id, email, name, avatar, created_at, last_login)
            VALUES (?, ?, ?, ?, NOW(), NOW())
        ');
        $insert->execute([
            $userData['google_id'],
            $userData['email'],
            $userData['name'],
            $userData['avatar']
        ]);
        
        return [
            'id' => $db->lastInsertId(),
            'email' => $userData['email'],
            'name' => $userData['name']
        ];
    }
    
    public function logout(Request $request, Response $response): Response
    {
        session_destroy();
        return $response
            ->withHeader('Location', '/')
            ->withStatus(302);
    }
}
```

## MySQL Database Schema (For PHP Backend)

```sql
-- JASPER MySQL Schema for PHP Backend
-- Optimized for Hostinger shared hosting

CREATE DATABASE IF NOT EXISTS jasper_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE jasper_db;

-- ============================================
-- CLIENTS TABLE (Google Auth Users)
-- ============================================
CREATE TABLE clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    google_id VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    company VARCHAR(255),
    avatar VARCHAR(500),
    role ENUM('client', 'admin') DEFAULT 'client',
    status ENUM('active', 'suspended', 'pending') DEFAULT 'active',
    
    -- JASPER-specific
    tier ENUM('growth', 'professional', 'enterprise', 'strategic') DEFAULT 'growth',
    credit_balance DECIMAL(10,2) DEFAULT 0.00,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_google_id (google_id)
) ENGINE=InnoDB;

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    project_code VARCHAR(20) UNIQUE,  -- JASPER-2025-001
    
    -- Project details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sector ENUM('agribusiness', 'infrastructure', 'manufacturing', 'tech', 'other'),
    location VARCHAR(255),
    
    -- Funding
    funding_amount DECIMAL(15,2),
    funding_currency VARCHAR(10) DEFAULT 'USD',
    target_dfis JSON,  -- ["IFC", "AfDB", "IDC"]
    
    -- Package & Pricing
    package ENUM('core', 'professional', 'enterprise', 'strategic'),
    package_price DECIMAL(10,2),
    deposit_paid BOOLEAN DEFAULT FALSE,
    balance_paid BOOLEAN DEFAULT FALSE,
    
    -- Status
    status ENUM(
        'inquiry', 'intake_pending', 'intake_complete',
        'proposal_sent', 'accepted', 'in_progress',
        'review', 'delivered', 'completed', 'cancelled'
    ) DEFAULT 'inquiry',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_client (client_id),
    INDEX idx_status (status),
    INDEX idx_project_code (project_code)
) ENGINE=InnoDB;

-- ============================================
-- FINANCIAL MODELS TABLE
-- ============================================
CREATE TABLE financial_models (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    
    -- Model details
    name VARCHAR(255) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    sheet_count INT DEFAULT 20,
    
    -- Configuration (stored as JSON)
    config JSON,  -- Full model configuration
    
    -- Files
    template_file VARCHAR(500),  -- Path to template
    output_file VARCHAR(500),     -- Path to generated model
    
    -- Status
    status ENUM('draft', 'generating', 'ready', 'delivered') DEFAULT 'draft',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_at TIMESTAMP NULL,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project (project_id)
) ENGINE=InnoDB;

-- ============================================
-- API TOKENS TABLE (For programmatic access)
-- ============================================
CREATE TABLE api_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(100),
    scopes JSON,  -- ["models:read", "models:generate"]
    last_used TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_token (token)
) ENGINE=InnoDB;

-- ============================================
-- ACTIVITY LOG TABLE
-- ============================================
CREATE TABLE activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT,
    project_id INT,
    
    action VARCHAR(100) NOT NULL,
    details JSON,
    ip_address VARCHAR(45),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_client (client_id),
    INDEX idx_project (project_id),
    INDEX idx_action (action)
) ENGINE=InnoDB;
```

## API Endpoints

```php
// routes.php - Slim Framework routes

use Slim\Routing\RouteCollectorProxy;

// Public routes
$app->get('/', [HomeController::class, 'index']);
$app->get('/login', [AuthController::class, 'login']);
$app->get('/auth/callback', [AuthController::class, 'callback']);

// Protected portal routes
$app->group('/portal', function (RouteCollectorProxy $group) {
    $group->get('/dashboard', [PortalController::class, 'dashboard']);
    $group->get('/projects', [ProjectController::class, 'index']);
    $group->get('/projects/{id}', [ProjectController::class, 'show']);
    $group->get('/models/{id}/download', [ModelController::class, 'download']);
})->add(AuthMiddleware::class);

// API routes (for programmatic access)
$app->group('/api/v1', function (RouteCollectorProxy $group) {
    $group->get('/projects', [ApiController::class, 'listProjects']);
    $group->post('/projects', [ApiController::class, 'createProject']);
    $group->get('/projects/{id}', [ApiController::class, 'getProject']);
    $group->post('/models/generate', [ApiController::class, 'generateModel']);
    $group->get('/models/{id}/status', [ApiController::class, 'modelStatus']);
})->add(ApiAuthMiddleware::class);

// Admin routes
$app->group('/admin', function (RouteCollectorProxy $group) {
    $group->get('/dashboard', [AdminController::class, 'dashboard']);
    $group->get('/clients', [AdminController::class, 'clients']);
    $group->get('/projects', [AdminController::class, 'projects']);
})->add(AdminMiddleware::class);
```

## Cost Analysis: PHP Backend

| Item | Monthly Cost |
|------|-------------|
| Hostinger Hosting | R50-100 (already paying) |
| MySQL Database | R0 (included FREE) |
| PHP 8.x | R0 (native support) |
| SSL Certificate | R0 (Let's Encrypt) |
| Google OAuth | R0 (free tier: millions of auths) |
| PhpSpreadsheet | R0 (open source) |
| **TOTAL** | **R0 additional** |

## Deployment Options

### Option 1: Native PHP Hosting (RECOMMENDED)

- Direct PHP file deployment
- Native MySQL included
- No Docker complexity
- Fastest build/deploy
- Perfect for JASPER

**Deploy via:**
- FTP upload
- Git deployment (Hostinger supports)
- Hostinger MCP commands

### Option 2: VPS with Docker (Alternative)

Use if you need:
- Custom server configurations
- Multiple services (PostgreSQL, Redis, etc.)
- Advanced automation

**Limitation:** Hostinger MCP Docker only supports pre-built images from Docker Hub, not custom Dockerfiles.

---

# 6. Database Schema

## PostgreSQL CRM Schema

```sql
-- ============================================
-- JASPER CRM DATABASE SCHEMA
-- PostgreSQL 16
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CONTACTS TABLE
-- ============================================
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    
    -- Basic info
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    company VARCHAR(255),
    role VARCHAR(100),
    phone VARCHAR(50),
    country VARCHAR(100),
    
    -- Lead management
    source VARCHAR(50),  -- website, linkedin, referral, email
    status VARCHAR(50) DEFAULT 'new',
    score INTEGER DEFAULT 0,  -- AI-generated 1-10
    
    -- Metadata
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Status values: new, qualified, proposal_sent, client, inactive

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    project_id VARCHAR(50) UNIQUE,  -- JASPER-2025-001
    
    -- Relationships
    contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    
    -- Project info
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),  -- agribusiness, infrastructure, tech, manufacturing
    subsector VARCHAR(100),
    location VARCHAR(255),
    
    -- Funding
    funding_amount DECIMAL(15,2),
    funding_currency VARCHAR(10) DEFAULT 'USD',
    target_dfis TEXT[],  -- IFC, AfDB, ADB, IDC, etc.
    
    -- Package
    package VARCHAR(50),  -- growth, institutional, infrastructure
    package_price DECIMAL(10,2),
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'inquiry',
    
    -- Key dates
    inquiry_date TIMESTAMP,
    intake_sent_date TIMESTAMP,
    intake_complete_date TIMESTAMP,
    proposal_sent_date TIMESTAMP,
    proposal_expiry_date TIMESTAMP,
    accepted_date TIMESTAMP,
    deposit_date TIMESTAMP,
    production_start_date TIMESTAMP,
    draft_date TIMESTAMP,
    feedback_date TIMESTAMP,
    final_date TIMESTAMP,
    
    -- Payments
    deposit_amount DECIMAL(10,2),
    deposit_paid BOOLEAN DEFAULT FALSE,
    balance_amount DECIMAL(10,2),
    balance_paid BOOLEAN DEFAULT FALSE,
    payment_method VARCHAR(50),  -- crypto, wise, payoneer
    
    -- Revisions
    revision_rounds_used INTEGER DEFAULT 0,
    revision_rounds_total INTEGER DEFAULT 2,
    support_end_date TIMESTAMP,
    
    -- Files
    folder_link VARCHAR(500),
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Status values: 
-- inquiry, intake_sent, intake_complete, proposal_sent, proposal_expired,
-- accepted, deposit_paid, in_production, draft_delivered, revision,
-- final_payment, delivered, completed, declined, cancelled

-- ============================================
-- ACTIVITIES TABLE (Activity Log)
-- ============================================
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    
    -- Relationships
    contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Activity info
    activity_type VARCHAR(50) NOT NULL,
    subject VARCHAR(500),
    content TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

-- Activity types:
-- email_received, email_sent, form_submitted, status_changed,
-- call_scheduled, note_added, file_uploaded, ai_analysis

-- ============================================
-- EMAILS TABLE
-- ============================================
CREATE TABLE emails (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    
    -- Relationships
    contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    
    -- Email details
    direction VARCHAR(10) NOT NULL,  -- inbound, outbound
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    subject VARCHAR(500),
    body_text TEXT,
    body_html TEXT,
    
    -- Tracking
    template_used VARCHAR(100),
    status VARCHAR(50),  -- sent, delivered, opened, clicked, bounced
    message_id VARCHAR(255),
    
    -- Timestamps
    sent_at TIMESTAMP,
    opened_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- EMAIL TEMPLATES TABLE
-- ============================================
CREATE TABLE email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(500),
    body_html TEXT,
    body_text TEXT,
    variables TEXT[],  -- {{name}}, {{project_name}}, etc.
    category VARCHAR(50),  -- transactional, marketing, follow_up
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- ============================================
CREATE TABLE newsletter_subscribers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    sectors TEXT[],  -- interest areas
    status VARCHAR(50) DEFAULT 'active',  -- active, unsubscribed
    source VARCHAR(100),
    subscribed_at TIMESTAMP DEFAULT NOW(),
    unsubscribed_at TIMESTAMP
);

-- ============================================
-- AI COSTS TRACKING TABLE
-- ============================================
CREATE TABLE ai_costs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT NOW(),
    model VARCHAR(100) NOT NULL,
    task VARCHAR(100),
    input_tokens INTEGER,
    output_tokens INTEGER,
    cost_usd DECIMAL(10,6),
    metadata JSONB DEFAULT '{}'
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_score ON contacts(score);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_contact ON projects(contact_id);
CREATE INDEX idx_projects_project_id ON projects(project_id);
CREATE INDEX idx_activities_contact ON activities(contact_id);
CREATE INDEX idx_activities_project ON activities(project_id);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_emails_contact ON emails(contact_id);
CREATE INDEX idx_emails_direction ON emails(direction);
CREATE INDEX idx_ai_costs_date ON ai_costs(timestamp);
CREATE INDEX idx_ai_costs_model ON ai_costs(model);

-- ============================================
-- UPDATE TIMESTAMP TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

# 6. Python Services

## Directory Structure

```
/home/jasper/
├── config/
│   ├── settings.py              # Configuration
│   ├── .env                     # Secrets (not in git)
│   └── logging.conf             # Logging config
│
├── database/
│   ├── __init__.py
│   ├── connection.py            # PostgreSQL connection
│   ├── models.py                # SQLAlchemy models
│   └── queries.py               # Common queries
│
├── ai/
│   ├── __init__.py
│   ├── router.py                # Model routing logic
│   ├── openrouter.py            # OpenRouter API client
│   ├── prompts.py               # All AI prompts
│   └── cost_tracker.py          # Cost monitoring
│
├── services/
│   ├── __init__.py
│   ├── email_receiver.py        # IMAP listener (systemd)
│   ├── form_handler.py          # Flask webhooks
│   ├── lead_processor.py        # AI lead scoring
│   ├── email_sender.py          # SMTP automation
│   ├── proposal_generator.py    # AI proposal creation
│   ├── scheduler.py             # Scheduled tasks
│   └── blog_generator.py        # Content pipeline
│
├── templates/
│   ├── emails/                  # Email templates
│   └── documents/               # Document templates
│
├── utils/
│   ├── __init__.py
│   ├── helpers.py               # Utility functions
│   └── validators.py            # Input validation
│
├── tests/
│   └── ...
│
├── requirements.txt
└── README.md
```

## Core AI Module

```python
# /home/jasper/ai/router.py
"""
Intelligent AI model routing for cost optimization.
Three-tier routing: GPT-5 Nano → GPT-5.1-Codex-Mini → DeepSeek V3.2
"""

import os
import httpx
from typing import Literal, Optional
from datetime import datetime

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
BASE_URL = "https://openrouter.ai/api/v1"

# Model definitions - Three Tiers
MODELS = {
    # TIER 1: High-volume, simple tasks (60%)
    "gpt5-nano": {
        "id": "openai/gpt-5-nano",
        "input_cost": 0.05,   # per 1M tokens
        "output_cost": 0.40,
        "context": 400000,
        "strengths": ["classification", "extraction", "speed", "reliability"],
        "temperature": 1.0,   # GPT-5 requires temp=1.0
        "tier": 1,
    },
    # TIER 2: Precision, client-facing tasks (15%)
    "codex-mini": {
        "id": "openai/gpt-5.1-codex-mini",
        "input_cost": 0.25,   # per 1M tokens
        "output_cost": 2.00,
        "context": 400000,
        "strengths": ["instruction_following", "code", "precision", "client_facing"],
        "temperature": 0.7,
        "tier": 2,
    },
    # TIER 3: Long-form generation (20%)
    "deepseek": {
        "id": "deepseek/deepseek-chat",
        "input_cost": 0.27,
        "output_cost": 0.40,
        "context": 131000,
        "strengths": ["long_form", "proposals", "financial", "reports"],
        "temperature": 0.7,
        "tier": 3,
    },
    # Budget fallback
    "budget": {
        "id": "deepseek/deepseek-r1-distill-qwen-8b",
        "input_cost": 0.02,
        "output_cost": 0.10,
        "context": 131000,
        "strengths": ["simple", "volume"],
        "temperature": 0.7,
        "tier": 4,
    },
    # Free fallback
    "free": {
        "id": "google/gemini-2.0-flash-exp:free",
        "input_cost": 0,
        "output_cost": 0,
        "context": 1000000,
        "strengths": ["fallback"],
        "temperature": 0.7,
        "tier": 5,
    }
}

# Task routing map - Three Tiers
TASK_ROUTING = {
    # TIER 1: GPT-5 Nano (60% of tasks) - High volume, simple
    "lead_classification": "gpt5-nano",
    "email_classification": "gpt5-nano",
    "spam_detection": "gpt5-nano",
    "data_extraction": "gpt5-nano",
    "sentiment_analysis": "gpt5-nano",
    "quick_response": "gpt5-nano",
    "simple_summarization": "gpt5-nano",
    "language_detection": "gpt5-nano",
    
    # TIER 2: GPT-5.1-Codex-Mini (15% of tasks) - Precision, client-facing
    "lead_scoring": "codex-mini",
    "email_drafting": "codex-mini",
    "code_generation": "codex-mini",
    "complex_instructions": "codex-mini",
    "client_response": "codex-mini",
    "math_analysis": "codex-mini",
    "general_qa": "codex-mini",
    
    # TIER 3: DeepSeek V3.2 (20% of tasks) - Long-form generation
    "proposal_generation": "deepseek",
    "blog_writing": "deepseek",
    "financial_report": "deepseek",
    "intake_analysis": "deepseek",
    "long_email": "deepseek",
    "dfi_matching": "deepseek",
    "complex_document": "deepseek",
    
    # Budget/Free (5% of tasks)
    "ultra_simple": "budget",
    "fallback": "free",
}


def get_model_for_task(task_type: str) -> str:
    """Route task to optimal model."""
    return TASK_ROUTING.get(task_type, "gpt5-nano")


def call_llm(
    prompt: str,
    task_type: str = "general_qa",
    system: str = "",
    max_tokens: int = 1000,
    force_model: Optional[str] = None
) -> dict:
    """
    Call LLM via OpenRouter with automatic model routing.
    
    Returns:
        {
            "content": str,
            "model": str,
            "tokens": {"input": int, "output": int},
            "cost_usd": float
        }
    """
    model_key = force_model or get_model_for_task(task_type)
    model_config = MODELS[model_key]
    
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    
    response = httpx.post(
        f"{BASE_URL}/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://jasperfinance.org",
            "X-Title": "JASPER Automation"
        },
        json={
            "model": model_config["id"],
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": model_config["temperature"]
        },
        timeout=120.0
    )
    
    response.raise_for_status()
    data = response.json()
    
    # Calculate cost
    usage = data.get("usage", {})
    input_tokens = usage.get("prompt_tokens", 0)
    output_tokens = usage.get("completion_tokens", 0)
    cost = (
        input_tokens * model_config["input_cost"] / 1_000_000 +
        output_tokens * model_config["output_cost"] / 1_000_000
    )
    
    # Log cost
    log_ai_cost(model_config["id"], task_type, input_tokens, output_tokens, cost)
    
    return {
        "content": data["choices"][0]["message"]["content"],
        "model": model_config["id"],
        "tokens": {"input": input_tokens, "output": output_tokens},
        "cost_usd": cost
    }


def log_ai_cost(model: str, task: str, input_tokens: int, output_tokens: int, cost: float):
    """Log AI cost to database."""
    from database.connection import get_db
    db = get_db()
    db.execute("""
        INSERT INTO ai_costs (model, task, input_tokens, output_tokens, cost_usd)
        VALUES (%s, %s, %s, %s, %s)
    """, (model, task, input_tokens, output_tokens, cost))
    db.commit()
```

## Email Receiver Service

```python
# /home/jasper/services/email_receiver.py
"""
IMAP Email Listener
Runs as systemd service, monitors models@jasperfinance.org
"""

import imaplib
import email
import time
import os
import logging
from datetime import datetime
from email.utils import parseaddr

from database.connection import get_db
from database.models import Contact, Activity
from ai.router import call_llm
from services.email_sender import send_template_email

# Configuration
IMAP_SERVER = "imap.hostinger.com"
IMAP_USER = os.getenv("IMAP_USER", "models@jasperfinance.org")
IMAP_PASS = os.getenv("IMAP_PASSWORD")
CHECK_INTERVAL = 30  # seconds

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_email_body(msg) -> str:
    """Extract text body from email message."""
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                return part.get_payload(decode=True).decode('utf-8', errors='ignore')
    return msg.get_payload(decode=True).decode('utf-8', errors='ignore')


def classify_email(subject: str, body: str) -> dict:
    """Classify email using GPT-5 Nano (99% accuracy)."""
    
    result = call_llm(
        task_type="email_classification",
        system="You are a JASPER email classifier. Respond ONLY with valid JSON.",
        prompt=f"""Classify this email into exactly ONE category:
- inquiry (potential JASPER client)
- spam (unsolicited marketing)
- partnership (business proposal)
- support (existing client question)
- other

EMAIL SUBJECT: {subject}

EMAIL BODY:
{body[:2000]}

Respond with ONLY:
{{"category": "category_name", "confidence": 0.0-1.0, "reason": "brief reason"}}""",
        max_tokens=100
    )
    
    try:
        import json
        return json.loads(result["content"])
    except:
        return {"category": "other", "confidence": 0.5, "reason": "Parse error"}


def score_lead(email_content: str, sender: str) -> dict:
    """Score lead using GPT-5 Nano (96% reasoning accuracy)."""
    
    result = call_llm(
        task_type="lead_scoring",
        system="You are a JASPER lead scoring assistant. Respond ONLY with valid JSON.",
        prompt=f"""Score this JASPER lead from 1-10.

JASPER TARGETS:
- $5M+ DFI funding projects
- Agribusiness, Infrastructure, Tech, Manufacturing
- IFC, AfDB, ADB, IDC, Land Bank applications
- Serious developers with real projects

LEAD EMAIL FROM: {sender}

CONTENT:
{email_content[:3000]}

SCORING GUIDE:
- 9-10: Perfect fit, hot lead (mentions DFI, large project, specific sector)
- 7-8: Good fit, warm lead (real project, appropriate scale)
- 5-6: Possible fit, needs qualification
- 3-4: Unlikely fit (too small, wrong sector)
- 1-2: Wrong target (startup, individual, spam)

Respond with ONLY:
{{"score": 1-10, "sector": "sector_name", "reasoning": "brief explanation"}}""",
        max_tokens=150
    )
    
    try:
        import json
        return json.loads(result["content"])
    except:
        return {"score": 5, "sector": "unknown", "reasoning": "Parse error"}


def process_email(msg):
    """Process incoming email."""
    
    # Extract details
    from_addr = parseaddr(msg["From"])[1]
    from_name = parseaddr(msg["From"])[0]
    subject = msg.get("Subject", "")
    body = get_email_body(msg)
    
    logger.info(f"Processing email from {from_addr}: {subject[:50]}")
    
    db = get_db()
    
    # Classify email
    classification = classify_email(subject, body)
    logger.info(f"Classification: {classification}")
    
    if classification["category"] == "spam":
        logger.info("Spam detected, ignoring")
        return
    
    # Find or create contact
    contact = db.query(Contact).filter_by(email=from_addr).first()
    if not contact:
        contact = Contact(
            email=from_addr,
            name=from_name or None,
            source="email",
            status="new"
        )
        db.add(contact)
        db.commit()
        logger.info(f"Created new contact: {from_addr}")
    
    # Log activity
    activity = Activity(
        contact_id=contact.id,
        activity_type="email_received",
        subject=subject,
        content=body[:1000],
        metadata={"classification": classification}
    )
    db.add(activity)
    db.commit()
    
    # Score if potential inquiry
    if classification["category"] == "inquiry":
        scoring = score_lead(f"Subject: {subject}\n\n{body}", from_addr)
        contact.score = scoring["score"]
        db.commit()
        logger.info(f"Lead score: {scoring}")
        
        # Send auto-response
        send_template_email(
            to=from_addr,
            template="inquiry_received",
            variables={
                "name": contact.name or "there",
            }
        )
        
        # Alert for hot leads
        if scoring["score"] >= 8:
            notify_hot_lead(contact, scoring)


def notify_hot_lead(contact, scoring):
    """Send notification for hot lead."""
    # This could send a Telegram message, SMS, or priority email
    logger.info(f"🔥 HOT LEAD: {contact.email} - Score {scoring['score']}")
    # TODO: Implement notification


def main_loop():
    """Main IMAP monitoring loop."""
    
    logger.info("Starting JASPER Email Receiver...")
    
    while True:
        try:
            mail = imaplib.IMAP4_SSL(IMAP_SERVER)
            mail.login(IMAP_USER, IMAP_PASS)
            mail.select("INBOX")
            
            # Search for unseen messages
            _, messages = mail.search(None, "UNSEEN")
            
            for num in messages[0].split():
                _, msg_data = mail.fetch(num, "(RFC822)")
                msg = email.message_from_bytes(msg_data[0][1])
                process_email(msg)
            
            mail.logout()
            
        except Exception as e:
            logger.error(f"Error: {e}")
        
        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    main_loop()
```

## Form Handler Service

```python
# /home/jasper/services/form_handler.py
"""
Webhook receiver for Tally form submissions.
Runs as Flask app behind Nginx.
"""

from flask import Flask, request, jsonify
import os
import logging
from datetime import datetime

from database.connection import get_db
from database.models import Contact, Project, Activity
from ai.router import call_llm
from services.email_sender import send_template_email

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "service": "jasper-forms"})


@app.route("/webhook/quick-contact", methods=["POST"])
def handle_quick_contact():
    """Handle quick contact form from website."""
    
    data = request.json
    logger.info(f"Quick contact form received: {data.get('email')}")
    
    db = get_db()
    
    # Find or create contact
    contact = db.query(Contact).filter_by(email=data["email"]).first()
    if not contact:
        contact = Contact(
            email=data["email"],
            name=data.get("name"),
            company=data.get("company"),
            source="website_form",
            status="new"
        )
        db.add(contact)
        db.commit()
    
    # Create project
    project = Project(
        contact_id=contact.id,
        name=data.get("project_name", "Untitled Project"),
        sector=data.get("sector"),
        funding_amount=parse_funding(data.get("funding_sought")),
        status="inquiry",
        inquiry_date=datetime.now()
    )
    db.add(project)
    db.commit()
    
    # Generate project ID
    project.project_id = f"JASPER-{datetime.now().year}-{project.id:03d}"
    db.commit()
    
    # Log activity
    activity = Activity(
        contact_id=contact.id,
        project_id=project.id,
        activity_type="form_submitted",
        subject="Quick Contact Form",
        metadata=data
    )
    db.add(activity)
    db.commit()
    
    # Score lead
    scoring = call_llm(
        task_type="lead_scoring",
        prompt=f"""Score this JASPER lead:
        
Name: {data.get('name')}
Company: {data.get('company')}
Sector: {data.get('sector')}
Funding: {data.get('funding_sought')}
Message: {data.get('message', '')}

Return JSON: {{"score": 1-10, "reasoning": "brief"}}"""
    )
    
    try:
        import json
        score_data = json.loads(scoring["content"])
        contact.score = score_data.get("score", 5)
        db.commit()
    except:
        pass
    
    # Send confirmation
    send_template_email(
        to=contact.email,
        template="inquiry_received",
        variables={
            "name": contact.name or "there",
            "project_id": project.project_id
        }
    )
    
    logger.info(f"Created project {project.project_id}")
    
    return jsonify({
        "status": "received",
        "project_id": project.project_id
    })


@app.route("/webhook/full-intake", methods=["POST"])
def handle_full_intake():
    """Handle full intake form submission."""
    
    data = request.json
    logger.info(f"Full intake received: {data.get('email')}")
    
    db = get_db()
    
    # Find contact and latest project
    contact = db.query(Contact).filter_by(email=data["email"]).first()
    if not contact:
        return jsonify({"error": "Contact not found"}), 404
    
    project = db.query(Project).filter_by(
        contact_id=contact.id
    ).order_by(Project.created_at.desc()).first()
    
    if not project:
        return jsonify({"error": "Project not found"}), 404
    
    # Update project with intake data
    project.name = data.get("project_name", project.name)
    project.location = data.get("project_location")
    project.subsector = data.get("subsector")
    project.funding_amount = data.get("total_investment")
    project.target_dfis = data.get("target_dfis", [])
    project.status = "intake_complete"
    project.intake_complete_date = datetime.now()
    db.commit()
    
    # Analyze intake with DeepSeek V3.2 (better for complex documents)
    analysis = call_llm(
        task_type="intake_analysis",
        prompt=f"""Analyze this JASPER intake submission:

{str(data)[:5000]}

Provide:
1. Completeness score (0-100%)
2. Missing critical information
3. Recommended JASPER package (Growth $12K, Institutional $25K, Infrastructure $45K)
4. Key strengths of this project
5. Potential concerns

Return structured analysis.""",
        max_tokens=1500
    )
    
    # Log activity
    activity = Activity(
        contact_id=contact.id,
        project_id=project.id,
        activity_type="intake_complete",
        subject="Full Intake Submitted",
        content=analysis["content"][:1000],
        metadata={"raw_data": data}
    )
    db.add(activity)
    db.commit()
    
    # Send confirmation
    send_template_email(
        to=contact.email,
        template="intake_received",
        variables={
            "name": contact.name,
            "project_name": project.name,
            "project_id": project.project_id
        }
    )
    
    return jsonify({
        "status": "received",
        "project_id": project.project_id,
        "analysis_preview": analysis["content"][:200]
    })


def parse_funding(funding_str: str) -> float:
    """Parse funding amount from string."""
    if not funding_str:
        return None
    
    # Remove currency symbols and commas
    cleaned = funding_str.replace("$", "").replace(",", "").replace(" ", "")
    
    # Handle M/B suffixes
    multiplier = 1
    if cleaned.upper().endswith("M"):
        multiplier = 1_000_000
        cleaned = cleaned[:-1]
    elif cleaned.upper().endswith("B"):
        multiplier = 1_000_000_000
        cleaned = cleaned[:-1]
    
    try:
        return float(cleaned) * multiplier
    except:
        return None


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
```

## Scheduler Service

```python
# /home/jasper/services/scheduler.py
"""
Scheduled task runner for follow-ups and reminders.
"""

import schedule
import time
import logging
from datetime import datetime, timedelta

from database.connection import get_db
from database.models import Project, Contact
from services.email_sender import send_template_email

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def check_proposal_followups():
    """Send reminders for proposals sent 7 days ago without response."""
    
    logger.info("Checking proposal follow-ups...")
    db = get_db()
    
    cutoff = datetime.now() - timedelta(days=7)
    day_ago = cutoff - timedelta(days=1)
    
    pending = db.query(Project).filter(
        Project.status == "proposal_sent",
        Project.proposal_sent_date <= cutoff,
        Project.proposal_sent_date >= day_ago
    ).all()
    
    for project in pending:
        contact = project.contact
        send_template_email(
            to=contact.email,
            template="proposal_reminder",
            variables={
                "name": contact.name,
                "project_name": project.name,
                "project_id": project.project_id,
                "days": 7
            }
        )
        logger.info(f"Sent proposal reminder: {project.project_id}")


def check_intake_reminders():
    """Remind contacts who haven't completed intake after 3 days."""
    
    logger.info("Checking intake reminders...")
    db = get_db()
    
    cutoff = datetime.now() - timedelta(days=3)
    day_ago = cutoff - timedelta(days=1)
    
    pending = db.query(Project).filter(
        Project.status == "intake_sent",
        Project.intake_sent_date <= cutoff,
        Project.intake_sent_date >= day_ago
    ).all()
    
    for project in pending:
        contact = project.contact
        send_template_email(
            to=contact.email,
            template="intake_reminder",
            variables={
                "name": contact.name,
                "project_name": project.name
            }
        )
        logger.info(f"Sent intake reminder: {project.project_id}")


def check_draft_reviews():
    """Remind clients to review drafts after 4 days."""
    
    logger.info("Checking draft review reminders...")
    db = get_db()
    
    cutoff = datetime.now() - timedelta(days=4)
    day_ago = cutoff - timedelta(days=1)
    
    pending = db.query(Project).filter(
        Project.status == "draft_delivered",
        Project.draft_date <= cutoff,
        Project.draft_date >= day_ago
    ).all()
    
    for project in pending:
        contact = project.contact
        send_template_email(
            to=contact.email,
            template="draft_review_reminder",
            variables={
                "name": contact.name,
                "project_name": project.name
            }
        )
        logger.info(f"Sent draft review reminder: {project.project_id}")


def expire_old_proposals():
    """Mark proposals as expired after 30 days."""
    
    logger.info("Checking expired proposals...")
    db = get_db()
    
    cutoff = datetime.now() - timedelta(days=30)
    
    expired = db.query(Project).filter(
        Project.status == "proposal_sent",
        Project.proposal_sent_date <= cutoff
    ).all()
    
    for project in expired:
        project.status = "proposal_expired"
        logger.info(f"Expired proposal: {project.project_id}")
    
    db.commit()


def daily_summary():
    """Generate and send daily summary."""
    
    logger.info("Generating daily summary...")
    db = get_db()
    
    today = datetime.now().date()
    
    # Count metrics
    new_inquiries = db.query(Project).filter(
        Project.inquiry_date >= today
    ).count()
    
    pending_proposals = db.query(Project).filter(
        Project.status == "proposal_sent"
    ).count()
    
    active_projects = db.query(Project).filter(
        Project.status.in_(["deposit_paid", "in_production", "draft_delivered"])
    ).count()
    
    # Get hot leads
    hot_leads = db.query(Contact).filter(
        Contact.score >= 8,
        Contact.status == "new"
    ).all()
    
    summary = f"""
JASPER Daily Summary - {today}
==============================

New inquiries today: {new_inquiries}
Pending proposals: {pending_proposals}
Active projects: {active_projects}

Hot leads awaiting response: {len(hot_leads)}
"""
    
    for lead in hot_leads:
        summary += f"  • {lead.email} (Score: {lead.score})\n"
    
    logger.info(summary)
    
    # TODO: Send to Bakiel via preferred channel


# Schedule tasks
schedule.every().day.at("09:00").do(check_proposal_followups)
schedule.every().day.at("10:00").do(check_intake_reminders)
schedule.every().day.at("11:00").do(check_draft_reviews)
schedule.every().day.at("02:00").do(expire_old_proposals)
schedule.every().day.at("08:00").do(daily_summary)


def main():
    """Main scheduler loop."""
    logger.info("Starting JASPER Scheduler...")
    
    while True:
        schedule.run_pending()
        time.sleep(60)


if __name__ == "__main__":
    main()
```

---

# 7. Email Infrastructure

## Hostinger SMTP Configuration

| Setting | Value |
|---------|-------|
| **SMTP Server** | smtp.hostinger.com |
| **Port** | 587 (TLS) |
| **Username** | models@jasperfinance.org |
| **Authentication** | Required |
| **Capacity** | 1,000 emails/day per mailbox |

## Email Sender Service

```python
# /home/jasper/services/email_sender.py
"""
SMTP email sender using Hostinger.
"""

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Environment, FileSystemLoader
import logging

from database.connection import get_db
from database.models import Email

SMTP_SERVER = "smtp.hostinger.com"
SMTP_PORT = 587
SMTP_USER = os.getenv("SMTP_USER", "models@jasperfinance.org")
SMTP_PASS = os.getenv("SMTP_PASSWORD")

# Template environment
template_env = Environment(
    loader=FileSystemLoader("/home/jasper/templates/emails")
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def send_template_email(
    to: str,
    template: str,
    variables: dict,
    cc: str = None,
    bcc: str = None
) -> bool:
    """
    Send email using template.
    
    Args:
        to: Recipient email
        template: Template name (without extension)
        variables: Variables to render in template
        cc: CC recipient
        bcc: BCC recipient
    
    Returns:
        bool: Success status
    """
    try:
        # Load templates
        subject_template = template_env.get_template(f"{template}_subject.txt")
        body_template = template_env.get_template(f"{template}.html")
        
        subject = subject_template.render(**variables).strip()
        body_html = body_template.render(**variables)
        
        return send_email(to, subject, body_html, cc=cc, bcc=bcc, template_used=template)
    
    except Exception as e:
        logger.error(f"Template error: {e}")
        return False


def send_email(
    to: str,
    subject: str,
    body_html: str,
    body_text: str = None,
    cc: str = None,
    bcc: str = None,
    template_used: str = None
) -> bool:
    """
    Send email via SMTP.
    
    Args:
        to: Recipient email
        subject: Email subject
        body_html: HTML body
        body_text: Plain text body (optional)
        cc: CC recipient
        bcc: BCC recipient
        template_used: Template name for tracking
    
    Returns:
        bool: Success status
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"JASPER Financial <{SMTP_USER}>"
        msg["To"] = to
        
        if cc:
            msg["Cc"] = cc
        
        # Add plain text version
        if body_text:
            msg.attach(MIMEText(body_text, "plain"))
        
        # Add HTML version
        msg.attach(MIMEText(body_html, "html"))
        
        # Build recipient list
        recipients = [to]
        if cc:
            recipients.append(cc)
        if bcc:
            recipients.append(bcc)
        
        # Send
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, recipients, msg.as_string())
        
        logger.info(f"Email sent to {to}: {subject}")
        
        # Log to database
        log_email(to, subject, body_html, template_used)
        
        return True
    
    except Exception as e:
        logger.error(f"Send error: {e}")
        return False


def log_email(to: str, subject: str, body: str, template: str):
    """Log sent email to database."""
    try:
        db = get_db()
        email_record = Email(
            direction="outbound",
            from_address=SMTP_USER,
            to_address=to,
            subject=subject,
            body_html=body,
            template_used=template,
            status="sent",
            sent_at=datetime.now()
        )
        db.add(email_record)
        db.commit()
    except Exception as e:
        logger.error(f"Log error: {e}")
```

## Email Templates

### Inquiry Received (`inquiry_received.html`)

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Century Gothic', sans-serif; color: #333; }
        .header { background: #1a365d; color: white; padding: 20px; }
        .content { padding: 20px; }
        .footer { background: #f5f5f5; padding: 15px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>JASPER™ Financial Architecture</h1>
    </div>
    <div class="content">
        <p>Dear {{ name }},</p>
        
        <p>Thank you for your interest in JASPER™ Financial Architecture.</p>
        
        <p>We specialize in creating investment-grade financial models for DFI funding applications. Our models have supported projects seeking financing from institutions including IFC, AfDB, ADB, IDC, and Land Bank.</p>
        
        <p>A member of our team will review your inquiry and respond within 24-48 business hours.</p>
        
        <p>If your project meets our criteria ($5M+ funding requirement, established sector), we'll invite you to complete our full intake form so we can prepare a detailed proposal.</p>
        
        <p>Best regards,</p>
        <p><strong>JASPER™ Financial Architecture</strong></p>
    </div>
    <div class="footer">
        <p>This is an automated response from JASPER™ Financial Architecture.</p>
        <p>models@jasperfinance.org | jasperfinance.org</p>
    </div>
</body>
</html>
```

### Inquiry Received Subject (`inquiry_received_subject.txt`)

```
Thank You for Contacting JASPER™ Financial Architecture
```

---

# 8. Automation Workflows

## Lead Processing Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       LEAD PROCESSING PIPELINE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ENTRY POINTS                                                           │
│  ─────────────                                                          │
│                                                                          │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐               │
│  │ Email       │     │ Website     │     │ LinkedIn    │               │
│  │ Inquiry     │     │ Form        │     │ Message     │               │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘               │
│         │                   │                   │                       │
│         └───────────────────┼───────────────────┘                       │
│                             ▼                                           │
│  STEP 1: CLASSIFICATION (GPT-5 Nano - 99% accuracy)                    │
│  ──────────────────────────────────────────────────                    │
│                             │                                           │
│         ┌───────────────────┼───────────────────┐                       │
│         ▼                   ▼                   ▼                       │
│    ┌─────────┐        ┌─────────┐        ┌─────────┐                   │
│    │  SPAM   │        │ INQUIRY │        │  OTHER  │                   │
│    │ Ignore  │        │ Process │        │  Log    │                   │
│    └─────────┘        └────┬────┘        └─────────┘                   │
│                            │                                            │
│                            ▼                                            │
│  STEP 2: LEAD SCORING (GPT-5 Nano - 96% reasoning)                     │
│  ─────────────────────────────────────────────────                     │
│                            │                                            │
│    Score 1-4        Score 5-7        Score 8-10                        │
│    ─────────        ─────────        ──────────                        │
│    ▼                ▼                ▼                                  │
│    Log only         Standard         🔥 HOT LEAD                        │
│                     response         Priority alert                     │
│                                      Fast response                      │
│                            │                                            │
│                            ▼                                            │
│  STEP 3: AUTO-RESPONSE (GPT-5 Nano draft)                              │
│  ────────────────────────────────────────                              │
│                            │                                            │
│                            ▼                                            │
│  STEP 4: CRM LOGGING (PostgreSQL)                                      │
│  ───────────────────────────────                                       │
│    • Create/update contact                                              │
│    • Log activity                                                       │
│    • Store score                                                        │
│    • Schedule follow-up                                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Proposal Generation Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PROPOSAL GENERATION PIPELINE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  TRIGGER: Intake form completed + approved                              │
│                                                                          │
│  STEP 1: INTAKE ANALYSIS (DeepSeek V3.2)                               │
│  ───────────────────────────────────────                               │
│    • Analyze all submitted documents                                    │
│    • Extract key project details                                        │
│    • Identify gaps and concerns                                         │
│    • Recommend package tier                                             │
│    • Output: Structured analysis (1,500 tokens)                        │
│                                                                          │
│                            ▼                                            │
│                                                                          │
│  STEP 2: PROPOSAL DRAFT (DeepSeek V3.2)                                │
│  ──────────────────────────────────────                                │
│    • Generate 3,000-5,000 word proposal                                │
│    • Include all standard sections                                      │
│    • Customize for sector and DFI target                               │
│    • Insert pricing and timeline                                        │
│    • Output: Complete draft (6,000 tokens)                             │
│                                                                          │
│                            ▼                                            │
│                                                                          │
│  STEP 3: HUMAN REVIEW (Bakiel via Claude Max)                          │
│  ─────────────────────────────────────────────                          │
│    • Review draft                                                       │
│    • Make adjustments                                                   │
│    • Add personal touches                                               │
│    • Approve for sending                                                │
│                                                                          │
│                            ▼                                            │
│                                                                          │
│  STEP 4: DELIVERY (Email + PDF)                                        │
│  ──────────────────────────────                                        │
│    • Convert to branded PDF                                             │
│    • Send via Hostinger SMTP                                           │
│    • Log to CRM                                                        │
│    • Set 7-day follow-up reminder                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Daily Automation Schedule

| Time | Task | Service |
|------|------|---------|
| **Continuous** | Email monitoring | email_receiver.py |
| **Continuous** | Form webhooks | form_handler.py |
| **02:00** | Expire old proposals | scheduler.py |
| **08:00** | Daily summary | scheduler.py |
| **09:00** | Proposal follow-ups (7 day) | scheduler.py |
| **10:00** | Intake reminders (3 day) | scheduler.py |
| **11:00** | Draft review reminders (4 day) | scheduler.py |

---

# 9. Cost Analysis

## Monthly Operating Costs

### AI Costs (OpenRouter) - Three-Tier Stack

| Model | Tier | Tasks | Volume | Cost/Task | Monthly |
|-------|------|-------|--------|-----------|---------|
| **GPT-5 Nano** | 1 | Classification | 100 | R0.15 | R15 |
| GPT-5 Nano | 1 | Email categorization | 200 | R0.08 | R16 |
| GPT-5 Nano | 1 | Data extraction | 50 | R0.15 | R7.50 |
| GPT-5 Nano | 1 | Quick responses | 100 | R0.10 | R10 |
| **GPT-5.1-Codex-Mini** | 2 | Lead scoring | 50 | R0.50 | R25 |
| GPT-5.1-Codex-Mini | 2 | Email drafts | 30 | R0.80 | R24 |
| GPT-5.1-Codex-Mini | 2 | Code tasks | 20 | R1.00 | R20 |
| **DeepSeek V3.2** | 3 | Intake analysis | 20 | R2.00 | R40 |
| DeepSeek V3.2 | 3 | Proposal drafts | 10 | R1.40 | R14 |
| DeepSeek V3.2 | 3 | Blog articles | 4 | R0.80 | R3.20 |
| Gemini Flash | Free | Fallback | 50 | R0 | R0 |
| **TOTAL** | | | | | **~R175** |

### Cost by Tier

| Tier | Model | Task % | Monthly Cost |
|------|-------|--------|--------------|
| 1 | GPT-5 Nano | 60% | ~R49 |
| 2 | GPT-5.1-Codex-Mini | 15% | ~R69 |
| 3 | DeepSeek V3.2 | 20% | ~R57 |
| Free | Gemini Flash + Budget | 5% | ~R0 |
| **TOTAL** | | 100% | **~R175** |

### Infrastructure Costs

| Item | Monthly Cost |
|------|-------------|
| Hostinger VPS (prepaid) | R0 |
| Domain (jasperfinance.org) | ~R20 |
| Hostinger SMTP | R0 (included) |
| PostgreSQL | R0 (self-hosted) |
| Redis | R0 (self-hosted) |
| Nano Banana Pro (prepaid) | R0 |
| Claude Max (your sub) | R0 |
| **TOTAL** | **~R20** |

### Total Monthly Cost

| Category | Cost |
|----------|------|
| AI (OpenRouter) | R175 |
| Infrastructure | R20 |
| **TOTAL** | **~R195/month** |

### Annual Cost

**~R2,340/year (~$130)**

### Cost Comparison

| Stack | Monthly | Annual | Trade-off |
|-------|---------|--------|-----------|
| GPT-5 Nano only | ~R131 | R1,572 | Lower instruction following (69%) |
| **Three-Tier (Recommended)** | **~R175** | **R2,100** | **Better precision + client-facing quality** |
| Claude-only | ~R735 | R8,820 | Expensive, overkill for simple tasks |

### ROI Analysis

| Metric | Value |
|--------|-------|
| Annual automation cost | R2,340 |
| One JASPER client (Growth) | R216,000 ($12,000) |
| One JASPER client (Institutional) | R450,000 ($25,000) |
| **Clients to break even** | **0.01** (less than 1) |
| **ROI per client** | **9,200%+** |

### Why Three Tiers?

| Decision | Rationale |
|----------|-----------|
| **GPT-5 Nano for 60%** | 99% classification at $0.05/1M input is unbeatable for high-volume simple tasks |
| **GPT-5.1-Codex-Mini for 15%** | 79% instruction following (vs 69%) worth 5x premium for client-facing communications |
| **DeepSeek V3.2 for 20%** | Only model that generates coherent 10,000+ word documents at this price |
| **Extra R44/month** | Negligible cost for meaningful quality improvement in lead scoring and emails |

---

# 10. Implementation Plan

## Week 1: Foundation

| Day | Task | Output |
|-----|------|--------|
| **1** | Set up Hostinger MCP on Mac | VPS control via Claude |
| **1** | Generate Hostinger API token | API access |
| **2** | SSH into VPS, install PostgreSQL | Database ready |
| **2** | Run database schema SQL | Tables created |
| **3** | Install Python, create virtualenv | Python environment |
| **3** | Install dependencies (requirements.txt) | Packages ready |
| **4** | Build ai/router.py | AI routing working |
| **4** | Build email_receiver.py | IMAP monitoring |
| **5** | Build email_sender.py | SMTP sending |
| **5** | Build form_handler.py | Webhooks ready |

## Week 2: Intelligence

| Day | Task | Output |
|-----|------|--------|
| **1** | Create all email templates | Templates ready |
| **2** | Build lead_processor.py | Lead scoring |
| **2** | Build proposal_generator.py | Proposal drafts |
| **3** | Build scheduler.py | Follow-ups working |
| **4** | Configure systemd services | Services auto-start |
| **4** | Configure Nginx | Endpoints public |
| **5** | End-to-end testing | Full pipeline tested |

## Week 3: Enhancement

| Day | Task | Output |
|-----|------|--------|
| **1** | Install Milvus Lite | Vector DB ready |
| **2** | Build embedding pipeline | Semantic search |
| **3** | Build DFI matching | Smart recommendations |
| **4** | Build blog_generator.py | Content automation |
| **5** | Documentation + backup scripts | Production ready |

## Systemd Service Files

### Email Receiver

```ini
# /etc/systemd/system/jasper-email.service
[Unit]
Description=JASPER Email Receiver
After=network.target postgresql.service

[Service]
Type=simple
User=jasper
WorkingDirectory=/home/jasper
EnvironmentFile=/home/jasper/config/.env
ExecStart=/home/jasper/venv/bin/python /home/jasper/services/email_receiver.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Form Handler

```ini
# /etc/systemd/system/jasper-forms.service
[Unit]
Description=JASPER Form Handler
After=network.target

[Service]
Type=simple
User=jasper
WorkingDirectory=/home/jasper
EnvironmentFile=/home/jasper/config/.env
ExecStart=/home/jasper/venv/bin/gunicorn -w 2 -b 127.0.0.1:5000 services.form_handler:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Scheduler

```ini
# /etc/systemd/system/jasper-scheduler.service
[Unit]
Description=JASPER Task Scheduler
After=network.target postgresql.service

[Service]
Type=simple
User=jasper
WorkingDirectory=/home/jasper
EnvironmentFile=/home/jasper/config/.env
ExecStart=/home/jasper/venv/bin/python /home/jasper/services/scheduler.py
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
```

### Enable All Services

```bash
sudo systemctl daemon-reload
sudo systemctl enable jasper-email jasper-forms jasper-scheduler
sudo systemctl start jasper-email jasper-forms jasper-scheduler
```

---

# 11. Appendix: Code Templates

## requirements.txt

```
# Core
flask==3.0.0
gunicorn==21.2.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
redis==5.0.1

# Email
imapclient==3.0.1

# AI
httpx==0.25.2
openai==1.6.1

# Templates
jinja2==3.1.2

# Utilities
python-dotenv==1.0.0
schedule==1.2.1
pydantic==2.5.2

# Vector DB (optional)
pymilvus==2.3.4
```

## .env Template

```bash
# Database
DATABASE_URL=postgresql://jasper_admin:your_password@localhost:5432/jasper_crm

# Email
IMAP_USER=models@jasperfinance.org
IMAP_PASSWORD=your_email_password
SMTP_USER=models@jasperfinance.org
SMTP_PASSWORD=your_email_password

# AI APIs
OPENROUTER_API_KEY=your_openrouter_key

# Hostinger (for MCP)
HOSTINGER_API_TOKEN=your_hostinger_token

# Nano Banana
HIGGSFIELD_API_KEY=your_higgsfield_key

# Internal
INTERNAL_EMAIL=your_personal_email@gmail.com
SECRET_KEY=random_secure_string

# Environment
ENVIRONMENT=production
DEBUG=false
```

## Nginx Configuration

```nginx
# /etc/nginx/sites-available/jasper

server {
    listen 80;
    server_name jasperfinance.org www.jasperfinance.org;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name jasperfinance.org www.jasperfinance.org;
    
    ssl_certificate /etc/letsencrypt/live/jasperfinance.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jasperfinance.org/privkey.pem;
    
    # Webhooks
    location /webhook/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static site
    location / {
        root /var/www/jasperfinance;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

---

# Summary

## What You Have

| Component | Status |
|-----------|--------|
| VPS (Hostinger) | ✅ Prepaid 24 months |
| Domain (jasperfinance.org) | ✅ Registered |
| Email (models@jasperfinance.org) | ✅ Configured |
| Nano Banana Pro | ✅ Prepaid annually |
| Claude Max | ✅ Subscribed |

## What Gets Built

| Component | Technology |
|-----------|------------|
| CRM Database | PostgreSQL |
| Email Automation | Python + Hostinger SMTP |
| Simple Tasks (60%) | GPT-5 Nano |
| Precision Tasks (15%) | GPT-5.1-Codex-Mini |
| Long-form (20%) | DeepSeek V3.2 |
| Form Handling | Flask + Webhooks |
| Scheduling | Python + systemd |
| Infrastructure Control | Hostinger MCP |

## Three-Tier AI Stack

```
TIER 1: GPT-5 Nano ($0.05/$0.40)        → 60% of tasks
        Classification, extraction, simple responses
        
TIER 2: GPT-5.1-Codex-Mini ($0.25/$2.00) → 15% of tasks
        Lead scoring, email drafts, code, client-facing
        
TIER 3: DeepSeek V3.2 ($0.27/$0.40)     → 20% of tasks
        Proposals, blogs, reports, long-form
        
FREE:   Gemini Flash                     → 5% fallback
```

## Monthly Costs

| Item | Cost |
|------|------|
| AI Tier 1 (GPT-5 Nano) | R49 |
| AI Tier 2 (Codex-Mini) | R69 |
| AI Tier 3 (DeepSeek) | R57 |
| Domain | R20 |
| Everything else | R0 |
| **TOTAL** | **R195/month** |

## Your Daily Experience

**Morning:**
```
You: "Claude, what's my JASPER pipeline?"

Me: "Good morning Bakiel. Here's your pipeline:

NEW LEADS (overnight):
- 2 inquiries received
- 1 hot lead (score 9): Solar project, Kenya, $18M

PENDING:
- 3 proposals awaiting response
- 1 intake form incomplete

ACTIVE:
- Project JASPER-2025-003: Draft due Friday

RECOMMENDED ACTIONS:
1. Review hot lead proposal draft
2. Follow up on 5-day proposal"
```

**Processing:**
```
You: "Generate proposal for the Kenya solar lead"

Me: [Runs DeepSeek V3.2]
"Proposal draft ready. Package: Institutional ($25K).
View at /proposals/JASPER-2025-006.pdf
Ready to send?"
```

**This is the complete system. Ready to build?**

---

*JASPER™ Financial Architecture*
*Pure Python + Claude Architecture v2.1*
*Three-Tier AI Stack*
*December 2025*
