# Sam Nghe Thay Cu (samnghethaycu.com)

> **Content-Driven E-commerce Platform**
> Nền tảng thương mại điện tử định hướng nội dung, tập trung vào sự minh bạch và tri thức bản địa trong lĩnh vực thực phẩm hữu cơ và y học cổ truyền.

## 🎯 Tầm nhìn (Vision)

Sam Nghe Thay Cu không chỉ là một website bán hàng. Đây là nền tảng kết hợp thương mại điện tử với nội dung giáo dục chất lượng cao, giúp khách hàng hiểu rõ nguồn gốc, giá trị và cách sử dụng sản phẩm một cách khoa học.

**Điểm khác biệt:**
- **Minh bạch tuyệt đối**: Truy xuất nguồn gốc từng sản phẩm
- **Tri thức bản địa**: Nội dung blog chuyên sâu về y học cổ truyền và thực phẩm hữu cơ
- **Công nghệ hiện đại**: Medusa v2 + Next.js 15, đảm bảo hiệu năng và trải nghiệm người dùng vượt trội
- **Reference Style**: Lấy cảm hứng từ Noomfood.com nhưng vượt trội về mặt kỹ thuật và UX

---

## 🏗️ Kiến trúc (Architecture)

### Monorepo Structure

```
samnghethaycu/
├── backend/              # Medusa v2 Server (Port 9000)
│   ├── src/
│   │   ├── modules/      # Custom modules (Blog, Traceability)
│   │   ├── workflows/    # Business workflows
│   │   ├── api/          # API routes & endpoints
│   │   ├── subscribers/  # Event subscribers
│   │   └── scripts/      # Utility scripts
│   ├── medusa-config.ts  # Medusa v2 configuration
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── storefront/           # Next.js 15 App (Port 3000)
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   ├── components/   # React components
│   │   │   └── ui/       # Shadcn/UI components
│   │   └── lib/          # Utilities (cn, etc.)
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── components.json   # Shadcn/UI config
│   └── Dockerfile
├── docker-compose.yml    # Full stack orchestration
└── README.md            # Project documentation (YOU ARE HERE)
```

---

## 🛠️ Tech Stack

### Backend (Engine)
- **Core**: MedusaJS v2.0+ *(Strictly v2 - NO v1 legacy code)*
- **Database**: PostgreSQL 16
- **Cache & Events**: Redis 7
- **Language**: TypeScript 5.x
- **Architecture**: Module-first (prepared for custom modules)

### Storefront (Frontend)
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 3.4+
- **Component Library**: Shadcn/UI (New York style)
- **Icons**: Lucide React
- **Typography**:
  - **Headings**: Playfair Display (serif, elegant)
  - **Body**: Inter (sans-serif, highly readable)
- **State Management**: TBD (React Context / Zustand)
- **API Client**: Medusa JS SDK v2

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Docker Compose v3.8
- **Development**: Hot reload for both frontend & backend

---

## 🚀 Development Guide

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm or yarn

### Quick Start (Recommended)

#### 1. Clone & Setup Environment

```bash
# Copy environment templates
cp backend/.env.template backend/.env
cp storefront/.env.template storefront/.env
```

#### 2. Start Full Stack with Docker

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

**Services will be available at:**
- 🛍️ **Storefront**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:9000
- 👨‍💼 **Admin Panel**: http://localhost:7001
- 🗄️ **PostgreSQL**: localhost:5432 (user: `medusa`, pass: `medusa`)
- 🔴 **Redis**: localhost:6379

#### 3. Initialize Database (First time only)

```bash
# Run migrations
docker-compose exec backend npm run migration:run

# Optional: Seed demo data
docker-compose exec backend npm run seed
```

#### 4. Create Admin User

```bash
docker-compose exec backend npx medusa user -e admin@samnghethaycu.com -p supersecret
```

---

### Local Development (Without Docker)

If you prefer running services locally:

#### Backend

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.template .env
# Edit .env and change DATABASE_URL and REDIS_URL to point to local services

# Run migrations
npm run migration:run

# Start development server
npm run dev
```

#### Storefront

```bash
cd storefront

# Install dependencies
npm install

# Setup environment
cp .env.template .env

# Start development server
npm run dev
```

---

## 📋 Roadmap

### ✅ Phase 1: Infrastructure (Current)

**Status**: ✅ **COMPLETED**

**Deliverables:**
- [x] Monorepo structure with backend & storefront
- [x] Medusa v2 backend setup with PostgreSQL & Redis
- [x] Next.js 15 storefront with Tailwind CSS
- [x] Shadcn/UI integration (cn utility, theme variables)
- [x] Custom fonts (Playfair Display + Inter)
- [x] Docker Compose orchestration
- [x] Development environment ready
- [x] Documentation (README as Context Memory)

**What's Working:**
- Backend and Frontend can communicate via Docker network
- Hot reload enabled for rapid development
- Type-safe environment with full TypeScript support
- Module-first architecture ready for custom modules

---

### 🔄 Phase 2: Custom Blog Module (Next)

**Goal**: Xây dựng hệ thống blog native với Medusa v2 để quản lý nội dung giáo dục.

**Technical Approach:**
- Custom Medusa v2 Module (NOT a plugin, but native module)
- TipTap Editor for rich content editing
- SEO optimization (meta tags, structured data)
- Category & Tag system
- Author management
- Featured images & media library

**Admin Extensions:**
- Custom UI routes for blog management
- Widgets for quick stats
- Rich text editor integration

**Storefront Integration:**
- Blog listing & detail pages
- Category/tag filtering
- Search functionality
- Related products integration

---

### 🚧 Phase 3: Traceability Feature

**Goal**: Hệ thống truy xuất nguồn gốc sản phẩm (Supply Chain Transparency).

**Features:**
- QR code generation per product batch
- Farm/supplier information
- Harvest & processing timeline
- Certification documents (organic, quality)
- Geographic origin mapping
- Blockchain integration (optional, if needed for verification)

**Technical Implementation:**
- Custom Medusa Module: "Traceability"
- Data models: Batch, Supplier, Farm, Certificate
- Workflows: Batch creation, QA checks
- Public API for QR code scanning
- Admin dashboard for supplier management

---

### 🎨 Phase 4: UX Refinement & Content

- Advanced product filtering (by health benefit, origin, etc.)
- Personalized recommendations
- Loyalty program integration
- Multi-language support (Vietnamese + English)
- Content-first homepage with featured articles
- Customer reviews & testimonials

---

### 🔐 Phase 5: Production Deployment

- Environment hardening (secrets management)
- CI/CD pipeline (GitHub Actions)
- Performance optimization (CDN, caching strategies)
- Monitoring & logging (Sentry, Datadog)
- Backup & disaster recovery
- Load testing & scaling strategy

---

## 🧩 Key Technical Decisions

### Why Medusa v2?

- **Modular Architecture**: Perfect for custom modules (Blog, Traceability)
- **Composable Commerce**: Flexibility to build exactly what we need
- **Developer Experience**: TypeScript-first, modern tooling
- **Open Source**: No vendor lock-in, full control
- **Future-proof**: Active development, growing ecosystem

### Why Next.js 15?

- **App Router**: Modern routing with server components
- **Performance**: Image optimization, automatic code splitting
- **SEO-friendly**: Server-side rendering, metadata API
- **Developer Experience**: Hot reload, TypeScript support
- **Deployment**: Easy deployment to Vercel or any platform

### Why Shadcn/UI?

- **Not a dependency**: Copy-paste components, full ownership
- **Tailwind-based**: Consistent with our styling approach
- **Accessible**: Built with Radix UI primitives
- **Customizable**: Easy to adapt to brand design
- **Type-safe**: Full TypeScript support

---

## 🤝 Development Principles

1. **Type Safety First**: Every file must be TypeScript
2. **Module-First**: Backend features as Medusa modules
3. **Clean Code**: No premature optimization, readable over clever
4. **NO V1 Legacy**: Strictly Medusa v2 patterns only
5. **Documentation**: Code should be self-documenting, comments for "why" not "what"
6. **Testing**: TBD (will add Jest + Playwright in Phase 2)

---

## 📚 Resources

### Medusa v2 Documentation
- [Official Docs](https://docs.medusajs.com/v2)
- [Module Development](https://docs.medusajs.com/v2/modules)
- [Workflows](https://docs.medusajs.com/v2/workflows)
- [Admin Extensions](https://docs.medusajs.com/v2/admin/extensions)

### Next.js 15
- [Documentation](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)

### UI/UX
- [Shadcn/UI Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)

---

## 📝 Notes

### Environment Variables

**Backend** (`backend/.env`):
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Change in production!
- `COOKIE_SECRET`: Change in production!

**Storefront** (`storefront/.env`):
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL`: Backend API URL
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`: Get from Medusa Admin after setup

### Adding Shadcn/UI Components

```bash
cd storefront
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
# etc.
```

### Useful Commands

```bash
# View logs
docker-compose logs -f

# Restart a service
docker-compose restart backend

# Stop all services
docker-compose down

# Stop and remove volumes (CAUTION: deletes data)
docker-compose down -v

# Access backend shell
docker-compose exec backend sh

# Access database
docker-compose exec postgres psql -U medusa -d medusa_db
```

---

## 🐛 Troubleshooting

### Backend won't start
- Check if PostgreSQL and Redis are healthy: `docker-compose ps`
- Check logs: `docker-compose logs backend`
- Ensure migrations are run: `docker-compose exec backend npm run migration:run`

### Storefront can't connect to backend
- Verify `NEXT_PUBLIC_MEDUSA_BACKEND_URL` in `storefront/.env`
- Check if backend is running: `curl http://localhost:9000/health`
- Check Docker network connectivity

### Hot reload not working
- Ensure volumes are mounted correctly in `docker-compose.yml`
- Try restarting the service: `docker-compose restart storefront`

---

## 📞 Contact & Support

**Project Lead**: Senior Solutions Architect & Lead Developer
**Domain**: samnghethaycu.com
**Tech Stack**: Medusa v2 + Next.js 15
**Architecture**: Monorepo, Module-First, Content-Driven Commerce

---

**Last Updated**: 2026-01-18
**Version**: 0.1.0 (Infrastructure Phase)
**Status**: Phase 1 Complete ✅ | Ready for Phase 2 (Blog Module) 🚀
