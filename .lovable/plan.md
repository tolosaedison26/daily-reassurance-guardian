

## Plan: Senior Profile & History Page (`/seniors/:id`)

This is a large feature with 7 new components and a new page. All sections will use mock data initially (Margaret Ross, 47-day streak, 30 days of history). No DB schema changes needed — the existing `managed_seniors` and `managed_senior_contacts` tables have all required fields.

### New Files to Create

**1. `src/pages/SeniorProfilePage.tsx`** — Main page orchestrator
- Route: `/seniors/:id`
- Loads senior data from `managed_seniors` table (or falls back to mock data for demo IDs)
- `max-w-[960px] mx-auto` container
- Desktop: 2-column grid (60/40 split) for calendar+timeline (left) and stats+mood+notes+settings (right)
- Mobile: single column stacked
- Breadcrumb: "← Dashboard" back to `/`

**2. `src/components/senior-profile/SeniorProfileHeader.tsx`**
- Avatar (72px mobile, 88px desktop) with initials + indigo bg
- Name, relationship badge, age, phone with copy icon
- Status pill (green/amber/red/grey) + last check-in timestamp
- Action buttons row: Send Reminder (outline+Bell), Mark Safe (outline green+CheckCircle), Edit Profile (ghost+Pencil), More (dropdown with Pause, Contacts, Download CSV, Archive, Remove)
- Mobile: buttons in `overflow-x-auto` horizontal scroll
- Confirmation popovers for Send Reminder and Mark Safe
- Destructive modal for Remove (type "REMOVE" to confirm)

**3. `src/components/senior-profile/QuickStatsStrip.tsx`**
- 4 stat chips: Streak (Flame), This Week (x/7), This Month (%), Avg Response (Clock)
- `grid-cols-2 md:grid-cols-4` layout
- Same card style as dashboard stat chips (rounded-2xl, border, shadow-card)

**4. `src/components/senior-profile/CheckinCalendar.tsx`**
- Month navigator with ← → arrows
- 7-column grid (Sun–Sat headers)
- Day cells: green (checked), red (missed), amber (late), grey outline (no schedule), empty (future)
- Today: ring highlight
- Click day → inline expandable detail row (time, mood, note)
- Legend row below calendar
- Mock 30 days of data for Margaret

**5. `src/components/senior-profile/SeniorMoodTrendsCard.tsx`** (single-senior version, distinct from existing multi-senior MoodTrendsCard)
- Tab switcher: 7 Days / 30 Days
- 7-day: row of emoji icons with day labels
- 30-day: simple SVG dot+line chart (CSS/SVG only, no library)
- Summary line below each view

**6. `src/components/senior-profile/ActivityTimeline.tsx`**
- Vertical timeline with left-border connector
- Event types: CheckCircle, XCircle, Bell, AlertTriangle, Shield, FileText, Pencil, Play
- Each row: icon + label + timestamp (right-aligned)
- "Load more" ghost button after 10 events
- Mock ~15 events

**7. `src/components/senior-profile/CaregiverNotes.tsx`**
- Notes list (light grey cards with date, edit/delete)
- Inline edit: textarea + Save/Cancel
- Inline delete confirmation
- Add note: textarea (max 500 chars, char count) + "Save Note" button
- Local state for now (no new DB table — mock data)

**8. `src/components/senior-profile/ProfileSettingsSummary.tsx`**
- Read-only card showing schedule, grace period, mood check, active days, vacation mode, contact count
- "Edit" link → `/seniors/:id/edit`
- Contact count links to `/seniors/:id/contacts`

### Route Changes (`src/App.tsx`)
- Add `<Route path="/seniors/:id" element={<SeniorProfilePage />} />` **before** the `/seniors/:id/edit` route

### Dashboard Link (`src/pages/CaregiverDashboard.tsx`)
- Change senior card `onClick` from opening `CheckInHistoryPanel` to navigating to `/seniors/:id`
- Keep existing edit and contacts icon buttons

### Technical Notes
- All components use existing UI primitives (Button, Card, Badge, Popover, DropdownMenu, AlertDialog, Skeleton)
- Icons: lucide-react only
- 30-day mood chart: pure SVG element, no recharts
- Responsive breakpoints via Tailwind `md:` and `lg:` prefixes
- Loading state: Skeleton placeholders for each section

