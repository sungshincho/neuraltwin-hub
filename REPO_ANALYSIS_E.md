# NEURALTWIN-HUB Repository Analysis

> Generated: 2026-02-23

---

## Section 1: Project Structure

### 1.1 Directory Tree (3 Levels Deep)

```
neuraltwin-hub/
├── .env
├── .github/
│   ├── CODEOWNERS
│   └── pull_request_template.md
├── .gitignore
├── CLAUDE.md
├── IMPLEMENTATION_PLAN.md
├── PLAN.md
├── README.md
├── bun.lockb
├── components.json
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
│
├── docs/
│   ├── CHATBOT_IMPLEMENTATION.md
│   ├── NEURALTWIN_ADMIN_DASHBOARD_SPECIFICATION.md
│   ├── NEURALTWIN_BACKEND_SPECIFICATION.md
│   ├── NEURALTWIN_CUSTOMER_DASHBOARD_SPECIFICATION.md
│   ├── NEURALTWIN_GIT_COLLABORATION_GUIDE.md
│   ├── NEURALTWIN_WEBSITE_SPECIFICATION.md
│   ├── PATHFINDING_GUIDE.md
│   ├── WEBSITE_DATABASE_MAPPING.md
│   ├── analytics-comparison-2026-02-02-to-04.md
│   ├── instagram-ad-performance-analysis-2026-02.md
│   ├── integrated-development-plan.md
│   ├── retailKnowledge.ts          # Retail domain knowledge reference
│   ├── sample-data-script.sql
│   ├── systemPrompt.ts             # System prompt reference
│   ├── topicRouter.ts              # Topic router reference
│   └── website-specification.md
│
├── public/
│   ├── NEURALTWIN_logo_white.png
│   ├── favicon.png
│   ├── placeholder.svg
│   ├── robots.txt
│   ├── images/
│   │   ├── metallic-background.png
│   │   ├── neuraltwin-logo.png
│   │   ├── services/
│   │   └── white-noise-texture.png
│   ├── models/                     # 3D GLB models (40 files)
│   │   ├── store-kolon.glb
│   │   ├── furniture_product_layout.csv
│   │   ├── CheckoutCounter_*.glb
│   │   ├── DisplayTable_*.glb
│   │   ├── Mannequin_*.glb
│   │   ├── Product_*.glb
│   │   ├── Rack_*.glb
│   │   └── Shelf_*.glb
│   └── presets/                    # Preset thumbnails (8 files)
│       ├── preset-{1..4}.png
│       └── preset-{1..4}.svg
│
├── src/
│   ├── App.css
│   ├── App.tsx                     # Root component + Router
│   ├── main.tsx                    # Application entry point
│   ├── index.css
│   ├── vite-env.d.ts
│   ├── assets/                     # Static images (16 files)
│   ├── components/
│   │   ├── CTA.tsx
│   │   ├── Features.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── LanguageToggle.tsx
│   │   ├── NavLink.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── UseCases.tsx
│   │   ├── chatbot/
│   │   │   └── visualizer/        # 3D Store Visualizer (8 files)
│   │   ├── features/              # Feature components (14 files)
│   │   ├── layout/                # Header.tsx, Footer.tsx
│   │   └── ui/                    # shadcn/ui components (48 files)
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   └── useAuth.ts
│   ├── i18n/
│   │   ├── config.ts
│   │   └── locales/
│   │       ├── en.ts
│   │       └── ko.ts
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   ├── lib/
│   │   ├── analytics.ts
│   │   ├── layoutUtils.ts
│   │   ├── pathfinding.ts
│   │   ├── permissions.ts
│   │   └── utils.ts
│   ├── pages/                      # 13 page components
│   │   ├── About.tsx
│   │   ├── Auth.tsx
│   │   ├── Chat.tsx
│   │   ├── Contact.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Index.tsx
│   │   ├── NotFound.tsx
│   │   ├── Pricing.tsx
│   │   ├── Privacy.tsx
│   │   ├── Product.tsx
│   │   ├── Profile.tsx
│   │   ├── Subscribe.tsx
│   │   └── Terms.tsx
│   ├── shared/
│   │   └── chat/                   # Shared Chat UI Kit
│   │       ├── index.ts
│   │       ├── components/         # 7 components
│   │       ├── hooks/              # 2 hooks
│   │       ├── types/              # chat.types.ts
│   │       └── utils/              # 2 utils
│   ├── styles/                     # Page-specific CSS (5 files)
│   │   ├── about.css
│   │   ├── auth.css
│   │   ├── chat.css
│   │   ├── contact.css
│   │   └── legal.css
│   └── types/
│       └── auth.ts
│
└── supabase/
    ├── config.toml
    ├── functions/
    │   ├── _shared/                # Shared Edge Function utilities
    │   │   ├── chatLogger.ts
    │   │   ├── chatTypes.ts
    │   │   ├── errorHandler.ts
    │   │   ├── rateLimiter.ts
    │   │   └── streamingResponse.ts
    │   ├── retail-chatbot/         # Website Chatbot Edge Function
    │   │   ├── index.ts
    │   │   ├── deno.json
    │   │   ├── systemPrompt.ts
    │   │   ├── retailKnowledge.ts
    │   │   ├── topicRouter.ts
    │   │   ├── contextAssembler.ts
    │   │   ├── jinaReader.ts
    │   │   ├── painPointExtractor.ts
    │   │   ├── queryRouter.ts
    │   │   ├── questionDepthAnalyzer.ts
    │   │   ├── salesBridge.ts
    │   │   ├── suggestionGenerator.ts
    │   │   ├── vizDirectiveGenerator.ts
    │   │   ├── webSearch.ts
    │   │   ├── knowledge/          # Vector DB & embedding (6 files)
    │   │   ├── memory/             # Context memory (4 files)
    │   │   └── search/             # Multi-source search (6 files)
    │   ├── knowledge-admin/        # Knowledge management EF
    │   │   ├── index.ts
    │   │   └── knowledge/          # 6 files
    │   ├── submit-contact/         # Contact form EF
    │   │   └── index.ts
    │   ├── test-embedding/         # Embedding test EF
    │   │   └── index.ts
    │   └── upscale-image/          # Image upscale EF
    │       └── index.ts
    └── migrations/                 # 12 SQL migration files
        ├── 20251125*.sql (5 files)
        ├── 20251204*.sql (1 file)
        └── 20260*.sql (6 files)
```

### 1.2 App Router Pages (Full List)

| Route          | Page Component           | Description                    |
|----------------|--------------------------|--------------------------------|
| `/`            | `Chat.tsx`               | Default landing (Chat page)    |
| `/index`       | `Index.tsx`              | Website main landing page      |
| `/product`     | `Product.tsx`            | Product information             |
| `/chat`        | `Chat.tsx`               | AI Chat interface              |
| `/about`       | `About.tsx`              | Company information            |
| `/auth`        | `Auth.tsx`               | Authentication (Login/Signup)  |
| `/pricing`     | `Pricing.tsx`            | Pricing plans                  |
| `/contact`     | `Contact.tsx`            | Contact form                   |
| `/subscribe`   | `Subscribe.tsx`          | Subscription page              |
| `/dashboard`   | `Dashboard.tsx`          | User dashboard                 |
| `/profile`     | `Profile.tsx`            | User profile management        |
| `/privacy`     | `Privacy.tsx`            | Privacy policy                 |
| `/terms`       | `Terms.tsx`              | Terms of service               |
| `*`            | `NotFound.tsx`           | 404 fallback                   |

- Router: `react-router-dom` v6 (BrowserRouter + Routes)
- Entry point: `src/main.tsx` → `src/App.tsx`
- HTML entry: `index.html`

### 1.3 File & Code Statistics

| Category               | Files  | Lines of Code |
|------------------------|--------|---------------|
| TypeScript (.ts/.tsx)  | 175    | 51,838        |
| Markdown (.md)         | 17     | 10,633        |
| CSS (.css)             | 7      | 6,190         |
| SQL (.sql)             | 15     | 1,388         |
| JSON (configs)         | 6      | 186           |
| JavaScript (.js)       | 2      | 32            |
| HTML (.html)           | 1      | 29            |
| **Total (code/docs)**  | **223**| **~70,296**   |

| Non-code Assets       | Count  |
|------------------------|--------|
| 3D models (.glb)       | 40     |
| Images (.png)          | 31     |
| SVG (.svg)             | 5      |
| Other (.toml, .csv, etc.) | 7  |
| **Total files**        | **306**|

### 1.4 Frameworks & Key Libraries

| Category              | Library                         | Version       |
|-----------------------|---------------------------------|---------------|
| **Framework Core**    | React                           | ^18.3.1       |
|                       | React DOM                       | ^18.3.1       |
|                       | React Router DOM                | ^6.30.1       |
|                       | TypeScript                      | ^5.8.3        |
| **Build Tool**        | Vite                            | ^5.4.19       |
|                       | @vitejs/plugin-react-swc        | ^3.11.0       |
| **UI Framework**      | Tailwind CSS                    | ^3.4.17       |
|                       | shadcn/ui (Radix primitives)    | 25+ packages  |
|                       | Lucide React (icons)            | ^0.462.0      |
|                       | Framer Motion                   | ^12.31.1      |
| **3D Engine**         | Three.js                        | ^0.160.0      |
|                       | @react-three/fiber              | ^8.15.19      |
|                       | @react-three/drei               | ^9.99.0       |
| **State Management**  | TanStack React Query            | ^5.83.0       |
| **Backend**           | @supabase/supabase-js           | ^2.84.0       |
| **i18n**              | i18next                         | ^25.6.3       |
|                       | react-i18next                   | ^16.3.5       |
| **Charts**            | Recharts                        | ^2.15.4       |
| **Forms**             | React Hook Form                 | ^7.61.1       |
|                       | @hookform/resolvers             | ^3.10.0       |
|                       | Zod (validation)                | ^3.25.76      |
| **Document Export**   | jsPDF                           | ^4.1.0        |
|                       | docx                            | ^9.5.1        |
|                       | xlsx                            | ^0.18.5       |
|                       | file-saver                      | ^2.0.5        |
| **PDF Reading**       | pdfjs-dist                      | ^5.4.624      |
| **Document Parsing**  | mammoth (.docx reading)         | ^1.11.0       |
| **Markdown**          | react-markdown                  | ^10.1.0       |
| **UI Utilities**      | class-variance-authority        | ^0.7.1        |
|                       | clsx                            | ^2.1.1        |
|                       | tailwind-merge                  | ^2.6.0        |
|                       | tailwindcss-animate             | ^1.0.7        |
|                       | cmdk (command palette)          | ^1.1.1        |
|                       | embla-carousel-react            | ^8.6.0        |
|                       | input-otp                       | ^1.4.2        |
|                       | react-day-picker                | ^8.10.1       |
|                       | react-resizable-panels          | ^2.1.9        |
|                       | sonner (toasts)                 | ^1.7.4        |
|                       | vaul (drawer)                   | ^0.9.9        |
|                       | next-themes                     | ^0.3.0        |

### 1.5 Configuration Files

| File                  | Purpose                                         |
|-----------------------|-------------------------------------------------|
| `package.json`        | Project metadata, scripts, dependencies          |
| `package-lock.json`   | Dependency lock file (npm)                       |
| `bun.lockb`           | Dependency lock file (bun, binary)               |
| `tsconfig.json`       | Root TypeScript config (references app & node)   |
| `tsconfig.app.json`   | TypeScript config for app source code            |
| `tsconfig.node.json`  | TypeScript config for node/build tooling         |
| `vite.config.ts`      | Vite build configuration                         |
| `tailwind.config.ts`  | Tailwind CSS theme & plugin configuration        |
| `postcss.config.js`   | PostCSS plugins (Tailwind + Autoprefixer)        |
| `eslint.config.js`    | ESLint flat config                               |
| `components.json`     | shadcn/ui component configuration                |
| `index.html`          | HTML entry point (Vite SPA)                      |
| `.env`                | Environment variables                            |
| `.gitignore`          | Git ignore rules                                 |
| `supabase/config.toml`| Supabase local development config                |
| `.github/CODEOWNERS`  | GitHub code ownership rules                      |
| `.github/pull_request_template.md` | PR template                       |

---

## Section 2: Dependency Map

### Framework Core

| Package                  | Version     | Notes                           |
|--------------------------|-------------|----------------------------------|
| react                    | ^18.3.1     |                                  |
| react-dom                | ^18.3.1     |                                  |
| react-router-dom         | ^6.30.1     | Client-side routing              |
| typescript               | ^5.8.3      | devDependency                    |
| vite                     | ^5.4.19     | devDependency, build tool        |
| @vitejs/plugin-react-swc | ^3.11.0    | devDependency, SWC compiler      |

### UI Components (shadcn/ui + Radix)

| Package                          | Version     |
|----------------------------------|-------------|
| @radix-ui/react-accordion        | ^1.2.11     |
| @radix-ui/react-alert-dialog     | ^1.1.14     |
| @radix-ui/react-aspect-ratio     | ^1.1.7      |
| @radix-ui/react-avatar           | ^1.1.10     |
| @radix-ui/react-checkbox         | ^1.3.2      |
| @radix-ui/react-collapsible      | ^1.1.11     |
| @radix-ui/react-context-menu     | ^2.2.15     |
| @radix-ui/react-dialog           | ^1.1.14     |
| @radix-ui/react-dropdown-menu    | ^2.1.15     |
| @radix-ui/react-hover-card       | ^1.1.14     |
| @radix-ui/react-label            | ^2.1.7      |
| @radix-ui/react-menubar          | ^1.1.15     |
| @radix-ui/react-navigation-menu  | ^1.2.13     |
| @radix-ui/react-popover          | ^1.1.14     |
| @radix-ui/react-progress         | ^1.1.7      |
| @radix-ui/react-radio-group      | ^1.3.7      |
| @radix-ui/react-scroll-area      | ^1.2.9      |
| @radix-ui/react-select           | ^2.2.5      |
| @radix-ui/react-separator        | ^1.1.7      |
| @radix-ui/react-slider           | ^1.3.5      |
| @radix-ui/react-slot             | ^1.2.3      |
| @radix-ui/react-switch           | ^1.2.5      |
| @radix-ui/react-tabs             | ^1.1.12     |
| @radix-ui/react-toast            | ^1.2.14     |
| @radix-ui/react-toggle           | ^1.1.9      |
| @radix-ui/react-toggle-group     | ^1.1.10     |
| @radix-ui/react-tooltip          | ^1.2.7      |
| lucide-react                     | ^0.462.0    |
| class-variance-authority          | ^0.7.1      |
| clsx                             | ^2.1.1      |
| tailwind-merge                   | ^2.6.0      |
| tailwindcss-animate              | ^1.0.7      |
| cmdk                             | ^1.1.1      |
| embla-carousel-react             | ^8.6.0      |
| input-otp                        | ^1.4.2      |
| react-day-picker                 | ^8.10.1     |
| react-resizable-panels           | ^2.1.9      |
| sonner                           | ^1.7.4      |
| vaul                             | ^0.9.9      |
| next-themes                      | ^0.3.0      |

### State Management & Data Fetching

| Package               | Version     | Notes                          |
|------------------------|-------------|--------------------------------|
| @tanstack/react-query  | ^5.83.0     | Server state management        |
| @supabase/supabase-js  | ^2.84.0     | Supabase client SDK            |

### 3D Engine

| Package                | Version     | Notes                          |
|------------------------|-------------|--------------------------------|
| three                  | ^0.160.0    | 3D rendering engine            |
| @react-three/fiber     | ^8.15.19    | React renderer for Three.js    |
| @react-three/drei      | ^9.99.0     | Useful helpers for R3F         |

### Animation

| Package               | Version     |
|------------------------|-------------|
| framer-motion          | ^12.31.1    |

### Internationalization

| Package               | Version     |
|------------------------|-------------|
| i18next                | ^25.6.3     |
| react-i18next          | ^16.3.5     |

### Forms & Validation

| Package               | Version     |
|------------------------|-------------|
| react-hook-form        | ^7.61.1     |
| @hookform/resolvers    | ^3.10.0     |
| zod                    | ^3.25.76    |

### Charts & Data Visualization

| Package               | Version     |
|------------------------|-------------|
| recharts               | ^2.15.4     |

### Document Generation / Parsing

| Package               | Version     | Notes                          |
|------------------------|-------------|--------------------------------|
| jspdf                  | ^4.1.0      | PDF generation                 |
| pdfjs-dist             | ^5.4.624    | PDF reading                    |
| docx                   | ^9.5.1      | DOCX generation                |
| mammoth                | ^1.11.0     | DOCX reading / conversion      |
| xlsx                   | ^0.18.5     | Excel read/write               |
| file-saver             | ^2.0.5      | Client-side file downloads     |

### Markdown

| Package               | Version     |
|------------------------|-------------|
| react-markdown         | ^10.1.0     |

### Utilities

| Package               | Version     | Notes                          |
|------------------------|-------------|--------------------------------|
| date-fns               | ^3.6.0      | Date manipulation              |

### Development Tools (devDependencies)

| Package                       | Version     | Notes                     |
|-------------------------------|-------------|---------------------------|
| eslint                        | ^9.32.0     | Linting                   |
| @eslint/js                    | ^9.32.0     | ESLint JS rules           |
| eslint-plugin-react-hooks     | ^5.2.0      | React hooks lint rules    |
| eslint-plugin-react-refresh   | ^0.4.20     | Fast refresh lint rules   |
| typescript-eslint              | ^8.38.0     | TS-specific ESLint rules  |
| globals                       | ^15.15.0    | Global variable defs      |
| @tailwindcss/typography       | ^0.5.16     | Tailwind prose plugin     |
| autoprefixer                  | ^10.4.21    | CSS vendor prefixes       |
| postcss                       | ^8.5.6      | CSS processing            |
| tailwindcss                   | ^3.4.17     | Utility-first CSS         |
| lovable-tagger                | ^1.1.11     | Lovable platform tagger   |
| @types/file-saver             | ^2.0.7      | Type definitions          |
| @types/node                   | ^22.16.5    | Type definitions          |
| @types/react                  | ^18.3.23    | Type definitions          |
| @types/react-dom              | ^18.3.7     | Type definitions          |

### Version Conflict Risks

| Risk Area                | Details                                                     |
|--------------------------|-------------------------------------------------------------|
| `next-themes` ^0.3.0    | Designed for Next.js, used in Vite project. May cause SSR-related warnings. Functionality works but is an unusual pairing. |
| Dual lock files          | Both `package-lock.json` (npm) and `bun.lockb` (bun) exist. Using different package managers can cause version drift. Recommend standardizing on one. |
| `three` ^0.160.0        | Pinned to older version. `@react-three/fiber` ^8.15.19 and `@react-three/drei` ^9.99.0 may expect a newer Three.js version. Check compatibility if upgrading. |
| `react-day-picker` ^8.x | shadcn/ui newer versions use `react-day-picker` v9. Current v8 is compatible but may diverge from latest shadcn/ui updates. |

---

## Section 3: Environment Variables

### Frontend (Vite / `import.meta.env`)

| Variable                        | Used In                                | Purpose                                                                           | Status           |
|---------------------------------|----------------------------------------|-----------------------------------------------------------------------------------|------------------|
| `VITE_SUPABASE_URL`             | `.env`, `src/pages/Chat.tsx`           | Supabase project URL; used to construct Edge Function endpoints in frontend       | Active           |
| `VITE_SUPABASE_PROJECT_ID`      | `.env`                                 | Supabase project identifier                                                       | Defined, unused in code |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env`                                 | Supabase anonymous/public key for client auth                                     | Defined, unused in code |
| `VITE_USE_MOCK_CHATBOT`         | Documentation only                     | Dev toggle: `'true'` uses mock chatbot, `'false'` uses real API                   | Development only |

> **Note:** The Supabase client (`src/integrations/supabase/client.ts`) has `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` **hardcoded** as constants rather than reading from `import.meta.env`. This means `VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env` are currently only used by `Chat.tsx` (for Edge Function URL construction) and not by the Supabase client itself.

### Backend (Deno Edge Functions / `Deno.env.get()`)

| Variable                   | Used In                                                       | Purpose                                                                 | Criticality |
|----------------------------|---------------------------------------------------------------|-------------------------------------------------------------------------|-------------|
| `LOVABLE_API_KEY`          | `retail-chatbot/index.ts`, `test-embedding/index.ts`, `upscale-image/index.ts` | Auth token for Lovable API Gateway (Gemini 2.5 Pro/Flash calls)        | **Critical** |
| `SUPABASE_URL`             | `retail-chatbot/index.ts`, `submit-contact/index.ts`, `upscale-image/index.ts`, `knowledge-admin/index.ts` | Supabase project URL for server-side DB operations                      | **Critical** |
| `SUPABASE_SERVICE_ROLE_KEY`| `retail-chatbot/index.ts`, `submit-contact/index.ts`, `knowledge-admin/index.ts` | Service role key for privileged DB access (bypasses RLS)                | **Critical** |
| `SUPABASE_ANON_KEY`        | `retail-chatbot/index.ts`, `upscale-image/index.ts`          | Anonymous key for JWT token validation and client-level operations       | Required    |
| `SERPER_API_KEY`           | `retail-chatbot/webSearch.ts`                                 | API key for Serper (Google Search API) for web/news search              | Required (for search feature) |
| `GOOGLE_AI_API_KEY`        | `retail-chatbot/knowledge/embeddings.ts`, `knowledge-admin/knowledge/embeddings.ts` | Google AI API key for text embedding generation (vector search)         | Required (for knowledge base) |

### Summary

- **Total unique variables:** 10
- **Frontend (Vite):** 4 (1 actively used, 2 defined but unused, 1 dev-only)
- **Backend (Deno):** 6 (3 critical, 3 required for specific features)
- **No `process.env` references** found in the codebase (not a Node.js backend)
- **No `ANTHROPIC_API_KEY`** used anywhere (all AI calls go through `LOVABLE_API_KEY` via Lovable Gateway)
