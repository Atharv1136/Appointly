# Quick Start Guide

Get up and running with Appointly in minutes.

## Prerequisites

- **Bun** (recommended) or Node.js 18+
- **Git**

## Installation

```bash
# Clone repository
git clone https://github.com/Atharv1136/Appointly.git
cd appointly

# Install dependencies
bun install

# Start development server
bun run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Environment Setup

Create `.env.local`:

```env
VITE_API_URL=http://localhost:8787
VITE_RAZORPAY_KEY=your_razorpay_key
```

## Common Commands

```bash
# Development
bun run dev          # Start dev server
bun run build        # Build for production
bun run preview      # Preview production build

# Code Quality
bun run lint         # Run ESLint
bun run type-check   # TypeScript checking

# Dependencies
bun add package      # Add dependency
bun add -D package   # Add dev dependency
bun update           # Update dependencies
```

## Project Structure

```
src/
├── components/ui/    # UI components
├── routes/          # Pages
├── server/          # Backend functions
├── lib/            # Utilities
└── assets/         # Images, icons
```

## Need Help?

- Check the full README.md
- Review TEAM_PUSH_GUIDE.md for Git workflow
- Ask in team chat