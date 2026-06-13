# 🤖 CRM — AI-Native Mini CRM for Retail Brands

A production-ready, full-stack CRM platform powered by GPT / Gemini AI, built for retail brands to intelligently engage shoppers through segmented, personalized campaigns.

---

## ✦ Features at a Glance

| Feature | Description |
|---|---|
| 👥 Customer Management | Full CRUD, profile pages, city/spend filters |
| 🛒 Order Management | Add orders, auto-recalculate customer stats |
| 🎯 AI Segmentation | Natural language → SQL (e.g. "inactive high spenders") |
| 📢 Campaigns | Multi-channel (WhatsApp, SMS, Email, RCS), AI-drafted messages |
| 📡 Channel Service | Separate microservice on port 6000 simulates delivery with async callbacks |
| 📊 Analytics | Revenue charts, campaign funnels, CTR / delivery rate KPIs |
| ✦ AI Assistant | Chat panel: get segment + message + channel recommendations |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│              React 18 + Tailwind + Recharts                  │
│                      Port 3000                               │
└───────────────────────┬──────────────────────────────────────┘
                        │ HTTP / Axios
┌───────────────────────▼──────────────────────────────────────┐
│                    CRM BACKEND (MVC)                         │
│                  Node.js + Express.js                        │
│                      Port 5000                               │
│                                                              │
│  Routes → Controllers → Services → Models → MySQL           │
│                                                              │
│  POST /api/campaigns/:id/send  ──────────────────────────┐  │
│  POST /api/receipts  ◄──────────── callback ─────────┐   │  │
└──────────────────────────────────────────────────────────│──┘
         │ mysql2                                         │
┌────────▼──────────┐          ┌──────────────────────────┘
│     MySQL 8.0     │          │   CHANNEL SERVICE
│     Port 3306     │          │   Node.js + Express.js
│                   │          │   Port 6000
│  customers        │          │
│  orders           │          │  POST /api/send
│  segments         │          │  → simulate delivery
│  campaigns        │          │  → async callbacks with
│  campaign_recip.  │          │    status: sent/delivered/
│  comm_logs        │          │    failed/opened/read/
└───────────────────┘          │    clicked/converted
                               └──────────────────────────
         │ Gemini API
┌────────▼──────────┐
│    AI Services    │
│  • NL → SQL       │
│  • Message gen    │
│  • AI chat        │
│  • Segment suggest│
└───────────────────┘
```

### Campaign Lifecycle

```
[Draft] → [Send API] → [Channel Service] → async callbacks → [CRM updates stats]
                              │
                         per recipient:
                         sent → delivered → opened → read → clicked → converted
                                         ↘ failed
```

### Database ER Diagram

```
customers ──< orders
    │
    └──< campaign_recipients >──── campaigns ──── segments
                                        │
                                        └──< communication_logs
```

---

## 📁 Project Structure

```
ai-crm/
├── database/
│   └── schema.sql                  # Full MySQL schema + sample data
│
├── backend/                        # CRM Backend (Port 5000)
│   ├── config/
│   │   ├── database.js             # MySQL pool
│   │   └── logger.js               # Winston logger
│   ├── controllers/
│   │   ├── customer.controller.js
│   │   ├── order.controller.js
│   │   ├── segment.controller.js
│   │   ├── campaign.controller.js
│   │   └── ai.controller.js
│   ├── models/
│   │   ├── customer.model.js
│   │   ├── order.model.js
│   │   ├── segment.model.js
│   │   └── campaign.model.js
│   ├── services/
│   │   └── ai.service.js           # OpenAI + Gemini unified adapter
│   ├── middlewares/
│   │   ├── error.middleware.js
│   │   └── logger.middleware.js
│   ├── routes/
│   │   └── index.js                # All API routes
│   ├── scripts/
│   │   └── migrate.js              # DB migration runner
│   ├── server.js
│   ├── Dockerfile
│   └── .env.example
│
├── channel-service/                # Channel Service (Port 6000)
│   ├── controllers/
│   │   └── send.controller.js      # Delivery simulator + callback
│   ├── routes/
│   │   └── index.js
│   ├── server.js
│   └── Dockerfile
│
├── frontend/                       # React Frontend (Port 3000)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/index.jsx    # KpiCard, Table, Modal, Button, Input…
│   │   │   └── layout/Sidebar.jsx  # Collapsible nav
│   │   ├── context/
│   │   │   └── ToastContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard/
│   │   │   ├── Customers/          # List + CustomerProfile
│   │   │   ├── Orders/
│   │   │   ├── Segments/           # Manual + AI creation
│   │   │   ├── Campaigns/          # Create, send, view funnel
│   │   │   ├── Analytics/
│   │   │   └── AIAssistant/        # Chat panel
│   │   ├── services/
│   │   │   └── api.js              # Axios + all API calls
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml
├── package.json                    # Root scripts (concurrently)
└── README.md
```

---

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Node.js ≥ 18
- MySQL 8.0
- An OpenAI API key **or** Gemini API key

### 1 — Clone & Install

```bash
git clone <repo-url> ai-crm
cd ai-crm
npm install          # installs concurrently at root
npm run install:all  # installs backend + channel-service + frontend
```

### 2 — Database Setup

```bash
# Start MySQL, then:
mysql -u root -p -e "CREATE DATABASE ai_crm;"

# Copy and configure env
cp backend/.env.example backend/.env
# Edit backend/.env with your DB credentials and AI key

# Run migration (creates all tables + sample data)
npm run db:migrate
```

### 3 — Configure Environment

**`backend/.env`**
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=ai_crm
AI_PROVIDER=gemini             # openai | gemini
CHANNEL_SERVICE_URL=http://localhost:6000
SELF_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

**`frontend/.env`**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4 — Run All Services

```bash
npm run dev
# Starts backend (5000), channel-service (6000), frontend (3000) concurrently
```

Or run individually:
```bash
npm run dev:backend   # Terminal 1
npm run dev:channel   # Terminal 2
npm run dev:frontend  # Terminal 3
```

Open **http://localhost:3000** 🎉

---

## 🐳 Docker (Recommended)

```bash
# Copy env
cp backend/.env.example .env
# Edit .env with your API keys

docker-compose up --build
```

Services start automatically with MySQL health check.

---

## 📡 API Reference

### Customers
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/customers` | List (page, limit, search, city) |
| GET | `/api/customers/stats` | KPI stats + city distribution |
| GET | `/api/customers/:id` | Customer + orders |
| POST | `/api/customers` | Create |
| PUT | `/api/customers/:id` | Update |
| DELETE | `/api/customers/:id` | Delete |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/orders` | List (page, limit, customer_id, category) |
| GET | `/api/orders/analytics` | Monthly revenue, category, top customers |
| POST | `/api/orders` | Create (auto-recalcs customer stats) |
| DELETE | `/api/orders/:id` | Delete |

### Segments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/segments` | List all |
| GET | `/api/segments/:id` | Segment + matching customers |
| POST | `/api/segments` | Create manual |
| POST | `/api/segments/preview` | Preview SQL condition |
| POST | `/api/segments/ai` | **AI NL → segment** |
| POST | `/api/segments/ai/suggest` | AI suggests segments from data |
| PUT | `/api/segments/:id` | Update |
| DELETE | `/api/segments/:id` | Delete |

### Campaigns
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/campaigns` | List (page, limit, status) |
| GET | `/api/campaigns/analytics` | Overall funnel + recent |
| GET | `/api/campaigns/:id` | Campaign + recipients |
| POST | `/api/campaigns` | Create |
| POST | `/api/campaigns/ai/message` | **AI message generator** |
| POST | `/api/campaigns/:id/send` | Send → Channel Service |

### System
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/receipts` | Receipt from Channel Service |
| POST | `/api/ai/chat` | AI Assistant chat |
| GET | `/health` | Health check |

---

## 🤖 AI Integration

### Providers
Set `AI_PROVIDER=gemini` in `.env`.

### Features

**1. Natural Language Segmentation**
```json
POST /api/segments/ai
{
  "natural_language": "Customers who spent more than ₹5000 and haven't ordered in 60 days"
}
// Returns: SQL condition + matching customers + AI explanation
```

**2. Campaign Message Generator**
```json
POST /api/campaigns/ai/message
{
  "channel": "WhatsApp",
  "segment_id": "s001",
  "goal": "re-engage inactive customers"
}
// Returns: Tailored message + personalization tip
```

**3. AI Marketing Assistant Chat**
```json
POST /api/ai/chat
{
  "message": "Help me increase sales of beauty products",
  "history": []
}
// Returns: Audience suggestion + message + channel recommendation + reasoning
```

**4. Smart Segment Suggestions**
```json
POST /api/segments/ai/suggest
// Returns: 3 high-impact segment ideas based on customer data
```

---

## ☁️ Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build

# In Vercel dashboard:
# Root directory: frontend
# Build command: npm run build
# Output directory: build
# Environment variable: REACT_APP_API_URL=https://your-backend.railway.app/api
```

### Backend → Railway

```bash
# Connect GitHub repo
# Set root directory: backend
# Add all environment variables from .env
# Railway auto-detects Node.js and runs npm start
```

### Channel Service → Railway

```bash
# New service in same Railway project
# Root directory: channel-service
# PORT: 6000 (Railway assigns dynamic port, use process.env.PORT)
```

### MySQL → PlanetScale / Railway MySQL

```bash
# Create a PlanetScale database
# Get connection string
# Update DB_* env vars in backend Railway service
# Run migration manually or via Railway start command
```

### Production Checklist
- [ ] Set `NODE_ENV=production` on backend
- [ ] Set `SELF_URL` to your Railway backend URL
- [ ] Set `FRONTEND_URL` to your Vercel URL in backend env
- [ ] Set `CHANNEL_SERVICE_URL` to your channel service Railway URL
- [ ] Set `OPENAI_API_KEY` or `GEMINI_API_KEY`
- [ ] Run `npm run db:migrate` against production DB

---

## 🛣 Future Enhancements

| Enhancement | Priority |
|---|---|
| JWT Auth + Role-based access | High |
| Real WhatsApp Business API / Twilio integration | High |
| Scheduled campaigns (cron) | Medium |
| A/B testing for messages | Medium |
| Customer import via CSV | Medium |
| Segment auto-refresh cron | Medium |
| Push notification channel | Low |
| LLM fine-tuning on brand data | Low |
| Multi-tenant SaaS mode | Low |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Tailwind CSS, Recharts, Axios |
| Backend | Node.js 20, Express.js, MVC architecture, Winston |
| Database | MySQL 8.0, mysql2/promise, connection pooling |
| AI | OpenAI GPT-3.5-turbo / Google Gemini Pro (switchable) |
| Channel Service | Express.js microservice (port 6000) |
| DevOps | Docker, docker-compose, Nginx (frontend) |
| Deployment | Vercel (frontend), Railway (backend + channel), PlanetScale (DB) |

---
