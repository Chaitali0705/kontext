# Kontext 🧠

**The Intelligence Layer for Teams**

Kontext helps teams turn everyday decisions and setbacks into reusable context that increases value over time. Build your team's competitive moat through systematic knowledge capture.

---
🚀 Why Kontext Matters
Most tools store information.
Kontext stores context.
| Traditional Tools | Kontext |
|-------------------|---------|
| Store documentation | Capture decision reasoning |
| Manage tasks | Capture lessons learned |
| Static knowledge | Compounding intelligence |
| Project memory | Organizational memory |

Teams lose decision context all the time.
Slack threads disappear.
Docs get outdated.
People leave the company.
Months later, someone asks:
“Why did we make this decision?”
And no one remembers.
This leads to:
• repeated mistakes
• duplicated discussions
• slow onboarding
• lost institutional knowledge
Kontext captures the reasoning behind decisions, turning everyday work into reusable team intelligence.
Instead of starting from zero every project, teams build a compounding knowledge moat.

## 🌟 Features

### Core Capabilities
- **📋 Decision DNA** - Capture critical decisions with rationale, constraints, and alternatives
- **⚠️ Failure Library** - Learn from mistakes by documenting what failed and why
- **🗑️ Smart Management** - Delete decisions, failures, and entire projects when no longer relevant
- **⚡ Quick Actions** - Add decisions/failures directly from sidebar for faster workflow
- **📊 Knowledge Analytics** - Track team knowledge growth with moat score and reuse metrics
- **🔗 Knowledge Graph** - Visualize relationships with AI-generated summaries
- **👥 Team Collaboration** - Invite team members to contribute to shared knowledge
- **🎯 Smart Insights** - Surface similar decisions to prevent duplicate work

### Why Kontext?
- **Compound Learning** - Your team's intelligence grows over time, not resets with each project
- **Context Preservation** - Never lose critical "why" behind decisions
- **Failure Prevention** - Avoid repeating past mistakes
- **Faster Onboarding** - New team members access institutional knowledge instantly
- **Decision Quality** - Make better decisions by learning from historical context

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon Cloud)
- **ORM**: Prisma
- **Validation**: Zod v4
- **AI/LLM**: Pluggable (OpenAI, Anthropic, Local, Mock)

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **HTTP Client**: Axios

---
🏗 System Architecture
Kontext uses a modern full-stack architecture designed for scalability and modular AI integration
┌─────────────────────┐
                 │      Frontend       │
                 │  React + TypeScript │
                 │  Tailwind + Vite    │
                 └─────────┬───────────┘
                           │
                           │ API Requests
                           │
                 ┌─────────▼───────────┐
                 │      Backend        │
                 │   Node.js + Express │
                 │     REST API        │
                 └─────────┬───────────┘
                           │
                           │ ORM
                           │
                 ┌─────────▼───────────┐
                 │      Database       │
                 │   PostgreSQL (Neon) │
                 │      Prisma ORM     │
                 └─────────┬───────────┘
                           │
                           │ Context Data
                           │
                 ┌─────────▼───────────┐
                 │      AI Layer       │
                 │  OpenAI / Anthropic │
                 │   Local LLMs        │
                 └─────────┬───────────┘
                           │
                           │ Insights
                           │
                 ┌─────────▼───────────┐
                 │   Knowledge Graph   │
                 │ Decisions + Failures│
                 │ Relationships       │
                 └─────────────────────┘


## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (or use the configured Neon cloud instance)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd kontext
   ```

2. **Setup Server**
   ```bash
   cd server
   npm install
   
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate deploy
   
   # (Optional) Seed with demo data
   npx ts-node prisma/seed.ts
   
   # Start development server
   npm run dev
   ```
   Server runs on `http://localhost:3001`

3. **Setup Client**
   ```bash
   cd client
   npm install
   
   # Start development server
   npm run dev
   ```
   Client runs on `http://localhost:5173`

### Environment Variables

Create `.env` file in the `server` directory:

```env
PORT=3001
NODE_ENV=development
DATABASE_URL="your_postgresql_connection_string"

# AI/LLM Configuration (optional)
LLM_PROVIDER=mock  # Options: openai, anthropic, local, mock
# OPENAI_API_KEY=sk-your-key-here
# ANTHROPIC_API_KEY=sk-ant-your-key-here
```

See `.env.example` for all available options and `LLM-INTEGRATION.md` for full AI setup guide.

---

## 📖 Usage

### Creating Your First Project

1. **Launch the app** - Navigate to `http://localhost:5173`
2. **Click "Create Project"**
3. **Fill in details**:
   - Project Name (required)
   - Description (optional)
   - Team Size (optional)
4. **Submit** - You'll be redirected to your project dashboard
5. **Delete anytime** - From the landing page, hover over a project and click the trash icon

### Managing Projects

- **View All Projects** - Landing page shows all your projects
- **Switch Projects** - Click any project card to open it
- **Delete Projects** - From dashboard → Click settings icon (⚙️) → Delete Project
  - ⚠️ Warning: Deletes all decisions and failures in that project

### Adding a Decision

1. Open your project dashboard
2. Click **"Add Decision"** (from header or sidebar)
3. Document:
   - Title
   - Rationale (why this decision)
   - Constraints (conditions that apply)
   - Alternatives considered
4. Save - Kontext will track this for future reference
5. **Delete anytime** - Hover over a decision and click the trash icon to remove it

### Logging a Failure

1. Click **"Log Failure"** (from header or sidebar)
2. Capture:
   - What failed
   - Why it failed
   - Cost estimate (hours lost)
3. Save - Build your failure library for team learning
4. **Delete anytime** - Hover over a failure and click the trash icon to remove it

### Quick Actions from Sidebar

The sidebar now includes quick-access buttons:
- **Add Decision** (orange button) - Log decisions without leaving current page
- **Log Failure** (red button) - Capture failures instantly
- Both open modals for fast input

### Viewing Analytics

Navigate to the **"Insights"** tab to see:
- **Moat Score** - Overall knowledge base strength
- **Decision/Failure Trends** - Monthly tracking
- **Reuse Rate** - How often knowledge is being leveraged
- **Similar Decisions** - Find related past decisions

### Knowledge Graph with AI Summaries

Navigate to the **"Graph"** page to visualize your knowledge:
- **Visual Network** - See connections between decisions, failures, and successes
- **AI-Powered Summaries** - Each node displays an auto-generated summary
  - Uses mock extraction by default (no API needed)
  - Supports OpenAI, Anthropic, or local LLMs (see `LLM-INTEGRATION.md`)
- **Hover for Details** - View full context by hovering over nodes
- **Color-Coded** - Orange (decisions), Red (failures), Green (successes)

---
 Smart Insights
When teams log a new decision, Kontext automatically surfaces:
similar past decisions
related failures
relevant historical context
This helps teams avoid duplicate work and repeated mistakes.

## 🏗 Project Structure

```
kontext/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── store/         # Zustand state management
│   │   └── types/         # TypeScript types
│   └── package.json
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── routes/        # API routes
│   │   ├── utils/         # Utility functions
│   │   └── validators.ts  # Zod schemas
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   ├── migrations/    # DB migrations
│   │   └── seed.ts        # Seed data
│   └── package.json
│
├── BUGFIX.md              # Bug fix documentation
├── SETUP.md               # Detailed setup guide
└── README.md              # This file
```

---

## 🐛 Recent Bug Fixes

### Fixed: Zod v4 Validator Issue (2026-02-27)

**Problem**: Create project endpoint was throwing validation errors

**Root Cause**: Validators using `.trim().optional()` pattern incompatible with Zod v4

**Solution**: Updated validators to use `z.preprocess()` for safe string trimming:

```typescript
// Before (broken)
z.string().trim().optional()

// After (fixed)
z.preprocess(
  (val) => typeof val === 'string' ? val.trim() : val,
  z.string().optional()
)
```

See [BUGFIX.md](./BUGFIX.md) for detailed information.

---

## 🎨 Branding

- **Name**: Kontext
- **Logo**: Blue gradient brain circuit icon
- **Color Scheme**: 
  - Primary: `#4A90E2` to `#2E5C8A` (blue gradient)
  - Accent: `#FF9500` (orange)
  - Error: `#FF3B30` (red)
  - Success: `#34C759` (green)

---

## 🧪 Testing

### Run Smoke Tests
```bash
cd server
node smoke.js
```

### Manual Testing Checklist
- [ ] Create new project
- [ ] Delete a project
- [ ] Add decision to project
- [ ] Add decision from sidebar quick-action
- [ ] Delete a decision
- [ ] Log failure 
- [ ] Log failure from sidebar quick-action
- [ ] Delete a failure
- [ ] View analytics/insights
- [ ] Invite team member
- [ ] View knowledge graph with AI summaries
- [ ] Navigate between projects

---

## 📦 Database Schema

### Core Models

**Team** - Organization/team entity
- `id`, `name`, `createdAt`

**User** - Team members
- `id`, `email`, `name`, `teamId`, `onboardingStep`, `onboardingCompletedAt`

**Context** - Projects/topics
- `id`, `name`, `description`, `teamId`, `createdAt`, `updatedAt`

**Decision** - Decision records
- `id`, `title`, `content`, `rationale`, `tags`, `status`, `constraints`, `brokenRules`, `alternatives`, `outcome`, `contextId`, `authorId`

**Failure** - Failure logs
- `id`, `title`, `whatFailed`, `whyFailed`, `costEstimate`, `contextId`, `authorId`

---

## 🔌 API Endpoints

### Projects
- `GET /api/contexts` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/contexts/:id` - Get project by ID
- `DELETE /api/contexts/:contextId` - Delete project (cascades to decisions/failures)

### Decisions
- `GET /api/decisions?contextId=` - Get decisions for project
- `POST /api/decisions` - Create decision
- `DELETE /api/decisions/:decisionId` - Delete decision
- `GET /api/decisions/similar` - Find similar decisions

### Failures
- `GET /api/failures?contextId=` - Get failures for project
- `POST /api/failures` - Log failure
- `DELETE /api/failures/:failureId` - Delete failure

### Team
- `GET /api/teams/:teamId/members` - Get team members
- `POST /api/team/invite` - Invite team member

### Analytics
- `GET /api/metrics?projectId=` - Get metrics
- `GET /api/graph?projectId=` - Get knowledge graph data

### Health
- `GET /health` - Server health check

---

## 🚧 Roadmap

- [x] Delete functionality for decisions/failures/projects
- [x] Quick-add buttons in sidebar
- [x] AI-powered summaries in knowledge graph
- [x] Pluggable LLM infrastructure (OpenAI, Anthropic, Local)
- [ ] Full LLM integration (you integrate your API)
- [ ] Kontext AI assistant (context-aware Q&A)
- [ ] Search functionality across decisions/failures
- [ ] Export knowledge base to markdown/PDF
- [ ] Browser extension for quick decision capture
- [ ] Slack/Discord integration
- [ ] Advanced AI decision recommendations
- [ ] Advanced analytics and reporting
- [ ] Multi-team workspaces

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request



---

## 💡 Philosophy

**Context is the moat.** 

In a world where tools and frameworks change constantly, the decisions your team makes and the lessons you learn are your true competitive advantage. Kontext helps you capture, preserve, and compound that knowledge over time.

Every decision documented is a lesson preserved.  
Every failure logged is a mistake you won't repeat.  
Every team member onboarded gets instant access to years of wisdom.

**Build your moat. Use Kontext.**

---

## 📞 Support

For bugs, feature requests, or questions:
- Open an issue on GitHub
- Check [SETUP.md](./SETUP.md) for detailed setup instructions
- Review [BUGFIX.md](./BUGFIX.md) for known issues and fixes

---

**Made with 🧠 for teams that value learning**
