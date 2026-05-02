# 📅 APPOINTLY - Complete Project Documentation

**Project Name:** Appointly  
**Description:** A comprehensive appointment scheduling and booking platform for modern service industry  
**Tech Stack:** React 18 + TypeScript + TanStack Start + TailwindCSS + shadcn/ui  
**Database:** PostgreSQL (Neon)  
**Payment:** Razorpay Integration  
**Deployment:** Cloudflare Workers

---

## 📁 FILE-BY-FILE BREAKDOWN

### 🔧 Configuration Files

#### **1. package.json**
- **Purpose:** Defines project dependencies, scripts, and metadata
- **What it does:**
  - Manages npm dependencies (React, TanStack Router, TailwindCSS, etc.)
  - Defines build and development scripts
  - Specifies Node.js module type as "module" (ESM)
- **Key Dependencies:**
  - React 18+ framework
  - TanStack React Router for client-side routing
  - TanStack React Start for full-stack framework
  - shadcn/ui components (Radix UI)
  - TailwindCSS for styling
  - Razorpay for payment processing
  - bcryptjs for password hashing
  - postgres client for database
  - Zod for schema validation

#### **2. vite.config.ts**
- **Purpose:** Vite build configuration for the application
- **What it does:**
  - Uses `@lovable.dev/vite-tanstack-config` pre-configured setup
  - Includes TanStack Start, React, TailwindCSS plugins
  - Cloudflare Workers build support
  - Component tagging for development
  - Uses `defineConfig` from lovable package for simplified configuration

#### **3. tsconfig.json**
- **Purpose:** TypeScript compiler configuration
- **What it does:**
  - Targets ES2022 for modern JavaScript features
  - Enables strict type checking
  - Configures JSX to use React 18's new JSX transform
  - Sets up path alias (`@/*` → `./src/*`)
  - Enables bundler module resolution for proper imports
  - Disables unused variable warnings but keeps unused parameter warnings off

#### **4. eslint.config.js**
- **Purpose:** JavaScript linting and code quality rules
- **What it does:**
  - Enforces consistent code style
  - Catches potential bugs and anti-patterns
  - Configured for ESM modules

#### **5. wrangler.jsonc**
- **Purpose:** Cloudflare Workers configuration
- **What it does:**
  - Configures deployment to Cloudflare Workers
  - Sets up environment variables for database and JWT
  - Defines worker runtime settings

#### **6. bunfig.toml**
- **Purpose:** Bun package manager configuration
- **What it does:**
  - Alternative to npm/yarn configuration
  - Bun is a faster JavaScript runtime/package manager

#### **7. components.json**
- **Purpose:** shadcn/ui CLI configuration
- **What it does:**
  - Configures where UI components are installed
  - Sets TailwindCSS configuration path
  - Defines import aliases

#### **8. README.md**
- **Purpose:** Project overview and documentation
- **What it does:**
  - Lists all features for customers, organizers, and admins
  - Documents tech stack and dependencies
  - Provides installation and setup instructions
  - Shows API endpoints and database schema

---

### 🛣️ Route Files (Client-Side Pages)

#### **9. src/routes/__root.tsx**
- **Purpose:** Root layout component for all routes
- **What it does:**
  - Sets up global HTML structure and metadata (SEO tags)
  - Wraps entire app with AuthProvider for authentication context
  - Provides Sonner toast notifications
  - Includes 404 error boundary component
  - Imports global CSS
  - Sets meta tags for OG (Open Graph) and Twitter Card preview

#### **10. src/routes/index.tsx**
- **Purpose:** Landing/home page
- **What it does:**
  - Displays hero section with call-to-action buttons
  - Shows featured services (first 4)
  - Fetches services list on page load
  - Contains animated background gradients and blobs
  - Links to service browsing and signup pages
  - Optimized for SEO with meta tags

#### **11. src/routes/login.tsx**
- **Purpose:** User authentication login page
- **What it does:**
  - Form for email and password login
  - Validation of credentials
  - Handles 2FA/OTP verification redirect if needed
  - Role-based home page redirect (admin, organiser, or customer)
  - Shows password toggle button
  - Error handling and loading states

#### **12. src/routes/signup.tsx**
- **Purpose:** New user account creation
- **What it does:**
  - Form for user registration (name, email, password)
  - Role selection (customer or organiser)
  - Creates new user in database
  - Generates and sends OTP verification email
  - Validates input with Zod schema
  - Redirects to OTP verification page

#### **13. src/routes/verify-otp.tsx**
- **Purpose:** Email verification with OTP
- **What it does:**
  - Displays 6-digit OTP input
  - Verifies OTP against email
  - Creates authenticated session cookie on success
  - Rate limiting (5 attempt maximum)
  - Resend OTP functionality
  - Handles expired OTP codes

#### **14. src/routes/forgot-password.tsx**
- **Purpose:** Password reset request page
- **What it does:**
  - User enters email to request password reset
  - Generates reset token and sends via email
  - Validates email exists in system
  - Displays success message after sending

#### **15. src/routes/reset-password.tsx**
- **Purpose:** Password reset form
- **What it does:**
  - Validates reset token from email link
  - User enters new password
  - Updates password hash in database
  - Invalidates all existing sessions for security
  - Redirects to login after successful reset

#### **16. src/routes/profile.tsx**
- **Purpose:** User profile and account management
- **What it does:**
  - Displays current user information
  - Allows editing name, phone, email
  - Updates user details in database
  - Shows role and account creation date
  - Provides logout functionality

#### **17. src/routes/services.tsx**
- **Purpose:** Browse all available services
- **What it does:**
  - Fetches all published appointment types from database
  - Displays services in grid/list layout
  - Shows service title, description, duration
  - Links to individual service booking page
  - Search and filter functionality
  - Shows provider information

#### **18. src/routes/book.$id.tsx**
- **Purpose:** Book an appointment for specific service
- **What it does:**
  - Loads appointment type details by ID
  - Shows available time slots
  - Displays custom questions for the appointment
  - Handles provider selection
  - Integrates with Razorpay for payment
  - Creates booking record in database
  - Shows booking confirmation

#### **19. src/routes/organiser.index.tsx**
- **Purpose:** Organiser dashboard home
- **What it does:**
  - Shows overview of organiser's business
  - Displays statistics (bookings, revenue, etc.)
  - Lists recent bookings
  - Quick access to service management
  - Requires organiser role (role guard)

#### **20. src/routes/organiser.services.new.tsx**
- **Purpose:** Create new appointment type/service
- **What it does:**
  - Form for creating new service offering
  - Inputs: title, description, duration, price
  - Capacity management settings
  - Payment collection options
  - Manual confirmation toggle
  - Custom questions for customer
  - Provider assignment
  - Publishes service for customer booking

#### **21. src/routes/organiser.services.$id.tsx**
- **Purpose:** Edit existing appointment type/service
- **What it does:**
  - Loads service details by ID
  - Allows editing all service properties
  - Manage time slots (weekly or flexible)
  - Edit pricing and payment settings
  - Update custom questions
  - Delete service option
  - View bookings for this service

#### **22. src/routes/admin.index.tsx**
- **Purpose:** Admin dashboard
- **What it does:**
  - Platform-wide statistics and analytics
  - User management section
  - View all bookings across platform
  - System monitoring and health checks
  - Requires admin role access

---

### 🖥️ Server-Side Functions

#### **23. src/server/auth.server.ts**
- **Purpose:** Server-only authentication utilities
- **What it does:**
  - Password hashing with bcryptjs (10 salt rounds)
  - JWT token creation and verification (30-day expiry)
  - Session cookie management (httpOnly, secure, sameSite=lax)
  - OTP generation (6-digit random codes)
  - Session validation and parsing
  - Cookie encryption and signing
  - Type definitions for session payload

#### **24. src/server/auth.functions.ts**
- **Purpose:** Server functions for authentication flows
- **What it does:**
  - `signupStart()` - Creates new user, generates OTP
  - `verifyOtp()` - Validates OTP, creates session
  - `resendOtp()` - Resends verification code
  - `loginFn()` - Authenticates user credentials
  - `meFn()` - Returns current logged-in user
  - `logoutFn()` - Clears session cookie
  - `requestPasswordReset()` - Sends reset email
  - `resetPassword()` - Updates password with token
  - Input validation with Zod schemas
  - Error handling and rate limiting

#### **25. src/server/db.server.ts**
- **Purpose:** Database connection and schema management
- **What it does:**
  - Creates PostgreSQL connection pool
  - `ensureSchema()` - Creates all tables if not exist
  - Tables created:
    - `users` - User profiles and credentials
    - `otps` - OTP codes for verification
    - `bookings` - Appointment bookings
    - `appointment_types` - Service definitions
    - `schedules` - Weekly/flexible time slots
    - `custom_questions` - Service-specific questions
    - `providers` - Service provider profiles
  - Creates indexes for query optimization
  - Connection pooling (max 1, 5s idle timeout)
  - SSL required for security

#### **26. src/server/email.server.ts**
- **Purpose:** Email sending functionality
- **What it does:**
  - Uses `@lovable.dev/email-js` for sending emails
  - Email templates:
    - OTP verification email
    - Password reset email
    - Booking confirmation email
    - Booking cancellation email
  - HTML email formatting
  - Supports different email purposes (auth, booking, etc.)

#### **27. src/server/bookings.functions.ts**
- **Purpose:** Booking management operations
- **What it does:**
  - `createBooking()` - Creates new appointment booking
  - `getUserBookings()` - Retrieves user's bookings
  - `getOrganizerBookings()` - Retrieves organizer's bookings
  - `cancelBooking()` - Cancels existing booking
  - `rescheduleBooking()` - Moves booking to different slot
  - `confirmBooking()` - Organizer confirms pending booking
  - Checks availability and prevents double-booking
  - Updates payment status

#### **28. src/server/payments.functions.ts**
- **Purpose:** Payment processing with Razorpay
- **What it does:**
  - `createOrder()` - Creates Razorpay payment order
  - `verifyPayment()` - Verifies payment signature
  - `refundPayment()` - Processes refunds
  - Amount calculation with currency support
  - Payment metadata tracking
  - Error handling for payment failures

#### **29. src/server/services.functions.ts**
- **Purpose:** Appointment type/service management
- **What it does:**
  - `createService()` - Creates new appointment type
  - `updateService()` - Updates service details
  - `listServices()` - Gets all published services
  - `getServiceById()` - Retrieves single service details
  - `deleteService()` - Removes service
  - `publishService()` - Makes service bookable
  - `unpublishService()` - Hides service from customers

#### **30. src/server/organiser.functions.ts**
- **Purpose:** Organiser profile and business management
- **What it does:**
  - `updateOrganizerProfile()` - Updates business info
  - `getOrganizerStats()` - Calculates business statistics
  - `getOrganizerServices()` - Lists organizer's services
  - `getOrganizerBookings()` - Lists organizer's bookings

#### **31. src/server/services-catalog.server.ts**
- **Purpose:** Public service catalog/discovery
- **What it does:**
  - Searches services by category, provider
  - Filters by availability, price range
  - Implements pagination
  - Calculates average ratings
  - Suggests related services

#### **32. src/server/admin.functions.ts**
- **Purpose:** Admin-only operations
- **What it does:**
  - `getAllUsers()` - Lists all platform users
  - `getUserStats()` - User analytics
  - `deactivateUser()` - Suspends user account
  - `getBookingStats()` - Platform booking statistics
  - `generateReport()` - Export booking/revenue reports
  - Role validation (admin-only)

---

### ⚛️ Components (React/UI)

#### **33. src/components/layout.tsx**
- **Purpose:** Layout wrappers for different page types
- **What it does:**
  - `PageShell` - Standard page layout with header/footer
  - `AuthShell` - Layout for auth pages (login, signup)
  - `DashboardShell` - Layout for admin/organizer dashboards
  - Navigation and breadcrumbs
  - Responsive design

#### **34. src/components/role-guard.tsx**
- **Purpose:** Route protection based on user role
- **What it does:**
  - Checks user authentication status
  - Validates user role matches required role
  - Redirects unauthenticated users to login
  - Prevents unauthorized access
  - Shows loading state while checking auth

#### **35. src/components/ui/accordion.tsx**
- **Purpose:** Accordion component from shadcn/ui
- **What it does:**
  - Collapsible sections of content
  - Single or multiple sections open
  - Uses Radix UI accordion primitive
  - Keyboard accessible
  - Styled with TailwindCSS

#### **36. src/components/ui/alert-dialog.tsx**
- **Purpose:** Confirmation dialog component
- **What it does:**
  - Modal alert for user confirmation
  - Prevents accidental destructive actions
  - Cancel and action buttons
  - Radix UI alert dialog primitive

#### **37. src/components/ui/alert.tsx**
- **Purpose:** Alert/notification component
- **What it does:**
  - Displays inline alerts (info, warning, error)
  - Can be dismissible
  - Icon support
  - Different variants for severity levels

#### **38. src/components/ui/avatar.tsx**
- **Purpose:** User avatar display
- **What it does:**
  - Shows user profile picture
  - Falls back to initials if no image
  - Radix UI avatar primitive
  - Customizable sizes

#### **39. src/components/ui/badge.tsx**
- **Purpose:** Badge/tag component
- **What it does:**
  - Displays labels or tags
  - Status indicators (pending, confirmed, etc.)
  - Different variants (default, secondary, outline)
  - Used throughout for status display

#### **40. src/components/ui/button.tsx**
- **Purpose:** Reusable button component
- **What it does:**
  - Primary, secondary, outline, ghost variants
  - Different sizes (sm, md, lg)
  - Loading states with spinners
  - Icon support
  - Disabled states

#### **41. src/components/ui/calendar.tsx**
- **Purpose:** Date picker calendar
- **What it does:**
  - Month/year navigation
  - Date selection
  - Highlights available dates
  - Disables past dates
  - Shows selected date highlighting

#### **42. src/components/ui/card.tsx**
- **Purpose:** Card container component
- **What it does:**
  - Container for grouped content
  - Header, title, description sections
  - Footer for actions
  - Consistent spacing and styling

#### **43. src/components/ui/checkbox.tsx**
- **Purpose:** Checkbox input component
- **What it does:**
  - Toggle true/false values
  - Controlled and uncontrolled modes
  - Custom styling
  - Radix UI checkbox primitive

#### **44. src/components/ui/command.tsx**
- **Purpose:** Command palette/search component
- **What it does:**
  - Searchable command menu
  - Keyboard shortcuts support
  - Groups commands by category
  - Filtering and highlighting

#### **45. src/components/ui/dialog.tsx**
- **Purpose:** Modal dialog component
- **What it does:**
  - Full-screen overlay dialog
  - Radix UI dialog primitive
  - Open/close animation
  - Backdrop click to close (optional)
  - Keyboard shortcuts (ESC to close)

#### **46. src/components/ui/drawer.tsx**
- **Purpose:** Side drawer/sidebar component
- **What it does:**
  - Slides in from side (mobile-friendly)
  - Can be swipe-closeable
  - Responsive (dialog on mobile, drawer on desktop)
  - Content grouping

#### **47. src/components/ui/dropdown-menu.tsx**
- **Purpose:** Dropdown menu component
- **What it does:**
  - Trigger button with dropdown options
  - Keyboard navigation
  - Submenu support
  - Icons and labels
  - Radix UI dropdown primitive

#### **48. src/components/ui/form.tsx**
- **Purpose:** Form handling with react-hook-form
- **What it does:**
  - Form wrapper for react-hook-form
  - Form field component
  - Label and error message display
  - Built-in validation support
  - Zod schema integration via resolvers

#### **49. src/components/ui/hover-card.tsx**
- **Purpose:** Hover tooltip/card component
- **What it does:**
  - Shows content on hover
  - Tooltip-like behavior
  - Positioned relative to trigger
  - Delay before showing
  - Radix UI hover card primitive

#### **50. src/components/ui/input-otp.tsx**
- **Purpose:** OTP input component (6-digit code)
- **What it does:**
  - Auto-focus between digit inputs
  - Only accepts numbers
  - Copy-paste support
  - Auto-submit on full input
  - Styled input cells

#### **51. src/components/ui/input.tsx**
- **Purpose:** Text input component
- **What it does:**
  - Email, password, text inputs
  - Validation states (error, success)
  - Placeholder and label support
  - Icon support
  - Disabled and readonly states

#### **52. src/components/ui/label.tsx**
- **Purpose:** Form label component
- **What it does:**
  - Associated with form inputs
  - Accessibility support (htmlFor)
  - Consistent styling
  - Optional indicator for required fields

#### **53. src/components/ui/menubar.tsx**
- **Purpose:** Top menu bar component (like app menu)
- **What it does:**
  - Horizontal menu with submenus
  - Keyboard navigation
  - File-like menu structure
  - Desktop application style

#### **54. src/components/ui/navigation-menu.tsx**
- **Purpose:** Primary navigation component
- **What it does:**
  - Top navigation bar
  - Megamenu support
  - Link grouping
  - Active link highlighting
  - Mobile-responsive hamburger menu

#### **55. src/components/ui/pagination.tsx**
- **Purpose:** Pagination controls
- **What it does:**
  - Previous/next buttons
  - Page number buttons
  - Jump to page input
  - Total pages and current page display

#### **56. src/components/ui/popover.tsx**
- **Purpose:** Popover tooltip component
- **What it does:**
  - Opens on click/focus
  - Positioned floating element
  - Click outside to close
  - Arrow pointing to trigger
  - Radix UI popover primitive

#### **57. src/components/ui/progress.tsx**
- **Purpose:** Progress bar component
- **What it does:**
  - Shows progress percentage
  - Animated fill
  - Different colors for status
  - Accessible with aria attributes

#### **58. src/components/ui/radio-group.tsx**
- **Purpose:** Radio button group component
- **What it does:**
  - Mutually exclusive options
  - Only one can be selected
  - Keyboard navigation
  - Custom styling

#### **59. src/components/ui/scroll-area.tsx**
- **Purpose:** Custom scrollbar styling
- **What it does:**
  - Styled scrollbars
  - Smooth scrolling
  - Responsive height
  - Radix UI scroll area primitive

#### **60. src/components/ui/select.tsx**
- **Purpose:** Dropdown select component
- **What it does:**
  - Select from multiple options
  - Searchable (with filter)
  - Keyboard navigation
  - Open/close animations
  - Disabled options support

#### **61. src/components/ui/separator.tsx**
- **Purpose:** Visual divider component
- **What it does:**
  - Horizontal or vertical line
  - Content grouping
  - Semantic separator

#### **62. src/components/ui/sheet.tsx**
- **Purpose:** Sheet/drawer from bottom (mobile)
- **What it does:**
  - Slides up from bottom on mobile
  - Desktop modal dialog
  - Responsive behavior
  - Handle to dismiss on mobile

#### **63. src/components/ui/sidebar.tsx**
- **Purpose:** Sidebar navigation
- **What it does:**
  - Collapsible navigation menu
  - Logo/branding area
  - Menu item groups
  - Active item highlighting
  - Responsive (drawer on mobile)

#### **64. src/components/ui/skeleton.tsx**
- **Purpose:** Loading skeleton/placeholder
- **What it does:**
  - Animated placeholder while loading
  - Pulse animation
  - Different sizes
  - Improves perceived performance

#### **65. src/components/ui/slider.tsx**
- **Purpose:** Range slider component
- **What it does:**
  - Select value from range
  - Keyboard support (arrow keys)
  - Min/max configuration
  - Step intervals
  - Range selection (min-max)

#### **66. src/components/ui/sonner.tsx**
- **Purpose:** Toast notification system
- **What it does:**
  - Displays temporary notifications
  - Success, error, info, warning types
  - Auto-dismiss or click to close
  - Custom action buttons
  - Position customization

#### **67. src/components/ui/switch.tsx**
- **Purpose:** Toggle switch component
- **What it does:**
  - On/off toggle
  - Accessibility support
  - Radix UI switch primitive
  - Custom styling

#### **68. src/components/ui/table.tsx**
- **Purpose:** Data table component
- **What it does:**
  - Table header, body, footer
  - Row and cell components
  - Consistent styling
  - Responsive behavior

#### **69. src/components/ui/tabs.tsx**
- **Purpose:** Tabbed interface component
- **What it does:**
  - Multiple tab panels
  - Click to switch tabs
  - Keyboard navigation
  - Radix UI tabs primitive

#### **70. src/components/ui/textarea.tsx**
- **Purpose:** Multi-line text input
- **What it does:**
  - Text area for longer input
  - Auto-resize capability
  - Placeholder and label
  - Validation states

#### **71. src/components/ui/toggle-group.tsx**
- **Purpose:** Button group toggle component
- **What it does:**
  - Toggle multiple options
  - Highlight selected buttons
  - Single or multiple selection
  - Icon and text support

#### **72. src/components/ui/toggle.tsx**
- **Purpose:** Single toggle button
- **What it does:**
  - Press to toggle state
  - Icon support
  - Active/inactive styling
  - Accessibility support

#### **73. src/components/ui/tooltip.tsx**
- **Purpose:** Tooltip component
- **What it does:**
  - Shows on hover
  - Short helpful text
  - Positioned above trigger
  - Auto-hide after delay
  - Radix UI tooltip primitive

---

### 🛠️ Utilities and Hooks

#### **74. src/lib/auth-context.tsx**
- **Purpose:** React context for authentication state
- **What it does:**
  - Provides user object globally
  - `useAuth()` hook for components
  - Loading state during auth check
  - Refresh function to reload user data
  - Logout function
  - Wraps entire app to manage auth

#### **75. src/lib/types.ts**
- **Purpose:** TypeScript type definitions
- **What it does:**
  - `User` type - user profile data
  - `Role` type - "customer", "organiser", "admin"
  - `AppointmentType` - service definition
  - `Booking` - appointment booking data
  - `Provider` - service provider profile
  - `Question` - custom question for booking
  - `ScheduleEntry` - time slots definition
  - `WeeklySlots` and `FlexibleSlots` - slot types

#### **76. src/lib/utils.ts**
- **Purpose:** Utility functions
- **What it does:**
  - `cn()` - TailwindCSS class name merging
  - Date formatting helpers
  - String manipulation utilities
  - Validation helpers
  - Shared helper functions

#### **77. src/lib/razorpay.ts**
- **Purpose:** Razorpay payment integration helpers
- **What it does:**
  - Initializes Razorpay checkout
  - Handles payment success/failure
  - Payment form integration
  - Order ID generation
  - Amount formatting for payment

#### **78. src/hooks/use-mobile.tsx**
- **Purpose:** React hook to detect mobile viewport
- **What it does:**
  - Returns boolean for mobile detection
  - Responsive design helper
  - Uses media query detection
  - Reactively updates on resize

---

### 📱 Router and Configuration

#### **79. src/router.tsx**
- **Purpose:** TanStack Router configuration
- **What it does:**
  - Defines all route paths
  - Route hierarchy and nesting
  - Lazy code-splitting configuration
  - Path parameters and search params
  - Route loaders and actions

#### **80. src/routeTree.gen.ts**
- **Purpose:** Generated route tree (auto-generated)
- **What it does:**
  - Auto-generated by TanStack Router plugin
  - Flat file router definition
  - Do not edit manually - regenerates on route changes

#### **81. src/styles.css**
- **Purpose:** Global styles and CSS variables
- **What it does:**
  - TailwindCSS directives
  - CSS custom properties for theming
  - Color variables (primary, secondary, etc.)
  - Global animations (fade, blob animation, gradient)
  - Component-specific styles

---

### 🎨 Assets

#### **82. public/favicon.png**
- **Purpose:** Website favicon
- **What it does:**
  - Browser tab icon
  - Bookmarks icon
  - Apple touch icon for mobile home screen

#### **83. public/** (other assets)
- **Purpose:** Static assets
- **What it does:**
  - Logo images
  - Placeholder images
  - Static resources served directly

#### **84. src/assets/hero-booking.jpg**
- **Purpose:** Hero section banner image
- **What it does:**
  - Landing page hero visual
  - Service showcase image

#### **85. src/assets/appointly-logo.png**
- **Purpose:** Application logo
- **What it does:**
  - Brand logo for navigation
  - App icon/branding

---

## 🎓 HACKATHON MENTOR Q&A

### Framework & Architecture Questions

**Q1: What is TanStack Start and why was it chosen for this project?**
A: TanStack Start is a full-stack React framework that combines TanStack Router with server-side functions. It was chosen because:
- Server functions (`createServerFn`) allow collocating client and server code
- Enables type-safe API calls (client code is type-aware of server function signatures)
- Handles authentication natively with cookies
- Simpler than traditional REST APIs - no manual API route creation needed
- Built-in code splitting and lazy loading
- Integrates well with Cloudflare Workers for serverless deployment

**Q2: How does authentication work in Appointly?**
A: The authentication flow:
1. User signs up with email/password → server hashes password with bcryptjs (10 rounds)
2. OTP (6-digit) is generated and sent via email
3. User verifies OTP → server validates against stored hash
4. On success → JWT token issued with 30-day expiry
5. JWT stored in httpOnly cookie (secure, sameSite=lax)
6. Every request includes cookie, server validates JWT signature
7. React Context (`AuthProvider`) manages user state globally
8. `useAuth()` hook provides user object to components
9. Role-based access control (`role-guard`) protects admin/organizer routes

**Q3: What role-based access control is implemented?**
A: Three roles exist:
- **customer**: Can view services, book appointments, manage own bookings
- **organiser**: Can create services, manage slots, view own bookings, analytics
- **admin**: Can manage all users, view platform-wide statistics, deactivate accounts
- Role stored in JWT and validated on protected routes
- `role-guard` component redirects unauthorized users

**Q4: How are appointments scheduled and slots managed?**
A: Slot management has two modes:
1. **Weekly Slots**: Recurring schedule (Mon-Fri 9-5 with breaks)
2. **Flexible Slots**: Custom date/time slots (for special availability)
- Stored in `schedules` table with provider and appointment type
- When booking, system checks availability against slots
- Double-booking prevented with database constraints
- Capacity limits enforced (how many people per slot)
- Minimum lead time and maximum advance booking can be configured

**Q5: Explain the payment integration with Razorpay.**
A: Payment flow:
1. User adds service to cart with final amount calculated
2. `createOrder()` server function calls Razorpay API
3. Razorpay returns order ID and checkout URL
4. Client opens Razorpay checkout modal
5. User enters payment details in Razorpay iframe (secure)
6. On payment completion, Razorpay sends webhook notification
7. `verifyPayment()` validates payment signature
8. Booking marked as "paid" in database
9. Confirmation email sent
10. Refunds can be processed via `refundPayment()`

**Q6: How is the database structured for scalability?**
A: PostgreSQL (Neon) is used with:
- Proper indexing on frequently queried columns
- `bookings_slot_idx` on (appointment_type_id, provider_id, slot_start) for availability queries
- Foreign key relationships between tables
- JSONB column for flexible question answers
- Connection pooling (max 1 connection, 5s idle) for serverless
- Transactions for atomic operations (booking + payment)

**Q7: What's the difference between server functions and API routes?**
A: TanStack Start uses server functions instead of REST routes:
- **Server Functions**: Defined with `createServerFn()`, automatically typed
- **No .http files needed**: Direct import and call from client
- **Type safety**: TypeScript knows exact parameters and return type
- **Automatic serialization**: Objects automatically serialized/deserialized
- **CORS handled automatically**: No manual CORS configuration
- **Example**: `const user = await loginFn({data: {email, password}})`

**Q8: How does OTP verification improve security?**
A: OTP provides:
1. **Email verification**: Ensures real email ownership
2. **Rate limiting**: Max 5 attempts before code resets
3. **Expiration**: 10 minutes validity to reduce compromise window
4. **Hash storage**: OTP stored as bcrypt hash (never plaintext)
5. **Time-based**: Each OTP sent is unique and timestamped
6. **Account takeover prevention**: Attacker needs email AND password

**Q9: Explain the deployment to Cloudflare Workers.**
A: CloudFlare Workers deployment:
- Built with `vite build` → produces optimized bundle
- `wrangler.jsonc` configures worker settings
- Environment variables (JWT_SECRET, DATABASE_URL) set in wrangler
- PostgreSQL connection through Neon's serverless driver
- Workers handle HTTP requests and run server functions
- Automatic edge caching for static assets
- DDoS protection and SSL/TLS included
- Auto-scaling (no server management)
- Can handle thousands of concurrent requests

**Q10: How is the admin dashboard secured?**
A: Admin security measures:
1. Role check on routes (`admin.index` protected with role-guard)
2. Server functions validate admin role (`if (session.role !== 'admin') throw`)
3. Admin can only be created by initial setup (not via signup)
4. All admin actions logged for audit trail
5. Sensitive operations (user deactivation) require confirmation
6. RBAC prevents privilege escalation

---

### Component & UI Architecture

**Q11: Why use shadcn/ui over other component libraries?**
A: shadcn/ui advantages:
- **Copy-paste based**: Components copied into project (not npm package)
- **Full control**: Easy to customize without forking
- **Radix UI primitives**: Unstyled, accessible components as foundation
- **TailwindCSS integration**: Perfect fit with TailwindCSS styling
- **Zero dependencies**: No component bloat
- **Type-safe**: Built with TypeScript
- **Latest practices**: Follows React 18+ and accessibility standards

**Q12: How does form validation work with react-hook-form and Zod?**
A: Form validation pipeline:
1. React-hook-form manages form state and validation
2. Zod schemas define validation rules (`z.string().email().min(8)`)
3. Resolvers package bridges react-hook-form and Zod
4. On form submit, Zod schema validates entire object
5. If invalid, field-level errors displayed
6. If valid, data passed to server function
7. Server function validates again with Zod (defense in depth)
8. Example: `const res = await signupStart({data: {email, password}})`

**Q13: How are mobile and desktop layouts handled?**
A: Responsive design approach:
- TailwindCSS responsive prefixes (`md:`, `lg:`, `sm:`)
- `use-mobile` hook detects viewport (true if < 768px)
- Components switch between `<Sheet>` (mobile) and `<Dialog>` (desktop)
- Sidebar collapses to hamburger on mobile
- Grid layouts become single column on mobile
- Touch-friendly button sizes (44px minimum)
- Scroll areas for long lists on small screens

**Q14: Explain the animation system (fade-in, blob, gradient-pan).**
A: Animations in styles.css:
- **@keyframes fade-in-up**: Elements slide up while fading in (landing page hero)
- **@keyframes blob**: Floating blob background animation
- **@keyframes gradient-pan**: Animated gradient text effect
- **delay-* utilities**: Control animation start time
- **CSS animations**: GPU-accelerated for smooth performance
- Opacity and transform used (not layout properties) for performance

**Q15: How does error handling work in the UI?**
A: Error handling strategy:
1. Try-catch blocks in server functions throw Error with message
2. Components wrap calls in try-catch
3. Error message displayed via toast (`toast.error(message)`)
4. User can retry operation
5. Sensitive errors don't expose implementation details
6. Form validation prevents invalid data submission
7. Loading states prevent double-submission
8. Graceful degradation if JavaScript disabled

---

### Business Logic & Features

**Q16: How does the booking confirmation workflow work for organizers?**
A: Manual confirmation flow:
1. Customer books appointment → status = "pending"
2. If organizer enabled "manual confirm" → booking waits
3. Organizer sees pending booking in dashboard
4. Organizer reviews details and clicks "Confirm"
5. `confirmBooking()` updates status to "confirmed"
6. Confirmation email sent to customer
7. Customer now sees confirmed appointment
8. Automatic confirmation: If "manual confirm" disabled → status = "confirmed" immediately

**Q17: How are capacity limits enforced?**
A: Capacity management:
1. Service has `max_capacity` (e.g., 5 people per slot)
2. Each booking has `capacity_count` (people booking this slot)
3. When booking, calculate: total_booked = SUM(capacity_count) for slot
4. Check: total_booked + new_capacity <= max_capacity
5. If exceeds → reject booking with "Slot full"
6. Cancellation frees up capacity for others
7. Organizer can manually adjust capacity if needed

**Q18: What's the difference between weekly and flexible scheduling?**
A: Scheduling modes:
- **Weekly Slots**: Repeating pattern (Mon-Fri 9-1pm, 2-5pm)
  - Set once, applies every week
  - Good for regular service providers
  - Easy to manage ongoing schedules
  - Example: Salon with fixed hours
  
- **Flexible Slots**: Individual date/time slots
  - Created per specific date
  - Organizer can set custom hours
  - Good for event-based services
  - Example: Workshops on specific dates

**Q19: How are service recommendations calculated?**
A: Recommendation engine:
1. User views service A
2. System queries related services:
   - Same category as service A
   - Same provider as service A
   - Similar price range
3. Sorts by: rating, popularity, recency
4. Shows top 4 related services
5. Encourages cross-selling
6. Personalizes based on view history

**Q20: How does the referral/sharing system work?**
A: Service sharing:
1. Service has `shareToken` (unique URL-safe string)
2. Organizer generates share link: `book/{service_id}?token={shareToken}`
3. Link can be shared on social media
4. Share token validates that service is published
5. Anonymous users can book without login (except payment requires account)
6. Analytics track bookings from shared links

---

### Performance & Optimization

**Q21: How are images optimized for performance?**
A: Image optimization:
- Vite handles image imports as module (code splitting)
- Images compressed during build
- Lazy loading with `loading="lazy"` attribute
- Responsive images with `srcset` for different viewports
- WebP format support in modern browsers
- Skeleton loading while images load
- CDN caching through Cloudflare

**Q22: What caching strategies are implemented?**
A: Caching approach:
1. **Browser caching**: Static assets cached with long max-age
2. **API caching**: React Query caches server function results
3. **Database indexes**: Faster queries on frequently used columns
4. **Connection pooling**: Reuse database connections
5. **Service worker**: Could be added for offline capability
6. **CDN caching**: Cloudflare caches edge globally

**Q23: How is the database connection optimized for serverless?**
A: Serverless database optimization:
- Connection pool with max 1 (serverless constraint)
- Idle timeout 5s (close unused connections)
- Connect timeout 10s (fail fast on database down)
- `prepare: false` (avoid prepared statements for simplicity)
- Neon serverless driver for low-latency connections
- Database calls batched where possible
- Indexes on frequently queried columns

**Q24: How does lazy loading work with TanStack Router?**
A: Lazy code splitting:
- Routes defined with `lazy()` for component splitting
- Server functions not loaded until needed
- Improves initial bundle size
- Faster initial page load
- Routes loaded on demand as user navigates
- Component imports are tree-shaken automatically

**Q25: What SEO optimizations are in place?**
A: SEO implementation:
1. Meta tags in head (title, description, og tags, twitter card)
2. Structured data (JSON-LD) for bookings
3. Sitemap.xml for search engines
4. robots.txt for crawler configuration
5. Open Graph images for social sharing
6. Mobile-friendly responsive design
7. Fast page load (Core Web Vitals)

---

### Testing & Quality

**Q26: What testing strategies could be implemented?**
A: Recommended testing approach:
1. **Unit tests**: Utility functions, hooks (Jest, Vitest)
2. **Integration tests**: Server functions, database (using test database)
3. **E2E tests**: Full user flows (Playwright, Cypress)
4. **Component tests**: React components in isolation
5. **Payment testing**: Razorpay test mode/sandbox
6. **Database migrations**: Test schema changes

**Q27: How would you implement monitoring and error tracking?**
A: Monitoring setup:
1. **Error tracking**: Sentry for production errors
2. **Performance monitoring**: Web Vitals tracking
3. **Database monitoring**: Query performance, connection pool stats
4. **Payment monitoring**: Razorpay webhook delivery tracking
5. **User analytics**: Mixpanel or Google Analytics
6. **Uptime monitoring**: Statuspage or UptimeRobot
7. **Logging**: Structured logs with timestamp, level, context

**Q28: What security vulnerabilities should be tested?**
A: Security testing:
1. **SQL Injection**: Ensure parameterized queries (postgres library handles this)
2. **XSS**: DOMPurify for user content (TailwindCSS handles most)
3. **CSRF**: httpOnly cookies prevent (handled by framework)
4. **Password strength**: Minimum 8 characters enforced
5. **Rate limiting**: Implement on auth endpoints
6. **JWT expiry**: 30-day expiry balances security/UX
7. **Payment security**: HTTPS only, PCI compliance via Razorpay

**Q29: How would you load test the system?**
A: Load testing approach:
1. **Tool selection**: K6, JMeter, or Locust
2. **Test scenarios**: 
   - 1000 concurrent users browsing services
   - 100 concurrent bookings
   - Peak hour traffic simulation
3. **Database metrics**: Monitor connection pool, query time
4. **Worker metrics**: CPU, memory usage on Cloudflare
5. **Payment processing**: Ensure Razorpay handles concurrent orders
6. **Identify bottlenecks**: Optimize based on results

**Q30: What dependency updates and security patching process exists?**
A: Dependency management:
1. **Regular audits**: `npm audit` for vulnerabilities
2. **Update schedule**: Weekly/monthly dependency checks
3. **Security alerts**: GitHub Dependabot for automated PRs
4. **Testing before merge**: Run full test suite before merging updates
5. **BREAKING CHANGES**: Review changelogs for incompatibilities
6. **Lock file**: `bun.lockb` ensures reproducible installs
7. **Minor/patch updates**: Less risky, update more frequently

---

### Advanced Architecture

**Q31: How would you implement real-time notifications?**
A: Real-time implementation options:
1. **WebSockets**: Socket.io for persistent connections
2. **Server-Sent Events**: Lighter alternative to WebSockets
3. **Push notifications**: Service Worker + Web Push API
4. **Email notifications**: Already implemented (OTP, confirmations)
5. **SMS notifications**: Twilio integration for SMS
6. **In-app notifications**: Toast or notification center
7. **Architecture**: Pub/Sub pattern for scalability

**Q32: How would multi-provider support be extended?**
A: Multi-provider architecture:
1. **Assignment modes**: 
   - Manual: Organizer assigns provider
   - Auto: System suggests available provider
   - Customer choice: Customer selects preferred provider
2. **Load balancing**: Distribute bookings evenly across providers
3. **Provider availability**: Each provider has own schedule
4. **Provider ratings**: Display provider reviews
5. **Provider profiles**: Specializations and availability
6. **Provider payouts**: Track earnings per provider

**Q33: How would you implement recurring bookings?**
A: Recurring appointment handling:
1. **Series creation**: Create one booking, generate series
2. **Frequency options**: Daily, weekly, monthly, custom
3. **Series management**: Edit/cancel entire series or individual bookings
4. **Capacity**: Each booking counts separately
5. **Payment**: Charge per occurrence or upfront
6. **Cancellation**: Allow canceling individual occurrences
7. **Database**: Store series ID linking related bookings

**Q34: How would you add waitlist functionality?**
A: Waitlist implementation:
1. **Waitlist table**: Store with booking time, position
2. **Full slot handling**: Auto-add to waitlist if slot full
3. **Notifications**: Notify when slot becomes available
4. **Auto-conversion**: Offer moved-up customer automatic booking
5. **Expiry**: Waitlist offers expire after 24 hours
6. **Priority**: FIFO ordering on waitlist
7. **Analytics**: Track waitlist demand for slot optimization

**Q35: How would you implement an affiliate/referral program?**
A: Referral program architecture:
1. **Referral codes**: Generate unique code per user
2. **Tracking**: Track bookings from referral link
3. **Commissions**: Calculate commission per booking
4. **Payouts**: Monthly payouts to affiliates
5. **Affiliate dashboard**: Track clicks, conversions, earnings
6. **Tiers**: Bonus structure for high performers
7. **Database**: Referral table linking referrer and customer

---

### Scalability & DevOps

**Q36: How would you scale this application to 1 million users?**
A: Scaling strategy:
1. **Database**: Migrate to managed PostgreSQL with read replicas
2. **Caching**: Redis for session/rate limit caching
3. **CDN**: Cloudflare already provides edge caching
4. **Rate limiting**: Implement per IP/user rate limits
5. **Database sharding**: Shard by region or customer
6. **Queue system**: Bull/RabbitMQ for async jobs (emails, payments)
7. **Monitoring**: Datadog/NewRelic for observability

**Q37: What would be the disaster recovery plan?**
A: Disaster recovery:
1. **Database backups**: Daily automated backups to S3
2. **Point-in-time recovery**: Neon provides PITR capabilities
3. **Geographic redundancy**: Multiple regions for failover
4. **CI/CD**: Automated deployments for quick recovery
5. **Rollback plan**: Keep previous versions deployable
6. **Data encryption**: At rest and in transit
7. **Incident response**: Runbooks for common failures

**Q38: How would you implement blue-green deployment?**
A: Blue-green deployment process:
1. **Blue env**: Current production
2. **Green env**: New version staging
3. **Deploy to green**: Run all tests in green
4. **Switch traffic**: Once validated, route 100% to green
5. **Rollback**: If issues, immediately switch back to blue
6. **Infrastructure as Code**: Terraform/Bicep for reproducibility
7. **Automation**: GitHub Actions for CI/CD pipeline

**Q39: What database migration strategy would you use?**
A: Migration approach:
1. **Version control**: All migrations in `/migrations` folder
2. **Sequential numbering**: `001_initial_schema.sql`
3. **Reversible migrations**: Include down migration
4. **Testing**: Test migrations in staging first
5. **Atomic transactions**: Entire migration succeeds/fails together
6. **Zero-downtime**: Use ALTER TABLE ADD COLUMN (non-blocking)
7. **Communication**: Notify stakeholders of maintenance window

**Q40: How would you handle data privacy (GDPR compliance)?**
A: Privacy implementation:
1. **Data collection consent**: Explicit opt-in for emails
2. **Right to deletion**: Allow users to delete account and data
3. **Data portability**: Export user data in JSON
4. **Privacy policy**: Clear disclosure of data usage
5. **Encryption**: Passwords hashed, sensitive data encrypted
6. **Audit trail**: Log who accessed what data and when
7. **Data residency**: Store data in compliant regions

---

## 📊 Project Statistics

| Metric | Count |
|--------|-------|
| Total Files | 85+ |
| Routes | 12 |
| UI Components | 37 |
| Server Functions | 8 files |
| Lines of Code | ~5000+ |
| Dependencies | 60+ |
| Database Tables | 7+ |
| Supported Languages | TypeScript |
| Database | PostgreSQL |
| Framework | TanStack Start |
| Styling | TailwindCSS |

---

## 🚀 Key Takeaways for Hackathon

1. **Full-Stack Framework**: TanStack Start provides elegant full-stack development
2. **Type Safety**: TypeScript + Zod ensures type safety end-to-end
3. **Server Functions**: No REST API boilerplate needed
4. **Serverless Ready**: Runs on Cloudflare Workers with minimal config
5. **Component Library**: shadcn/ui provides production-ready components
6. **Authentication**: JWT + OTP provides secure, user-friendly auth
7. **Payment Integration**: Razorpay handles complex payment flows
8. **Role-Based Access**: Flexible RBAC for multi-tenant scenarios
9. **Database**: PostgreSQL with proper indexing handles complex queries
10. **Responsive Design**: TailwindCSS handles mobile-first design elegantly

---

**Document Created:** May 2, 2026  
**Project:** Appointly - Smart Appointment Scheduling Platform  
**Version:** 1.0
