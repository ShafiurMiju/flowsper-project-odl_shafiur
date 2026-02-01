# DataFlow CRM

A web application integrating **GoHighLevel** with **Supabase** for managing contacts and opportunities.

Built for the Flowsper Technical Assessment.

## 🚀 Features

### 1. **Contact Management** (CRUD)
- **Create** new contacts in GoHighLevel
- **Read/List** contacts with search functionality
- **Update** existing contact information
- **Delete** contacts from the system
- **Sync** contacts from GHL to Supabase

### 2. **Opportunity Management** (CRUD + Move)
- **Add** new opportunities to pipelines
- **View** opportunities in a Kanban-style board by pipeline stage
- **Update** opportunity details (name, value, status)
- **Move** opportunities between pipeline stages
- **Delete** opportunities
- **Sync** opportunities from GHL to Supabase

### 3. **Activity Logging**
- Automatic tracking of all CRUD operations
- Filter logs by entity type (contacts/opportunities)
- Real-time activity feed with timestamps

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│  GoHighLevel    │     │    Supabase     │
│   (Frontend)    │     │     API         │     │   (Database)    │
└────────┬────────┘     └─────────────────┘     └────────▲────────┘
         │                                               │
         │              ┌─────────────────┐              │
         └─────────────▶│  API Routes     │──────────────┘
                        │  (Backend)      │
                        └─────────────────┘
```

### Tech Stack
- **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **External API**: GoHighLevel API v2
- **Icons**: Lucide React
- **Date Handling**: date-fns

### Project Structure
```
src/
├── app/
│   ├── api/                 # API routes
│   │   ├── contacts/        # Contact CRUD + sync
│   │   ├── opportunities/   # Opportunity CRUD + sync
│   │   ├── pipelines/       # Pipeline fetching
│   │   └── activity/        # Activity log retrieval
│   ├── contacts/            # Contacts page
│   ├── opportunities/       # Opportunities page
│   ├── activity/            # Activity log page
│   └── page.tsx             # Dashboard
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── contacts/            # Contact-specific components
│   ├── opportunities/       # Opportunity-specific components
│   └── layout/              # Layout components (Sidebar)
├── lib/
│   ├── ghl.ts               # GoHighLevel API client
│   ├── supabase.ts          # Supabase client
│   └── activity-logger.ts   # Activity logging utility
└── types/
    ├── ghl.ts               # GoHighLevel types
    └── database.ts          # Supabase/DB types
```

## 📋 Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- GoHighLevel account (free trial works)
- Supabase account (free tier works)

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/flowsper-project-odl_shafiur.git
cd flowsper-project-odl_shafiur
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
# GoHighLevel Configuration
GHL_API_KEY=your_gohighlevel_api_key_here
GHL_LOCATION_ID=your_gohighlevel_location_id_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 4. Set Up Supabase Database
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/schema.sql`
4. Run the SQL to create the required tables

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Getting API Credentials

### GoHighLevel
1. Log into your GoHighLevel account
2. Go to **Settings → Business Profile → API Keys**
3. Generate a new API key
4. Your Location ID is in the URL: `app.gohighlevel.com/location/YOUR_LOCATION_ID/...`

### Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → API**
3. Copy the **Project URL** and **API keys**

## 📝 API Endpoints

### Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts` | List contacts (with optional `search` query) |
| POST | `/api/contacts` | Create a new contact |
| GET | `/api/contacts/[id]` | Get a single contact |
| PUT | `/api/contacts/[id]` | Update a contact |
| DELETE | `/api/contacts/[id]` | Delete a contact |
| POST | `/api/contacts/sync` | Sync contacts from GHL to Supabase |

### Opportunities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/opportunities` | List opportunities (with optional `pipelineId`) |
| POST | `/api/opportunities` | Create a new opportunity |
| GET | `/api/opportunities/[id]` | Get a single opportunity |
| PUT | `/api/opportunities/[id]` | Update/Move an opportunity |
| DELETE | `/api/opportunities/[id]` | Delete an opportunity |
| POST | `/api/opportunities/sync` | Sync opportunities from GHL to Supabase |

### Pipelines
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pipelines` | Get all pipelines with stages |

### Activity
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/activity` | Get activity logs (with optional `entityType` filter) |

## 🎯 Design Decisions

1. **Server-side API Integration**: All GHL API calls go through Next.js API routes to keep credentials secure and handle CORS.

2. **Dual Data Storage**: Data is stored both in GHL (source of truth) and Supabase (for local querying, logging, and offline access).

3. **Activity Logging**: Every action is logged to Supabase for audit trail and analytics.

4. **Component-based Architecture**: Reusable UI components for consistency and maintainability.

5. **Type Safety**: Full TypeScript implementation with proper types for GHL and Supabase data.

## 🧪 Testing the Features

1. **Dashboard**: View stats and quick actions
2. **Contacts Page**: 
   - Click "Add Contact" to create a new contact
   - Use search to find contacts
   - Click edit/delete icons on contact cards
   - Click "Sync" to pull contacts from GHL
3. **Opportunities Page**:
   - Select a pipeline from dropdown
   - Click "Add Opportunity" to create new deals
   - Click "Move to [Stage]" to progress opportunities
   - Edit/delete using card icons
4. **Activity Log**: View all actions with filtering

## 👨‍💻 Author

**odl_shafiur**

---

*Built with ❤️ using Next.js, Supabase, and GoHighLevel*
