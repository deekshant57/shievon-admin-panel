# Design decisions — Vendor Admin Panel UI

**Status:** Accepted  
**Date:** 2026-06-22  
**Branch context:** `UI-upgrade`  
**Chosen direction:** **Design D — Hybrid** (Bento header + Classic body)

Reference implementation: `src/components/dashboard/layout/dashboard-kpi-bento.tsx`  
Live dashboards: `src/components/dashboard/admin.tsx`, `src/components/dashboard/owner.tsx`

---

## Summary

The panel uses a **Hybrid** visual language:

| Zone | Style | Purpose |
|------|--------|---------|
| **Top of page** (KPIs, order-status summary) | **Bento** | Hierarchy, emphasis, modern SaaS feel |
| **Middle & bottom** (charts, tables, forms, lists) | **Classic** | Scanability, density, predictable admin UX |
| **Auth (login/register)** | **Auth shell** | Split brand panel + form panel |
| **In-app shell** | **AppShell** | Sidebar + top bar (already implemented) |

**Do not** use the **Editorial (Design C)** dark-rail layout for daily operational pages. Reserve it for optional marketing/executive one-offs only.

---

## Decision: Hybrid (D) over pure Bento or pure Classic

### Why Hybrid wins

- **Bento alone** — strong first impression but tables and long lists feel cramped or inconsistent.
- **Classic alone** — reliable but flat; KPI row doesn’t feel “current.”
- **Hybrid** — bento **only where attention should land** (metrics, status at a glance); classic everywhere users **work** (sort, filter, paginate, edit).

### Rejected for primary dashboard

- **A · Bento** — too modular below the fold; weak table/chart rhythm.
- **B · Classic** — acceptable fallback; less distinctive KPI area.
- **C · Editorial** — conflicts with AppShell; poor fit for data-heavy vendor workflows.

---

## When to use what

### Bento patterns

Use for **summary / at-a-glance** content only:

- Hero KPI (e.g. total revenue + sparkline)
- Secondary KPI tiles (orders, vendors, shops) in an asymmetric grid
- Order-status strip (4 equal cards + thin progress bars)
- Optional: compact activity or “top N” tiles **above** the main work area

**Ingredients:**

- `grid gap-4 md:grid-cols-6 lg:grid-cols-12` (or `WidgetGrid` spans)
- shadcn `Card` with `border-border/60 shadow-sm`
- Hero card: `bg-gradient-to-br from-primary/8` overlay
- Icon wells: `bg-{color}-500/10 text-{color}-600` or `bg-accent/10 text-accent`
- `MiniBarChart` / small progress bars for micro-trends

**Do not use Bento for:**

- Full-width data tables
- Multi-step forms
- Settings pages
- Long scrollable lists (products, orders, users)
- Withdrawals / low-stock / category breakdown tables

### Classic patterns

Use for **work surfaces**:

- Page toolbar: title + subtitle + **time range toggle** (`TimeRangeToggle`)
- Chart + side panel split (`lg:grid-cols-7`, 4+3 or 8+4)
- Full-width tables inside `Card` with `bg-muted/30` header row
- List pages: `DataPanel` (title, toolbar, filters, body)
- Form sections: `Section` / `ProductFormSection` (stacked cards, not dashed two-column)

**Ingredients:**

- `DashboardSection` or `DataPanel` wrapper
- `PageHeader` for title + actions (no `before:bg-accent` title bars)
- Table wrapper: `rounded-lg border border-border/60`
- Empty states: `EmptyState`
- Pagination: existing rc-table / `Pagination` styling

### Auth patterns

Use **AuthShell** (`src/components/auth/layout/`):

- `variant="admin"` — marketplace copy on brand panel
- `variant="vendor"` — store-owner copy on register
- `AuthHeader` + form + optional `AuthDivider` / `AuthFooter`
- **No** duplicate headings (e.g. don’t show “My shops” in header button and body title on the same page)

### Shell patterns

- Logged-in pages: `AppShell` + domain sidebar (admin / shop)
- Page vertical rhythm: `space-y-6 md:space-y-8` (`DashboardShell`)

---

## Layout primitives (use these — don’t invent new wrappers)

| Primitive | Path | Use |
|-----------|------|-----|
| `DashboardShell` | `src/components/dashboard/layout/` | Dashboard page spacing |
| `DashboardHeader` | same | Welcome + quick actions; `hideActions` on shop-picker |
| `DashboardSection` | same | Card section with `PageHeader` + toolbar slot |
| `TimeRangeToggle` | same | Today / Week / Month / Year |
| `WidgetGrid` / `WidgetGridItem` | same | 12-col placement below bento header |
| `OrderStatusSection` | same | Shared order-status + time range |
| `PageHeader`, `Section`, `DataPanel`, `StatStrip`, `StatMetric` | `src/components/page/` | Lists, forms, KPI strip |
| `AuthShell`, `AuthHeader`, … | `src/components/auth/layout/` | Login, register, forgot password |
| shadcn adapters | `src/components/ui/shadcn/` + `src/components/ui/button.tsx` etc. | Primitives — extend adapters, don’t bypass |

---

## Hybrid dashboard page structure (admin)

Order sections **top to bottom**:

1. `DashboardHeader` (variant `admin`)
2. **Bento row** — hero revenue (6 cols) + orders / vendors / shops (2+2+2)
3. **Bento strip** — order status × 4 with progress
4. **Classic split** — sale history chart (8) + popular products or status breakdown (4)
5. **Classic full width** — recent orders (`DataPanel` / table)
6. **Classic grid** — secondary widgets (low stock 6 + top rated 6, etc.)

Owner/vendor dashboard: same hybrid for KPI + order status + chart; fewer widgets; shop list uses header title only (no duplicate “My shops”).

---

## Tokens & styling rules

- **Borders:** `border-border/60`
- **Cards:** `bg-card`, `shadow-sm`
- **Primary / accent:** brand red via `primary`, `accent`, `text-accent` — not random hex per widget
- **Muted text:** `text-muted-foreground` / `text-body` in TSX; in standalone `.css` plugin files use **legacy** tokens (`text-body`, `border-border-base`) per build constraints
- **Typography:** bold `text-heading` titles; **no italic** subtitles; `PageHeader` / `AuthHeader` hierarchy
- **Buttons in forms:** explicit `type="submit"` or rely on native submit (adapter must not force `type="button"`)
- **Motion:** subtle `transition-colors duration-200`; avoid framer-motion for simple toggles (use `TimeRangeToggle`)

---

## Anti-patterns (do not reintroduce)

- PickBazar accent-bar titles (`before:bg-accent` on `h3`)
- Dashed `Description + Card` two-column form sections
- `2xl:ltr:-ml-20` grid hacks — use `WidgetGridItem span={n}`
- Full-page `Loader` blocking entire dashboard when one widget can skeleton (future enhancement)
- Wiring mock preview pages to real APIs without explicit request
- Editorial dark rail on main dashboard
- Duplicate nav labels on the same screen (header action + body title)

---

## Production components

| Component | Path | Role |
|-----------|------|------|
| **DashboardKpiBento** | `layout/dashboard-kpi-bento.tsx` | Bento KPI row (admin + vendor variants) |
| **MiniBarChart** | `mini-bar-chart.tsx` | Sparkline in hero revenue card |
| **Admin dashboard** | `admin.tsx` | Marketplace dashboard (hybrid layout) |
| **Owner dashboard** | `owner.tsx` | Vendor shop dashboard (hybrid layout) |
| **ActionButton** | `ui/action-button.tsx` | Toolbar `<button>` actions — Design B · Soft |
| **LinkActionButton** | `ui/link-action-button.tsx` | Toolbar link actions; `LinkButton` is an alias |

---

## Migration checklist (when touching a page)

1. Replace old `Card` + `PageHeading` list headers with `DataPanel` or `DashboardSection`.
2. KPI row → `DashboardKpiBento` or `StatStrip` inside `DashboardSection`.
3. Tables → `border-border/60` wrapper + `EmptyState`.
4. Keep all data hooks and handlers unchanged unless task says otherwise.
5. Match `DashboardKpiBento` spacing and card treatment.

---

## Changelog

| Date | Decision |
|------|----------|
| 2026-06-22 | Adopt **Design D (Hybrid)** for dashboard; Auth shell for auth pages; Phase 6–7 page primitives |
| 2026-06-22 | Remove design samples; ship `DashboardKpiBento` on live admin/owner dashboards |
| 2026-06-22 | Adopt **Design B · Soft** for toolbar `ActionButton` / `LinkActionButton` |
