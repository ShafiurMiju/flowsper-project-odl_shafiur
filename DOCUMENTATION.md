# Flowsper - Technical Implementation Documentation

**Project:** GoHighLevel + Supabase Integration  
**Developer:** Md Shafiur Rahman  
**Date:** February 2026  
**Stack:** Next.js 16, TypeScript, Tailwind CSS, Supabase, GoHighLevel API v2

---

## 1. Project Overview & Implementation Approach

Flowsper is a full-stack web application that integrates **GoHighLevel (GHL)** with **Supabase** as the database layer. The implementation demonstrates three core requirements:

1. **Reading from GoHighLevel** – Implemented GHL API v2 client to fetch contacts, opportunities, and pipelines
2. **Writing to Supabase** – Built dual-write system that syncs data to PostgreSQL with automatic activity logging
3. **User Interaction** – Created complete CRUD interfaces with real-time updates and advanced UI features

The application features a modern CRM dashboard with contact management, opportunity tracking via Kanban board, and comprehensive activity logging.

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

## 5. Implementation Details: How It Was Built

### 5.1 GoHighLevel API Integration
**Challenge:** GHL API v2 has inconsistent field naming conventions  
**Solution Implemented:**
- Query parameters use `snake_case` (e.g., `location_id`, `pipeline_id`)
- Request body fields use `camelCase` (e.g., `locationId`, `pipelineId`)
- Created mapping layer in `GHLClient` to convert between conventions automatically
- Example from `src/lib/ghl.ts`:
```typescript
const payload = {
  locationId: this.locationId,      // camelCase for body
  pipelineId: data.pipelineId,
  contactId: data.contactId
};
// vs query params: ?location_id=xxx&pipeline_id=xxx
```

### 5.2 Dual-Write Architecture
**Approach:** Write to GoHighLevel first (source of truth), then sync to Supabase
- **Step 1:** Create/update entity in GHL via API
- **Step 2:** On success, write to Supabase with GHL ID as reference
- **Step 3:** Log the action to `activity_logs` table
- **Benefit:** Data consistency with GHL as primary system, Supabase for querying/reporting

### 5.3 Drag-and-Drop Implementation
**Location:** `/opportunities` page  
**How it works:**
1. Each opportunity card has `draggable` attribute
2. `onDragStart` captures the dragged opportunity
3. Stage columns have `onDrop` handlers
4. On drop, API call updates `pipelineStageId` in both GHL and Supabase
5. Visual feedback: dragged card shows 50% opacity
6. Empty columns display "Drop here" when dragging

### 5.4 Real-Time Search
**Implementation:** Debounced search with 300ms delay
- User types → 300ms timer starts
- Timer resets on each keystroke
- After 300ms silence → API call executes
- Prevents excessive API calls while typing
- Code location: `src/app/contacts/page.tsx` useEffect with setTimeout

### 5.5 Activity Logging System
**How it's implemented:**
- `src/lib/activity-logger.ts` provides `logActivity()` function
- Every CRUD operation calls this function
- Logs include: action type, entity type, entity ID, and JSON details
- Example: Creating a contact logs `{ action: 'create', entity_type: 'contact', details: {...} }`
- Activity log page displays filtered history with timestamps

---

## 6. Key Technical Challenges & Solutions

| Challenge | How It Was Solved |
|-----------|-------------------|
| **GHL API Authentication** | Initial JWT format was deprecated. Switched to PAT (Personal Access Token) format `pit-xxxxx` after debugging 401 errors |
| **Field Name Mismatches** | Built conversion layer to map TypeScript camelCase to GHL's mixed conventions (body=camelCase, query=snake_case) |
| **Credential Security** | All GHL API calls route through Next.js API routes (`/api/*`), never exposing tokens to client browser |
| **Data Synchronization** | Implemented dual-write with GHL as primary source, Supabase for fast queries and activity audit trail |
| **Drag-Drop UX** | Used native HTML5 drag events with React state management to update pipeline stages seamlessly |
| **Type Safety** | Created comprehensive TypeScript interfaces in `src/types/` for all GHL entities and API responses |

---

## 7. Technical Stack Justification

| Technology | Why It Was Chosen |
|------------|-------------------|
| **Next.js 16** | App Router for modern React patterns, API routes for server-side security, built-in TypeScript support |
| **TypeScript** | Full type safety reduces bugs, better IDE support, enforces API contract compliance |
| **Tailwind CSS** | Rapid UI development, consistent design system, responsive utilities out of the box |
| **Supabase** | PostgreSQL with instant API, real-time capabilities, easy authentication and RLS for future scaling |
| **React Hooks** | Modern state management with useState, useCallback, useEffect for clean component logic |

---

## 8. Code Quality & Best Practices

✅ **Separation of Concerns:**
- API client logic in `src/lib/ghl.ts`
- Database operations in `src/lib/supabase.ts`
- Reusable UI components in `src/components/ui/`
- Business logic in API routes, not in client components

✅ **Error Handling:**
- Try-catch blocks in all async operations
- User-friendly error messages
- API routes return proper HTTP status codes

✅ **Type Safety:**
- All API responses typed with interfaces
- No `any` types used
- Props fully typed for all components

✅ **Performance Optimizations:**
- Debounced search to reduce API calls
- useCallback for memoized functions
- Lazy loading for modals and forms

---

## 9. Project Deliverables Summary

This implementation delivers:
- ✅ **Full CRUD** for Contacts and Opportunities
- ✅ **Real-time sync** between GoHighLevel and Supabase
- ✅ **Activity logging** for complete audit trail
- ✅ **Modern UI** with responsive design and drag-drop
- ✅ **Type-safe codebase** with comprehensive TypeScript
- ✅ **Security** through server-side API routing
- ✅ **Scalable architecture** ready for future enhancements

**Development Approach:** Built iteratively with Git commits for each feature, debugged API compatibility issues, and implemented user feedback for enhanced UX.

---

**Repository:** flowsper-project-odl_shafiur  
**Developer:** Md Shafiur Rahman
