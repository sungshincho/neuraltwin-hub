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

---

## Section 4: Component Inventory

### 4.1 Marketing / Landing Page Components

| Component | File Path | Description |
|-----------|-----------|-------------|
| Hero | `src/components/Hero.tsx` | NEURALTWIN 서비스 가치를 강조하는 랜딩 페이지 히어로 섹션 (애니메이션 그라디언트 + CTA) |
| Features | `src/components/Features.tsx` | 신경망 아키텍처, 실시간 처리, 보안 등 6가지 주요 기능 카드 전시 |
| UseCases | `src/components/UseCases.tsx` | 제조, 헬스케어, 항공우주, 스마트시티 등 4가지 산업별 사용 사례 전시 |
| CTA | `src/components/CTA.tsx` | 디지털 트윈 구축을 유도하는 콜투액션 섹션 (Free Trial + Demo 신청) |
| Footer | `src/components/Footer.tsx` | 제품, 회사, 리소스, 법적 고지 메뉴와 소셜 링크가 담긴 전체 푸터 |

### 4.2 AI Assistant (Chatbot) UI Components

#### Chat Page (메인 채팅 인터페이스)

| Component | File Path | Description |
|-----------|-----------|-------------|
| Chat | `src/pages/Chat.tsx` | AI 리테일 어시스턴트 메인 페이지 (2,250 LOC, 인라인 + 풀스크린 듀얼 모드) |

#### Shared Chat UI Kit (`src/shared/chat/`)

| Component | File Path | Description |
|-----------|-----------|-------------|
| ChatBubble | `src/shared/chat/components/ChatBubble.tsx` | 메시지 버블 (사용자/AI 구분, 마크다운 렌더링, variant 지원) |
| ChatInput | `src/shared/chat/components/ChatInput.tsx` | 메시지 입력 창 (Enter 전송, Shift+Enter 줄바꿈, 자동 높이 조절) |
| ChatScrollArea | `src/shared/chat/components/ChatScrollArea.tsx` | 자동 스크롤 채팅 영역 (바닥 감지, 새 메시지 시 자동 스크롤) |
| FeedbackButtons | `src/shared/chat/components/FeedbackButtons.tsx` | 메시지 유용성 평가 버튼 (좋아요/싫어요) |
| SuggestionChips | `src/shared/chat/components/SuggestionChips.tsx` | 후속 질문 추천 칩 (최대 3개, 클릭 시 자동 전송) |
| TypingIndicator | `src/shared/chat/components/TypingIndicator.tsx` | AI 타이핑 중 인디케이터 (3점 바운스 애니메이션) |
| WelcomeMessage | `src/shared/chat/components/WelcomeMessage.tsx` | 초기 인사 메시지 (아이콘, 타이틀, 제안 칩 포함) |
| useChatSession | `src/shared/chat/hooks/useChatSession.ts` | 채팅 세션 관리 훅 (sessionId, conversationId 생성/저장) |
| useStreaming | `src/shared/chat/hooks/useStreaming.ts` | SSE 스트리밍 처리 훅 (fetch + ReadableStream, 토큰 단위 업데이트) |
| chat.types.ts | `src/shared/chat/types/chat.types.ts` | 웹사이트 + OS 챗봇 공용 UI 타입 정의 (ChatMessageUI, ChatVariant) |
| exportConversation | `src/shared/chat/utils/exportConversation.ts` | 대화 내보내기 유틸 (.md / .pdf / .docx 포맷) |
| fileUpload | `src/shared/chat/utils/fileUpload.ts` | 파일 업로드 유틸 (Supabase Storage + txt/pdf/docx/xlsx/이미지 텍스트 추출) |

#### 3D Store Visualizer (`src/components/chatbot/visualizer/`)

| Component | File Path | Description |
|-----------|-----------|-------------|
| StoreVisualizer | `src/components/chatbot/visualizer/StoreVisualizer.tsx` | Three.js 씬을 React 라이프사이클에 통합하는 메인 3D 비주얼라이저 |
| CompareVisualizer | `src/components/chatbot/visualizer/CompareVisualizer.tsx` | Before/After 레이아웃을 좌우 분할로 비교하는 컴포넌트 |
| KPIBar | `src/components/chatbot/visualizer/KPIBar.tsx` | 비주얼라이저 상단 KPI 카드 바 (Glassmorphism + 카운트업 애니메이션) |
| StageProgress | `src/components/chatbot/visualizer/StageProgress.tsx` | 고객 여정 단계 (진입→탐색→결제) 프로그레스 표시 |
| sceneBuilder | `src/components/chatbot/visualizer/sceneBuilder.ts` | Pure Three.js 씬 빌더 (React 독립, 파라메트릭 설정) |
| sceneDiff | `src/components/chatbot/visualizer/sceneDiff.ts` | 이전/새 VizDirective 비교 → 변경된 존만 업데이트하는 diff 엔진 |
| storeData | `src/components/chatbot/visualizer/storeData.ts` | 매장 구조, 존, 가구, 카메라 프리셋 상수 데이터 |
| vizDirectiveTypes | `src/components/chatbot/visualizer/vizDirectiveTypes.ts` | AI 응답의 3D 시각화 지시 타입 (VizState, VizKPI, VizAnnotation 등) |

### 4.3 Feature / Dashboard Visualization Components (`src/components/features/`)

| Component | File Path | Description |
|-----------|-----------|-------------|
| ConversionFunnel | `src/components/features/ConversionFunnel.tsx` | 방문→관심→체류→구매 단계별 전환율 분석 및 시간대별 매출 예측 |
| CustomerJourney | `src/components/features/CustomerJourney.tsx` | 고객의 실제 매장 동선을 시뮬레이션하고 구매 경로 분석 |
| DemandForecast | `src/components/features/DemandForecast.tsx` | 날씨, 이벤트, 요일 등을 고려한 판매량 및 전환율 예측 |
| FootfallVisualizer | `src/components/features/FootfallVisualizer.tsx` | 2D 그리드에서 시간대별 고객 유입, 재방문율, 평균 체류 시간 시각화 |
| FootfallVisualizer3D | `src/components/features/FootfallVisualizer3D.tsx` | 3D 매장 환경에서 고객 동선 애니메이션 및 주문 도달 추적 |
| HQStoreSync | `src/components/features/HQStoreSync.tsx` | 매장과 본사 간 메시지 송수신 및 요청 승인/거부 동기화 |
| InventoryOptimizer | `src/components/features/InventoryOptimizer.tsx` | 재고 상태(부족/경고/최적/초과) 분류 및 최적화 잠재력 계산 |
| LayoutSimulator | `src/components/features/LayoutSimulator.tsx` | 상품 배치 변경 시 전환율, 고객 동선, 평균 체류 시간 영향도 시뮬레이션 |
| LayoutSimulator3D | `src/components/features/LayoutSimulator3D.tsx` | 3D 가구 레이아웃 기반 상품 배치 시뮬레이션 및 KPI 프리셋 관리 |
| ProductPerformance | `src/components/features/ProductPerformance.tsx` | 카테고리별 제품 판매량, 매출, 재고, 트렌드 및 상태 모니터링 |
| StaffEfficiency | `src/components/features/StaffEfficiency.tsx` | 직원별 판매액, 고객응대, 성과도 비교 및 레이더 차트 분석 |
| Store3DViewer | `src/components/features/Store3DViewer.tsx` | Three.js 기반 3D 매장 뷰어 (가구 배치, 제품 위치, 고객 경로 시각화) |
| TrafficHeatmap | `src/components/features/TrafficHeatmap.tsx` | 2D 그리드 기반 시간대별 매장 내 고객 이동 밀도 히트맵 |
| TrafficHeatmap3D | `src/components/features/TrafficHeatmap3D.tsx` | 3D 매장 환경에서 존(Zone)별 고객 집중도를 열 기반 히트맵으로 표현 |

### 4.4 Common / Reusable (shadcn/ui) Components (`src/components/ui/`)

| Component | File Path |
|-----------|-----------|
| Accordion | `src/components/ui/accordion.tsx` |
| AlertDialog | `src/components/ui/alert-dialog.tsx` |
| Alert | `src/components/ui/alert.tsx` |
| AspectRatio | `src/components/ui/aspect-ratio.tsx` |
| Avatar | `src/components/ui/avatar.tsx` |
| Badge | `src/components/ui/badge.tsx` |
| Breadcrumb | `src/components/ui/breadcrumb.tsx` |
| Button | `src/components/ui/button.tsx` |
| Calendar | `src/components/ui/calendar.tsx` |
| Card | `src/components/ui/card.tsx` |
| Carousel | `src/components/ui/carousel.tsx` |
| Chart | `src/components/ui/chart.tsx` |
| Checkbox | `src/components/ui/checkbox.tsx` |
| Collapsible | `src/components/ui/collapsible.tsx` |
| Command | `src/components/ui/command.tsx` |
| ContextMenu | `src/components/ui/context-menu.tsx` |
| Dialog | `src/components/ui/dialog.tsx` |
| Drawer | `src/components/ui/drawer.tsx` |
| DropdownMenu | `src/components/ui/dropdown-menu.tsx` |
| Form | `src/components/ui/form.tsx` |
| HoverCard | `src/components/ui/hover-card.tsx` |
| InputOTP | `src/components/ui/input-otp.tsx` |
| Input | `src/components/ui/input.tsx` |
| Label | `src/components/ui/label.tsx` |
| Menubar | `src/components/ui/menubar.tsx` |
| NavigationMenu | `src/components/ui/navigation-menu.tsx` |
| Pagination | `src/components/ui/pagination.tsx` |
| Popover | `src/components/ui/popover.tsx` |
| Progress | `src/components/ui/progress.tsx` |
| RadioGroup | `src/components/ui/radio-group.tsx` |
| Resizable | `src/components/ui/resizable.tsx` |
| ScrollArea | `src/components/ui/scroll-area.tsx` |
| Select | `src/components/ui/select.tsx` |
| Separator | `src/components/ui/separator.tsx` |
| Sheet | `src/components/ui/sheet.tsx` |
| Sidebar | `src/components/ui/sidebar.tsx` |
| Skeleton | `src/components/ui/skeleton.tsx` |
| Slider | `src/components/ui/slider.tsx` |
| Sonner | `src/components/ui/sonner.tsx` |
| Switch | `src/components/ui/switch.tsx` |
| Table | `src/components/ui/table.tsx` |
| Tabs | `src/components/ui/tabs.tsx` |
| Textarea | `src/components/ui/textarea.tsx` |
| Toast | `src/components/ui/toast.tsx` |
| Toaster | `src/components/ui/toaster.tsx` |
| ToggleGroup | `src/components/ui/toggle-group.tsx` |
| Toggle | `src/components/ui/toggle.tsx` |
| Tooltip | `src/components/ui/tooltip.tsx` |
| useToast | `src/components/ui/use-toast.ts` |

> Total: 48 components + 1 hook. Standard shadcn/ui library, Radix primitive 기반.

### 4.5 Layout Components

| Component | File Path | Description |
|-----------|-----------|-------------|
| Header | `src/components/layout/Header.tsx` | 앱 상단 네비게이션 (모바일 메뉴, 사용자 프로필 드롭다운, 로그아웃) |
| Footer (layout) | `src/components/layout/Footer.tsx` | 페이지 내 섹션 스크롤 이동을 처리하는 레이아웃 푸터 |

### 4.6 Utility / Navigation Components

| Component | File Path | Description |
|-----------|-----------|-------------|
| LanguageToggle | `src/components/LanguageToggle.tsx` | 한/영 언어 전환 버튼 (i18next 연동) |
| NavLink | `src/components/NavLink.tsx` | React Router NavLink 래퍼 (커스텀 className 유틸리티) |
| ProtectedRoute | `src/components/ProtectedRoute.tsx` | 인증 및 역할 기반 접근 제어 라우팅 보호 컴포넌트 |

### 4.7 Component Summary

| Category | Count |
|----------|-------|
| Marketing / Landing | 5 |
| AI Assistant (Chat Page) | 1 |
| Shared Chat UI Kit | 12 (7 components + 2 hooks + 1 type + 2 utils) |
| 3D Visualizer | 8 (4 components + 4 utilities) |
| Feature / Dashboard | 14 |
| shadcn/ui Common | 49 (48 components + 1 hook) |
| Layout | 2 |
| Utility / Navigation | 3 |
| **Total** | **94** |

---

## Section 5: AI Retail Assistant Implementation Details

### 5.1 Chat UI Architecture

```
src/pages/Chat.tsx (2,250 LOC — 메인 페이지, 모든 로직 포함)
 │
 ├─ Inline Mode (기본)
 │   ├─ Navigation Bar (로고, 메뉴, 언어 토글)
 │   ├─ Chat Container (좌측)
 │   │   ├─ Turn Limit Indicator (게스트 10턴 제한 표시)
 │   │   ├─ renderCollapsibleMessages()
 │   │   │   ├─ Collapsed older turns (접기/펼치기, 최근 3턴만 표시)
 │   │   │   └─ Visible recent turns
 │   │   │       ├─ User message bubble
 │   │   │       ├─ Assistant message bubble (마크다운 렌더링)
 │   │   │       ├─ Message actions (복사/좋아요/싫어요)
 │   │   │       └─ Search source badges (지식 N건, 웹 검색, 팩트 N건)
 │   │   ├─ Loading indicator (스트리밍 대기 시)
 │   │   ├─ SuggestionChips (후속 질문 추천)
 │   │   ├─ Lead Capture Form (이메일/회사/직함)
 │   │   └─ Input Area
 │   │       ├─ Pending files preview
 │   │       ├─ Textarea (Enter=전송, Shift+Enter=줄바꿈)
 │   │       └─ Buttons: 파일 업로드 | 내보내기 | 전송
 │   └─ Visualizer Container (우측)
 │       ├─ StoreVisualizer (3D 매장 뷰)
 │       ├─ CompareVisualizer (Before/After 비교)
 │       └─ Landing Presets (대화 시작 전 프리셋 썸네일)
 │
 └─ Fullscreen Mode (확장)
     ├─ Header (닫기, 새 대화, 내보내기, 풀스크린 토글)
     ├─ Mobile Tabs (채팅 | 3D 탭 전환)
     ├─ Body: Chat + Visualizer (좌우 분할)
     └─ Footer: Input Area
```

**Variant 시스템**: `src/shared/chat/` 컴포넌트들은 `variant` prop으로 `'website'`(터쿠아이즈 테마) / `'os'`(shadcn 테마) 모드를 지원하지만, 현재 `Chat.tsx`는 variant를 사용하지 않고 자체 UI를 직접 구현.

### 5.2 AI Backend Connection

```
Frontend (Chat.tsx)
    │
    │  POST fetch()
    │  URL: ${VITE_SUPABASE_URL}/functions/v1/retail-chatbot
    │  Headers: { Content-Type: application/json }
    │  Body: { message, sessionId, conversationId, history(last 20),
    │          attachments, stream, currentVizState }
    │
    ▼
Supabase Edge Function (retail-chatbot/index.ts)
    │
    │  [1] JWT Extraction + Rate Limit (30/min auth, 10/min anon)
    │  [2] Conversation Create/Retrieve (Supabase PostgreSQL)
    │  [3] Topic Classification (topicRouter.ts — keyword matching)
    │  [4] Pain Point Extraction (painPointExtractor.ts)
    │  [5] Vector Knowledge Search (knowledge/vectorStore.ts — pgvector)
    │  [6] Memory Load/Save (memory/contextMemoryStore.ts)
    │  [7] Web Search Decision (search/searchStrategyEngine.ts)
    │  [8] Context Assembly (contextAssembler.ts — 10K token budget)
    │
    │  POST fetch()
    │  URL: https://ai.gateway.lovable.dev/v1/chat/completions
    │  Headers: { Authorization: Bearer ${LOVABLE_API_KEY} }
    │  Body: { model: "google/gemini-2.5-pro", messages, temperature: 0.7,
    │          max_tokens: 8192, stream: true/false }
    │
    ▼
Lovable API Gateway → Gemini 2.5 Pro
    │
    ▼
SSE Stream (or JSON fallback) → Frontend
```

**Key Point**: AI API를 직접 호출하지 않음. 모든 AI 호출은 Lovable API Gateway (`ai.gateway.lovable.dev`)를 경유하여 Gemini 2.5 Pro 모델을 사용. `LOVABLE_API_KEY`로 인증.

### 5.3 Streaming Response Handling

**방식**: SSE (Server-Sent Events) via `fetch` + `ReadableStream`

```
[Desktop] stream: true → SSE (text/event-stream)
[Mobile]  stream: false → JSON (application/json) 단건 응답
```

**SSE Event Protocol**:

| Event Type | Data Format | Description |
|------------|-------------|-------------|
| `meta` | `{ suggestions, showLeadForm, knowledgeSourceCount, webSearchPerformed, searchSources, factCount }` | 사전 계산된 메타데이터 (스트리밍 시작 직후 전송) |
| `text` | `{ content: "..." }` | 토큰 단위 텍스트 청크 (누적 append) |
| `viz` | `{ vizState, zones, highlights, kpis, stage, camera }` | 3D 시각화 지시 (` ```viz ``` ` 블록에서 파싱) |
| `done` | `{ conversationId: "uuid" }` | 스트림 종료 신호 |
| `error` | `{ error: "..." }` | 서버 에러 |

**Frontend Processing** (`Chat.tsx` processStreamingResponse):
```typescript
// response.body → ReadableStream → TextDecoder
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  buffer += decoder.decode(value, { stream: true });

  // Split by \n\n (SSE delimiter)
  const events = buffer.split('\n\n');
  buffer = events.pop(); // Keep incomplete event

  for (const event of events) {
    // Parse "event: type\ndata: {...}"
    switch (eventType) {
      case 'text':  // Append to message content token-by-token
      case 'viz':   // Update 3D visualization state
      case 'meta':  // Set suggestions, lead form, search badges
      case 'done':  // Save conversationId, end loading
    }
  }
}
```

**VizDirective Streaming**: Edge Function이 Gemini 응답에서 ` ```viz { ... } ``` ` 블록을 실시간 감지하여 파싱 → `viz` 이벤트로 분리 전송. 잘린 JSON은 `repairTruncatedJson()`으로 복구.

### 5.4 Conversation History Storage

| Storage Layer | Data | Mechanism | Retention |
|---------------|------|-----------|-----------|
| **React State** | `messages[]` | `useState` in Chat.tsx | 페이지 세션 동안 |
| **localStorage** | `sessionId` | `neuraltwin_chat_session_id` key | 영구 (브라우저 클리어까지) |
| **Supabase DB** | Full conversation | `chat_conversations` + `chat_messages` tables | 영구 |
| **Supabase DB** | User profile + Insights | `chat_context_memory` table | 영구 |
| **Supabase DB** | Lead data | `chat_leads` table | 영구 |

**DB 저장 Flow**:
1. 사용자 메시지 도착 → Edge Function이 `chat_messages`에 INSERT (비동기)
2. AI 응답 완료 → `chat_messages`에 INSERT + `chat_context_memory` UPSERT (비동기)
3. 리드 수집 → `chat_leads`에 INSERT

**History 전송**: Frontend는 마지막 20개 메시지만 `{ role, content }` 형태로 Backend에 전송. Backend는 이를 Gemini messages 배열에 포함.

**Session Handover**: 비회원→회원 전환 시 `handover_chat_session` RPC로 기존 `session_id` 대화를 `user_id`에 연결.

### 5.5 Retail Domain Knowledge Injection

**3-Layer Knowledge Architecture**:

```
Layer 1: Static Knowledge (retailKnowledge.ts)
   │  12개 토픽별 도메인 지식 DB (baked-in)
   │  topicRouter.ts가 키워드 매칭으로 토픽 분류
   │  해당 토픽의 context 필드를 시스템 프롬프트에 주입
   │
Layer 2: Vector Knowledge (knowledge/vectorStore.ts)
   │  pgvector 기반 시멘틱 검색
   │  Google gemini-embedding-001 (768D) 임베딩
   │  유사도 0.65 이상 결과 최대 5개 반환
   │  Fallback: pgvector 실패 → pg_trgm 텍스트 검색 → 정적 지식
   │
Layer 3: Web Search (search/ folder)
   │  searchStrategyEngine이 검색 필요 여부 결정
   │  Serper API로 Google 웹/뉴스/SNS 검색
   │  crossVerifier로 교차 검증
   │  factSummarizer로 팩트 추출
   │  layoutHintExtractor로 공간 정보 추출
   │
   ▼
Context Assembly (contextAssembler.ts)
   Token Budget: 10,000 tokens
   Priority: System Prompt > Vector Knowledge > Memory > Web > Depth Instructions
```

**Topic Classification (topicRouter.ts)**:
- 12개 리테일 토픽: layout_flow, vmd_display, sales_conversion, inventory_supply, customer_analytics, staff_productivity, data_kpi, pricing_promotion, retail_tech, digital_twin, neuraltwin_solution, general_retail
- 영문/한글 키워드 매칭 (영문 2점, 한글 2점, 복합 패턴 +3점)
- 최근 2턴 히스토리 30% 가중치 반영
- Primary + Secondary 토픽 선정 (secondary는 primary의 50% 이상 스코어 시)

**System Prompt (systemPrompt.ts, ~3,500 tokens)**:
- 페르소나: "NEURAL" — 15년+ 리테일 운영/전략 컨설팅 전문가
- 내장 프레임워크: Decompression Zone, Right-Turn Bias, Layout Types (Grid/Racetrack/Free-Flow/Herringbone), Power Path, Golden Zone (VMD), 전환율 벤치마크, Dynamic Pricing
- 날짜/시즌/분기 자동 주입

**Knowledge Injection Flow**:
```
사용자 메시지 → topicRouter.classifyTopic()
  → primaryTopic + secondaryTopic + confidence
  → retailKnowledge.combineKnowledgeContexts([primary, secondary])
  → SYSTEM_PROMPT + TOPIC_CONTEXT + DATE_CONTEXT
  → [+ Vector Search Results]
  → [+ Web Search Results (conditional)]
  → contextAssembler.assemble() (token budget 관리)
  → Final System Prompt (~10K tokens)
```

### 5.6 Lead Capture Logic

**Lead Scoring System (salesBridge.ts)**:

| Signal | Points | Description |
|--------|--------|-------------|
| 턴 수 ≥ 3 | +20 | 기본 참여도 |
| 턴 수 ≥ 5 | +10 | 지속적 관심 |
| 턴 수 ≥ 7 | +10 | 높은 참여도 |
| Pain point 감지 | +25 | 핵심 동기 |
| Pain weight ≥ 2 | +10 | 심각한 문제 |
| Pain weight ≥ 3 | +5 | 크리티컬 이슈 |
| High-value 토픽 | +20 | 솔루션 관련성 |
| NEURALTWIN 토픽 | +15 | 직접 솔루션 관심 |
| 명시적 관심 표현 | +30 | "demo", "pricing", "구매" 등 |
| 토픽 반복 | +10 | 지속성 |

**Conversation Stage**:
```
Awareness  (score < 30)  → 일반 탐색
Interest   (30-50)       → 특정 토픽 집중
Consideration (50-70)    → Pain point + 솔루션 관심
Decision   (≥ 70)        → 구매/데모 의사 표현
```

**Lead Form Trigger Conditions**:
```
Decision stage             → 항상 표시
Consideration + pain point → 표시
Score ≥ 65                → 표시
High-value topic + 3+ 턴  → 표시
Otherwise                  → 표시하지 않음
```

**Collection Flow**:
1. Backend `salesBridge.ts`가 `showLeadForm: true`를 `meta` SSE 이벤트에 포함
2. Frontend가 Lead Capture Form 표시 (이메일, 회사, 직함)
3. 사용자 제출 → `retail-chatbot` Edge Function에 `action: "capture_lead"` POST
4. DB `chat_leads` 테이블에 저장 (conversationId, pain_points 포함)
5. `leadSubmitted` 플래그로 중복 표시 방지

**Pain Point Detection (painPointExtractor.ts)**:
- 7개 카테고리: cost_pressure(3), efficiency_gap(2), staffing_challenge(2), technology_barrier(2), data_insight_lack(2), compliance_risk(1), competition_threat(2)
- 부정적 표현 감지 (문제, 어렵, 고민 등) → confidence +0.2 부스트
- Lead score 계산에 pain weight 반영
