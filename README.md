# 📅 Appointly - Smart Appointment Scheduling Platform

**Appointly** is a comprehensive appointment scheduling and booking platform designed for the modern service industry. It enables real-time booking with multiple providers, flexible scheduling, and complete appointment lifecycle management.

[![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/Atharv1136/Appointly)
[![Node.js Version](https://img.shields.io/badge/node.js-%3E%3D16.0.0-green)](https://nodejs.org)
[![React Version](https://img.shields.io/badge/React-%3E%3D18.0-blue)](https://react.dev)

---

## 🎯 Features

### 👥 User Features
- ✅ **Easy Booking** - Book appointments in just a few clicks
- ✅ **Real-Time Availability** - See live provider availability
- ✅ **Appointment Management** - View, reschedule, and cancel bookings
- ✅ **OTP Verification** - Secure account verification
- ✅ **User Profile** - Manage personal information
- ✅ **Service Discovery** - Browse available services
- ✅ **Multiple Payment Options** - Razorpay integration for secure payments

### 🏢 Organizer Features  
- ✅ **Service Management** - Create and manage service offerings
- ✅ **Slot Management** - Define custom appointment slots
- ✅ **Capacity Planning** - Set service capacity and availability
- ✅ **Appointment Tracking** - Monitor all bookings
- ✅ **Organizer Dashboard** - Analytics and insights
- ✅ **Profile Management** - Edit business information

### 🔐 Admin Features
- ✅ **User Management** - Manage platform users
- ✅ **Admin Dashboard** - Platform-wide analytics
- ✅ **Role-Based Access** - Secure admin operations
- ✅ **System Monitoring** - Track platform health

---

## 💻 Tech Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 18+ |
| **TypeScript** | Type Safety | 5.x |
| **TanStack Router** | Routing | Latest |
| **shadcn/ui** | Component Library | Latest |
| **Tailwind CSS** | Styling | 3.x |
| **Vite** | Build Tool | 5.x |

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime | 16+ |
| **Cloudflare Workers** | Serverless Functions | Latest |
| **TypeScript** | Backend Type Safety | 5.x |
| **PostgreSQL** | Database | 12+ |

### Additional Services
| Service | Purpose |
|---------|---------|
| **Razorpay** | Payment Processing |
| **Email Service** | Notifications & Confirmations |
| **Cloudflare** | Deployment & CDN |

---

## 🚀 Getting Started

### Prerequisites
Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **Bun** (package manager)
- **Git**

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/Atharv1136/Appointly.git
cd Appointly
```

#### 2. Install Dependencies
```bash
bun install
# or
npm install
```

#### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# API Configuration
VITE_API_URL=http://localhost:8787

# Razorpay Configuration
VITE_RAZORPAY_KEY=your_razorpay_key_here

# Cloudflare Workers (if deploying)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

#### 4. Run Development Server
```bash
bun run dev
# or
npm run dev
```

The application will be available at `http://localhost:3000`

---

## 📁 Project Structure

```
Appointly/
├── src/
│   ├── components/              # React Components
│   │   ├── ui/                  # shadcn/ui Components
│   │   │   ├── accordion.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ... (30+ UI components)
│   │   ├── layout.tsx            # Main Layout Component
│   │   └── role-guard.tsx        # Auth Guard Component
│   │
│   ├── routes/                   # Page Components
│   │   ├── __root.tsx            # Root Layout Route
│   │   ├── index.tsx             # Home Page
│   │   ├── login.tsx             # Login Page
│   │   ├── signup.tsx            # Sign Up Page
│   │   ├── appointments.tsx      # Appointments List
│   │   ├── services.tsx          # Services Listing
│   │   ├── profile.tsx           # User Profile
│   │   ├── book.$id.tsx          # Booking Page
│   │   ├── forgot-password.tsx   # Password Recovery
│   │   ├── reset-password.tsx    # Password Reset
│   │   ├── verify-otp.tsx        # OTP Verification
│   │   ├── organiser/            # Organizer Routes
│   │   │   ├── index.tsx
│   │   │   ├── services.$id.tsx
│   │   │   └── services.new.tsx
│   │   └── admin/                # Admin Routes
│   │       └── index.tsx
│   │
│   ├── server/                   # Backend Functions
│   │   ├── auth.server.ts        # Auth Middleware
│   │   ├── auth.functions.ts     # Auth Logic
│   │   ├── db.server.ts          # Database Operations
│   │   ├── email.server.ts       # Email Service
│   │   ├── payments.functions.ts # Payment Processing
│   │   ├── bookings.functions.ts # Booking Management
│   │   ├── services.functions.ts # Service Management
│   │   ├── organiser.functions.ts# Organizer Functions
│   │   └── admin.functions.ts    # Admin Functions
│   │
│   ├── lib/
│   │   ├── auth-context.tsx      # Auth Context Provider
│   │   ├── types.ts              # TypeScript Interfaces
│   │   ├── utils.ts              # Utility Functions
│   │   └── razorpay.ts           # Payment Integration
│   │
│   ├── hooks/
│   │   └── use-mobile.tsx        # Mobile Detection Hook
│   │
│   ├── assets/                   # Static Assets
│   ├── router.tsx                # Router Configuration
│   ├── styles.css                # Global Styles
│   └── main.tsx                  # Application Entry Point
│
├── public/                       # Static Files
├── package.json                  # Dependencies & Scripts
├── tsconfig.json                 # TypeScript Configuration
├── vite.config.ts                # Vite Configuration
├── wrangler.jsonc                # Cloudflare Workers Config
├── components.json               # shadcn/ui Registry
├── eslint.config.js              # ESLint Configuration
└── README.md                      # This File
```

---

## 🎮 Available Scripts

### Development
```bash
# Start development server
bun run dev
npm run dev

# Build for production
bun run build
npm run build

# Preview production build
bun run preview
npm run preview
```

### Code Quality
```bash
# Run ESLint
bun run lint
npm run lint

# Check TypeScript types
bun run type-check
npm run type-check
```

### Deployment
```bash
# Deploy to Cloudflare Workers
wrangler deploy
```

---

## 🔐 Authentication

### User Roles
1. **Guest User** - Can browse services
2. **Registered User** - Can book appointments
3. **Organizer** - Can manage services and appointments
4. **Admin** - Full platform management

### Authentication Flow
```
1. Sign Up → Email Verification → OTP Confirmation
2. Login → Session Creation → Dashboard Access
3. Profile → Account Management
4. Logout → Session Termination
```

---

## 💳 Payment Integration

### Razorpay Integration
- Secure payment processing
- Multiple payment methods
- Invoice generation
- Payment status tracking

```typescript
// Example: Initiate Payment
const razorpayKey = process.env.VITE_RAZORPAY_KEY;
const paymentOptions = {
  key: razorpayKey,
  amount: totalAmount * 100,
  currency: "INR",
  // ... additional options
};
```

---

## 📧 Email Notifications

The platform sends emails for:
- ✉️ Account verification
- ✉️ OTP codes
- ✉️ Appointment confirmations
- ✉️ Appointment reminders
- ✉️ Booking updates
- ✉️ Password reset links

---

## 🌐 API Endpoints (Backend)

### Authentication
```
POST   /api/auth/signup           - Register new user
POST   /api/auth/login            - Login user
POST   /api/auth/verify-otp       - Verify OTP
POST   /api/auth/forgot-password  - Request password reset
POST   /api/auth/reset-password   - Reset password
GET    /api/auth/logout           - Logout user
```

### Bookings
```
GET    /api/bookings              - Get user bookings
POST   /api/bookings              - Create new booking
PUT    /api/bookings/:id          - Update booking
DELETE /api/bookings/:id          - Cancel booking
```

### Services
```
GET    /api/services              - List all services
GET    /api/services/:id          - Get service details
POST   /api/services              - Create service (Organizer)
PUT    /api/services/:id          - Update service (Organizer)
DELETE /api/services/:id          - Delete service (Organizer)
```

### Appointments
```
GET    /api/appointments          - Get appointments
POST   /api/appointments          - Schedule appointment
GET    /api/appointments/:id      - Get appointment details
PUT    /api/appointments/:id      - Reschedule appointment
DELETE /api/appointments/:id      - Cancel appointment
```

### Admin
```
GET    /api/admin/users           - List all users
GET    /api/admin/bookings        - All bookings analytics
GET    /api/admin/statistics      - Platform statistics
```

---

## 🤝 Team & Contributors

### Hackathon Team

| Role | Name | Responsibilities |
|------|------|------------------|
| **Frontend Developer** | Atharv | UI Components, Routing, Frontend Architecture |
| **Backend Developer** | Team Member 2 | API Development, Authentication, Database |
| **DevOps/Config** | Team Member 3 | Build Setup, Deployment, Configuration |

### Contributions

All team members have contributed equally to this project:
- **Frontend**: `feature/atharv-frontend` 
- **Backend**: `feature/backend-auth`
- **Configuration**: `feature/config-setup`

---

## 📚 Documentation Files

- **[TEAM_PUSH_GUIDE.md](TEAM_PUSH_GUIDE.md)** - Team collaboration guide
- **[QUICK_START.md](QUICK_START.md)** - Quick setup reference
- **[WORKFLOW_OVERVIEW.md](WORKFLOW_OVERVIEW.md)** - Development workflow

---

## 🐛 Troubleshooting

### Issue: Port 3000 already in use
```bash
# Change port in vite.config.ts
export default defineConfig({
  server: {
    port: 3001  // or another available port
  }
})
```

### Issue: Dependencies not installing
```bash
# Clear cache and reinstall
bun cache clean
rm -rf node_modules
bun install
```

### Issue: TypeScript errors
```bash
# Run type check
npm run type-check

# Fix auto-fixable issues
npm run lint -- --fix
```

### Issue: Environment variables not loading
```bash
# Ensure .env.local exists in project root
# Check variable names match VITE_ prefix for frontend
# Restart dev server after changes
```

---

## 🚢 Deployment

### Deploy to Cloudflare Workers
```bash
# Install Wrangler CLI
npm install -g @cloudflare/wrangler

# Configure wrangler.jsonc with your account details
# Deploy
wrangler deploy
```

### Production Build
```bash
# Build optimized production version
bun run build

# Output is in dist/ directory
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [TanStack Router Guide](https://tanstack.com/router/latest)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Razorpay Integration](https://razorpay.com/docs/)

---

## 💬 Support & Contact

For questions or issues:
1. Check the [Documentation](./docs) folder
2. Review existing [GitHub Issues](https://github.com/Atharv1136/Appointly/issues)
3. Create a new issue with detailed information

---

## ⭐ Acknowledgments

- **shadcn/ui** - Beautiful component library
- **TanStack** - Router and data management
- **Tailwind CSS** - Utility-first CSS framework
- **Cloudflare** - Serverless infrastructure
- **Razorpay** - Payment processing
- **Hackathon Community** - Inspiration and support

---

## 🗺️ Project Roadmap

### Phase 1 (Current)
- ✅ Core authentication system
- ✅ Booking management
- ✅ Service listings
- ✅ Payment integration

### Phase 2 (Upcoming)
- 📋 Email notifications & reminders
- 📋 Advanced scheduling features
- 📋 Analytics dashboard
- 📋 Mobile app version

### Phase 3 (Future)
- 🔮 AI-powered recommendations
- 🔮 Video call integration
- 🔮 Multi-language support
- 🔮 Advanced reporting

---

**Made with ❤️ by the Appointly Team during the Hackathon**

Last Updated: May 2, 2026
