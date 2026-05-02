# Workflow Overview

Visual guide to Appointly's development and deployment workflow.

## Development Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Feature   │ -> │  Develop   │ -> │    Test    │
│   Branch    │    │             │    │            │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Pull Req   │ <- │   Commit   │ <- │   Lint &   │
│             │    │             │    │   Build    │
└─────────────┘    └─────────────┘    └─────────────┘
```

## Team Roles

```
Atharv (Frontend)
├── Components
├── Routes
├── UI/UX
└── Client Logic

Vedant (DevOps)
├── Dependencies
├── Build Config
├── Deployment
└── Documentation

[Teammate 3] (Backend)
├── Server Functions
├── Database
├── Auth
└── APIs
```

## Git Workflow

```
main (production)
    ▲
    │
    ├─ feature/atharv-frontend ───┐
    │                             │
    ├─ feature/vedant-config ─────┼─ Pull Request ── Merge
    │                             │
    └─ feature/[name]-backend ────┘
```

## File Ownership Matrix

| File Type | Atharv | Vedant | Backend Dev |
|-----------|--------|--------|-------------|
| `src/components/` | ✅ | ❌ | ❌ |
| `src/routes/` | ✅ | ❌ | ❌ |
| `src/server/` | ❌ | ❌ | ✅ |
| `package.json` | ❌ | ✅ | ❌ |
| `*.config.*` | ❌ | ✅ | ❌ |
| `wrangler.jsonc` | ❌ | ✅ | ❌ |
| `README.md` | ❌ | ✅ | ❌ |

## Deployment Pipeline

```
Local Development ── Push ── CI/CD ── Staging ── Production
        │               │        │        │         │
        └─ bun run dev  └─ Tests └─ Build └─ Deploy └─ Live
```

## Code Quality Checks

```
Pre-commit Hook
├── ESLint
├── TypeScript
├── Build Test
└── Dependency Check
```

## Environment Variables

```
.env.local (local)
├── VITE_API_URL
├── VITE_RAZORPAY_KEY
└── CLOUDFLARE_*

.env.production (prod)
├── API_URL
├── RAZORPAY_KEY
└── CLOUDFLARE_*
```

## Build Process

```
Source Code ── Vite ── TypeScript ── Bundle ── Optimize ── Deploy
     │           │          │          │          │         │
     └─ src/     └─ vite.config.ts    └─ tsconfig.json    └─ wrangler.jsonc
```