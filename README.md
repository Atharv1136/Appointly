# Appointly

The perfect appointment booking system built with modern web technologies.

## Overview

Appointly is a full-stack appointment booking application that allows users to discover services, book appointments, and manage their schedules. Built with React, TypeScript, and Cloudflare Workers.

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS
- **Routing:** TanStack Router
- **UI Components:** Radix UI, shadcn/ui
- **Build Tool:** Vite
- **Package Manager:** Bun
- **Backend:** Cloudflare Workers
- **Database:** PostgreSQL
- **Payments:** Razorpay
- **Deployment:** Cloudflare Workers

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- Git
- Cloudflare account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Atharv1136/Appointly.git
cd appointly
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
VITE_API_URL=http://localhost:8787
VITE_RAZORPAY_KEY=your_razorpay_key

# Cloudflare Workers
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

4. Start the development server:
```bash
bun run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run preview` - Preview production build
- `bun run lint` - Run ESLint
- `bun run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── layout.tsx      # Layout components
├── routes/             # Page routes (TanStack Router)
├── server/             # Server-side functions
├── lib/                # Utilities and shared logic
├── assets/             # Static assets
└── styles.css          # Global styles
```

## Deployment

### Cloudflare Workers

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Authenticate with Cloudflare:
```bash
wrangler auth login
```

3. Deploy:
```bash
wrangler deploy
```

## Contributing

1. Create a feature branch: `git checkout -b feature/your-name-task`
2. Make your changes
3. Run tests and linting: `bun run lint`
4. Commit your changes: `git commit -m "feat: description"`
5. Push to GitHub: `git push origin feature/your-name-task`
6. Create a Pull Request

## Team

- **Atharv:** Frontend development
- **Vedant:** Configuration and DevOps
- **[Teammate 3]:** Backend development

## License

© 2024 Appointly. All rights reserved.