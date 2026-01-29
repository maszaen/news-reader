# 🗞️ Reapublix - Free RSS Reader

> **Rea** = read, **Publix** = public  
> Read news without ads. Built with love for everyone.

![Reapublix](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## ✨ Features

- 📰 **RSS/Feed Reading** - Aggregate news from multiple sources
- 🔓 **Optional Login** - Browse freely, sign in for premium features
- 🌓 **Dark/Light Mode** - Easy on the eyes, any time of day
- 🚫 **Ad-Free** - Clean reading experience
- 📊 **Analytics-Driven Ranking** - Popular articles rise to the top
- ❤️ **Like System** - Show appreciation for great articles
- 🔖 **Bookmark System** - Save articles for later
- 📱 **Responsive Design** - Works on all devices
- 🚀 **High Performance** - Redis caching & optimized queries

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│     MySQL       │
│   (Next.js)     │     │   (Express.js)  │     │   (Database)    │
│   Port: 3000    │     │   Port: 8000    │     │   Port: 3306    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       ▼                       │
        │               ┌─────────────────┐             │
        │               │     Redis       │             │
        │               │   (Caching)     │             │
        │               │   Port: 6379    │             │
        │               └─────────────────┘             │
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                         Docker Network
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14+** - React framework with App Router
- **Tailwind CSS** - Utility-first styling
- **TypeScript** - Type-safe development
- **Lucide React** - Beautiful icons

### Backend
- **Express.js** - Fast Node.js web framework
- **Prisma ORM** - Type-safe database access
- **JWT** - Secure authentication
- **Zod** - Runtime validation

### Infrastructure
- **MySQL 8.0** - Relational database
- **Redis** - Caching layer
- **Docker** - Containerization
- **Nginx** - Static file serving

## 🚀 Quick Start

### Prerequisites
- [Docker](https://www.docker.com/get-started) & Docker Compose
- [Node.js 20+](https://nodejs.org/) (for local development)

### 1. Clone & Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/reapublix.git
cd reapublix

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 2. Start with Docker (Recommended)

```bash
# Build and start all services
docker-compose up -d

# Wait for services to be ready, then seed the database
docker-compose exec backend npm run prisma:seed

# Check logs
docker-compose logs -f
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Health**: http://localhost:8000/health

### 3. Local Development (Without Docker)

#### Backend
```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with default feeds
npm run prisma:seed

# Start development server
npm run dev
```

#### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📖 API Documentation

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/feeds` | List all active feeds |
| GET | `/api/feeds/:id` | Get feed with articles |
| GET | `/api/articles` | List articles (paginated) |
| GET | `/api/articles/trending` | Get trending articles |
| GET | `/api/articles/:id` | Get article detail |
| POST | `/api/articles/:id/view` | Track article view |
| GET | `/api/categories` | List all categories |

### Protected Endpoints (Require Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/session` | Get current session |
| POST | `/api/articles/:id/like` | Like article |
| DELETE | `/api/articles/:id/like` | Unlike article |
| POST | `/api/articles/:id/bookmark` | Bookmark article |
| DELETE | `/api/articles/:id/bookmark` | Remove bookmark |
| GET | `/api/user/likes` | Get user's likes |
| GET | `/api/user/bookmarks` | Get user's bookmarks |

### Query Parameters

**GET /api/articles**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 50)
- `category` - Filter by category
- `feedId` - Filter by feed
- `sort` - Sort by: `popularity`, `recent`, `views`

## 📁 Project Structure

```
reapublix/
├── frontend/                 # Next.js Frontend
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   └── lib/             # Utilities & API client
│   ├── Dockerfile
│   └── package.json
│
├── backend/                  # Express.js Backend
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utilities
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Seed data
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml        # Docker orchestration
└── README.md
```

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```bash
DATABASE_URL="mysql://user:password@localhost:3306/reapublix"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="7d"
PORT=8000
CORS_ORIGIN="http://localhost:3000"
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

## 🔧 Development

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Database Management
```bash
# Create migration
cd backend && npm run prisma:migrate

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

### RSS Worker
The RSS worker runs automatically in Docker. For manual execution:
```bash
cd backend && npm run worker
```

## 📦 Deployment

### Docker Production Build
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Frontend Deployment Options
- **Vercel** - Zero-config deployment
- **Netlify** - Easy git integration
- **Cloudflare Pages** - Global CDN
- **AWS S3 + CloudFront** - Scalable & cheap

### Backend Deployment Options
- **Railway** - $5-10/month
- **Fly.io** - Free tier available
- **DigitalOcean App Platform** - $5/month
- **AWS ECS** - Production-grade

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [RSS Parser](https://github.com/rbren/rss-parser) - RSS feed parsing
- [Lucide](https://lucide.dev/) - Beautiful icons
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [Prisma](https://www.prisma.io/) - Database ORM

---

Made with ❤️ by the Reapublix Team
