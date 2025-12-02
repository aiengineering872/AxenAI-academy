# AXEN AI Platform - Complete File Structure Analysis

## 📋 Project Overview
**AXEN** - AI Engineering Learning Platform
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Storage)
- **AI Integration**: Google Gemini API
- **Type**: Progressive Web Application (PWA)

---

## 📁 Root Directory Structure

```
AxenAI/
├── app/                        # Next.js App Router directory
├── components/                 # React components
├── contexts/                   # React context providers
├── lib/                        # Utilities and configurations
├── types/                      # TypeScript type definitions
├── public/                     # Static assets
├── node_modules/               # Dependencies
├── package.json                # Project dependencies & scripts
├── package-lock.json           # Locked dependency versions
├── tsconfig.json               # TypeScript configuration
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── next-env.d.ts               # Next.js TypeScript definitions
└── Documentation files         # Multiple .md files
```

---

## 📂 Detailed Directory Breakdown

### 1. `/app` - Next.js App Router (Pages & Routes)

```
app/
├── layout.tsx                  # Root layout with providers
├── page.tsx                    # Homepage/landing page
├── globals.css                 # Global styles
├── error.tsx                   # Error boundary
├── global-error.tsx            # Global error boundary
├── not-found.tsx               # 404 page
│
├── auth/                       # Authentication routes
│   ├── login/
│   │   └── page.tsx           # Login page
│   └── signup/
│       └── page.tsx           # Signup page
│
├── dashboard/                  # Dashboard routes
│   ├── page.tsx               # Main dashboard
│   └── [moduleId]/            # Dynamic module route
│       └── page.tsx
│
├── learning/                   # Learning module routes
│   ├── page.tsx               # Courses overview
│   └── [courseId]/            # Dynamic course route
│       └── [moduleId]/        # Dynamic module route
│           └── page.tsx
│
├── admin/                      # Admin panel
│   ├── app logo/              # Admin logo assets
│   └── page.tsx               # Admin dashboard
│
├── projects/                   # Projects showcase
│   └── page.tsx
│
├── practice-tests/             # Practice tests
│   └── page.tsx
│
├── leaderboard/                # Leaderboard
│   └── page.tsx
│
├── certificates/               # Certificates
│   └── page.tsx
│
├── videos/                     # Video learning
│   └── page.tsx
│
├── simulator/                  # Code simulator
│   └── page.tsx
│
├── mentor/                     # AI mentor/chatbot
│   └── page.tsx
│
├── career/                     # Career guidance
│   └── page.tsx
│
├── resume-builder/             # Resume builder
│   └── page.tsx
│
├── api-integration/            # API integration settings
│   └── page.tsx
│
├── document/                   # Documents (empty or not specified)
│
└── components/                 # App-specific components
    └── ServiceWorkerRegistration.tsx  # PWA service worker
```

**Route Structure Summary:**
- **Static Routes**: `/`, `/dashboard`, `/learning`, `/projects`, etc.
- **Dynamic Routes**: `/[moduleId]`, `/[courseId]/[moduleId]`
- **Auth Routes**: `/auth/login`, `/auth/signup`
- **Feature Routes**: `/simulator`, `/mentor`, `/career`, etc.

---

### 2. `/components` - React Components

```
components/
├── layout/                     # Layout components
│   ├── DashboardLayout.tsx    # Main dashboard layout wrapper
│   ├── Sidebar.tsx            # Navigation sidebar
│   └── MobileNav.tsx          # Mobile navigation
│
├── dashboard/                  # Dashboard-specific components
│   ├── ChartSkeleton.tsx      # Loading skeleton for charts
│   ├── CompletionStatusChart.tsx  # Progress chart
│   └── ModuleProgressChart.tsx    # Module progress visualization
│
├── admin/                      # Admin panel components
│   ├── CourseModal.tsx         # Course creation/editing modal
│   └── ProjectModal.tsx        # Project management modal
│
└── activity/                   # Activity tracking
    └── UserActivityTracker.tsx # Tracks user activity
```

**Component Organization:**
- **Layout**: Shared layout components (Sidebar, MobileNav)
- **Feature-specific**: Grouped by feature (dashboard, admin, activity)
- **Reusable**: Chart components, modals, skeletons

---

### 3. `/contexts` - React Context Providers

```
contexts/
├── AuthContext.tsx            # Authentication state management
└── ThemeContext.tsx           # Theme switching (dark/light modes)
```

**Context Responsibilities:**
- **AuthContext**: User authentication, session management, user data
- **ThemeContext**: Theme persistence, color scheme switching

---

### 4. `/lib` - Utilities & Services

```
lib/
├── firebase/                   # Firebase configuration
│   ├── config.ts              # Firebase initialization
│   └── auth.ts                # Firebase auth helpers
│
├── services/                   # Business logic services
│   ├── activityService.ts     # User activity tracking
│   ├── adminService.ts        # Admin operations (CRUD)
│   ├── learningProgressService.ts  # Progress tracking
│   └── projectService.ts      # Project management
│
└── utils/                      # Utility functions
    ├── demoAuth.ts            # Demo authentication mode
    ├── gamification.ts        # XP, badges, levels logic
    ├── gemini.ts              # Google Gemini API integration
    └── projectReviewer.ts     # AI project review logic
```

**Service Layer:**
- **Firebase**: Database and authentication operations
- **Services**: Business logic abstraction
- **Utils**: Helper functions and integrations

---

### 5. `/types` - TypeScript Definitions

```
types/
└── index.ts                   # Centralized type definitions
```

**Type Definitions Include:**
- `User`, `Course`, `Module`, `Lesson`
- `Project`, `Comment`, `AIReview`
- `Quiz`, `Question`
- `Certificate`, `VideoNote`
- `PracticeTest`, `ApiKey`
- `Theme`

---

### 6. `/public` - Static Assets

```
public/
├── axen-logo.png              # Brand logo
├── grid.svg                   # Background pattern
├── manifest.json              # PWA manifest
└── sw.js                      # Service worker script
```

---

### 7. Configuration Files

```
Root Configuration:
├── package.json               # Dependencies & npm scripts
├── tsconfig.json              # TypeScript compiler config
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS theme & config
├── postcss.config.js          # PostCSS configuration
└── next-env.d.ts              # Next.js TypeScript declarations
```

**Key Configurations:**
- **TypeScript**: Strict mode, path aliases (`@/*`)
- **Next.js**: Image domains, cache headers, output tracing
- **Tailwind**: Custom theme with orange accents, dark mode support

---

### 8. Documentation Files

```
Documentation:
├── README.md                  # Main project documentation
├── SETUP.md                   # Setup instructions
├── QUICK_START.md             # Quick start guide
├── QUICK_FIX.md               # Troubleshooting guide
├── FIREBASE_SETUP.md          # Firebase configuration guide
├── GEMINI_SETUP.md            # Gemini API setup
├── NO_FIREBASE_MODE.md        # Demo mode documentation
└── PROJECT_SUMMARY.md         # Project overview
```

---

## 🏗️ Architecture Patterns

### 1. **File-based Routing (Next.js App Router)**
- Routes are defined by directory structure
- Dynamic routes using `[param]` syntax
- Route groups and layouts

### 2. **Component Organization**
- Feature-based grouping
- Separation of concerns (layout, features, shared)
- Co-located components with routes where appropriate

### 3. **Service Layer Pattern**
- Business logic separated from components
- Firebase operations abstracted in services
- Utility functions for common operations

### 4. **Context API for State**
- Global state management via React Context
- Theme and authentication state
- Provider pattern in root layout

### 5. **Type Safety**
- Centralized TypeScript definitions
- Strict TypeScript configuration
- Type-safe Firebase operations

---

## 🔑 Key Dependencies

### Core Framework
- `next`: ^15.0.3 (React framework)
- `react`: ^18.3.1
- `react-dom`: ^18.3.1
- `typescript`: ^5.6.2

### UI & Styling
- `tailwindcss`: ^3.4.13
- `framer-motion`: ^11.5.4 (animations)
- `lucide-react`: ^0.441.0 (icons)
- `recharts`: ^2.12.7 (charts)

### Backend & Services
- `firebase`: ^10.13.2
- `axios`: ^1.7.7

### Utilities
- `date-fns`: ^4.1.0
- `jspdf`: ^3.0.3 (PDF generation)

---

## 📊 Application Features by Route

| Route | Feature | Component Location |
|-------|---------|-------------------|
| `/` | Landing Page | `app/page.tsx` |
| `/dashboard` | Main Dashboard | `app/dashboard/page.tsx` |
| `/learning` | Course Catalog | `app/learning/page.tsx` |
| `/learning/[courseId]/[moduleId]` | Module Content | `app/learning/[courseId]/[moduleId]/page.tsx` |
| `/projects` | Project Showcase | `app/projects/page.tsx` |
| `/simulator` | Code Simulator | `app/simulator/page.tsx` |
| `/mentor` | AI Mentor Chat | `app/mentor/page.tsx` |
| `/career` | Career Guidance | `app/career/page.tsx` |
| `/practice-tests` | Practice Tests | `app/practice-tests/page.tsx` |
| `/leaderboard` | Leaderboard | `app/leaderboard/page.tsx` |
| `/certificates` | Certificates | `app/certificates/page.tsx` |
| `/videos` | Video Learning | `app/videos/page.tsx` |
| `/resume-builder` | Resume Builder | `app/resume-builder/page.tsx` |
| `/api-integration` | API Settings | `app/api-integration/page.tsx` |
| `/admin` | Admin Panel | `app/admin/page.tsx` |
| `/auth/login` | Login | `app/auth/login/page.tsx` |
| `/auth/signup` | Signup | `app/auth/signup/page.tsx` |

---

## 🎯 Key Design Decisions

1. **Next.js App Router**: Modern file-based routing with server components
2. **TypeScript**: Full type safety across the application
3. **Firebase Backend**: Real-time database, authentication, and storage
4. **PWA Support**: Service worker, manifest, offline capabilities
5. **Theme System**: Dynamic theme switching with Context API
6. **Gamification**: XP, levels, badges, leaderboard system
7. **AI Integration**: Gemini API for project reviews and mentor chat
8. **Mobile-First**: Responsive design with mobile navigation

---

## 🔍 Missing or Potential Areas

1. **Testing**: No test files (`*.test.ts`, `*.spec.ts`) visible
2. **API Routes**: No `app/api/` directory (might use Firebase directly)
3. **Environment Variables**: No `.env.example` file in structure
4. **CI/CD**: No GitHub Actions or deployment configs visible
5. **Documentation**: Extensive markdown files, but could use JSDoc in code

---

## 📝 Summary

**Total Structure:**
- **~30+ Page Components** (routes)
- **~15+ Reusable Components**
- **2 Context Providers**
- **4 Service Modules**
- **4 Utility Modules**
- **10+ Type Definitions**

**Project Type**: Full-stack learning platform with AI features
**Complexity**: High (multiple features, real-time data, AI integration)
**Scalability**: Good (service layer, type safety, modular structure)

---

*Generated: Complete file structure analysis for AXEN AI Platform*

