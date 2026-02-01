# DataFlow CRM - Technical Documentation

**Project:** GoHighLevel + Supabase Integration  
**Developer:** Aryan Emon  
**Date:** February 2026  
**Stack:** Next.js 16, TypeScript, Tailwind CSS, Supabase, GoHighLevel API v2

---

## 1. Project Overview

DataFlow CRM is a web application that integrates **GoHighLevel (GHL)** with **Supabase** as the database layer. The application demonstrates proficiency in:

- **Reading from GoHighLevel** – Fetching contacts, opportunities, and pipelines via GHL API v2
- **Writing to Supabase** – Syncing and persisting data with activity logging
- **User Interaction** – Full CRUD operations with real-time UI updates

The application provides a modern CRM dashboard for managing contacts and opportunities with a Kanban-style pipeline board.

---

## 2. Features Implemented

### 2.1 Contact Management
| Feature | Description | Location |
|---------|-------------|----------|
| **List Contacts** | Fetches all contacts from GHL with search functionality | `/contacts` page |
| **Create Contact** | Creates contact in GHL, syncs to Supabase, logs activity | POST `/api/contacts` |
| **Update Contact** | Updates contact in both GHL and Supabase | PUT `/api/contacts/[id]` |
| **Delete Contact** | Removes contact from GHL and Supabase | DELETE `/api/contacts/[id]` |
| **Search** | Real-time search with debouncing (300ms) | Contacts page |
| **Sync** | Manual sync button to refresh from GHL | Contacts page header |

### 2.2 Opportunity Management
| Feature | Description | Location |
|---------|-------------|----------|
| **Pipeline Board** | Kanban-style board grouped by pipeline stages | `/opportunities` page |
| **Create Opportunity** | Creates in GHL with pipeline/stage selection | POST `/api/opportunities` |
| **Update Opportunity** | Updates opportunity details | PUT `/api/opportunities/[id]` |
| **Delete Opportunity** | Removes from GHL and Supabase | DELETE `/api/opportunities/[id]` |
| **Drag & Drop** | Move opportunities between stages via drag-drop | Opportunities page |
| **Pipeline Selector** | Switch between different pipelines | Dropdown selector |

### 2.3 Dashboard
- Quick stats: Total contacts, opportunities, recent activity
- Navigation sidebar with icons
- Responsive layout for all screen sizes

### 2.4 Activity Logging
- All CRUD operations are logged to Supabase
- Activity log page with filtering capabilities
- Tracks: action type, entity, timestamp, details

---

## 3. Technical Architecture

### 3.1 Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # Server-side API routes
│   │   ├── contacts/      # Contact CRUD endpoints
│   │   ├── opportunities/ # Opportunity CRUD endpoints
│   │   ├── pipelines/     # Pipeline fetching
│   │   └── activity/      # Activity log retrieval
│   ├── contacts/          # Contacts page
│   ├── opportunities/     # Opportunities page
│   ├── activity/          # Activity log page
│   └── page.tsx           # Dashboard
├── components/
│   ├── ui/                # Reusable UI components
│   ├── contacts/          # Contact-specific components
│   ├── opportunities/     # Opportunity components
│   └── layout/            # Layout components (Sidebar)
├── lib/
│   ├── ghl.ts             # GoHighLevel API client
│   ├── supabase.ts        # Supabase client setup
│   └── activity-logger.ts # Activity logging utility
└── types/                 # TypeScript definitions
```

### 3.2 Data Flow Architecture
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React UI      │────▶│  Next.js API     │────▶│  GoHighLevel    │
│   (Client)      │     │  Routes (Server) │     │  API v2         │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │    Supabase      │
                        │   (PostgreSQL)   │
                        └──────────────────┘
```

**Key Design Decisions:**
1. **Server-side API routes** – All GHL API calls are made from Next.js API routes to hide credentials from the client
2. **Dual-write pattern** – Data is written to GHL first (source of truth), then synced to Supabase for querying and logging
3. **TypeScript throughout** – Full type safety with interfaces for GHL entities

### 3.3 API Client Implementation
The `GHLClient` class (`src/lib/ghl.ts`) provides:
- Singleton pattern for consistent configuration
- Automatic header injection (Authorization, Version, Content-Type)
- Error handling with detailed error messages
- All CRUD methods for contacts and opportunities

**Important API Details:**
- GHL API uses **camelCase** for request body fields (`locationId`, `pipelineId`)
- GHL API uses **snake_case** for query parameters (`location_id`, `pipeline_id`)
- Authentication via Personal Access Token (PAT) format: `pit-xxxxx`

---

## 4. Database Schema (Supabase)

```sql
-- Contacts table (mirrors GHL contacts)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ghl_id TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunities table (mirrors GHL opportunities)
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ghl_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  pipeline_id TEXT,
  pipeline_stage_id TEXT,
  contact_id TEXT,
  monetary_value DECIMAL(12,2),
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs for audit trail
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Key Technical Achievements

| Challenge | Solution |
|-----------|----------|
| GHL API field naming inconsistency | Created field mapping layer in API client |
| Credential security | Server-side API routes hide tokens from client |
| Real-time UI updates | Optimistic updates with automatic refetch |
| Drag-and-drop pipeline | Native HTML5 drag events with state management |
| Search performance | Debounced search (300ms delay) |
| Type safety | Comprehensive TypeScript interfaces |

---

## 6. Environment Configuration

Required environment variables (`.env.local`):
```
GHL_API_KEY=pit-xxxxx              # GoHighLevel Personal Access Token
GHL_LOCATION_ID=xxxxx              # GHL Location/Sub-account ID
NEXT_PUBLIC_SUPABASE_URL=xxxxx     # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx  # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY=xxxxx    # Supabase service role key
```

---

## 7. Running the Application

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 8. Summary

This project successfully demonstrates:
- ✅ **Integration expertise** with third-party APIs (GoHighLevel)
- ✅ **Database design** with Supabase/PostgreSQL
- ✅ **Modern React patterns** with Next.js App Router
- ✅ **TypeScript proficiency** with full type coverage
- ✅ **UI/UX implementation** with Tailwind CSS
- ✅ **CRUD operations** with proper error handling
- ✅ **Activity logging** for audit trails
- ✅ **Drag-and-drop** functionality for enhanced UX

The application is production-ready and demonstrates clean code architecture, proper separation of concerns, and modern development practices.

---

**Repository:** flowsper-project-odl_shafiur  
**Contact:** Aryan Emon
