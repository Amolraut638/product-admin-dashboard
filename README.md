# Product Admin Dashboard

A responsive product administration dashboard built with **Next.js**, **React**, **TypeScript**, **Tailwind CSS** and **Axios**, using the [DummyJSON](https://dummyjson.com) public API.

---

## Features

- **Authentication** — login / logout with token persistence via `localStorage`
- **Protected routes** — unauthenticated users redirected to `/login`
- **Product listing** — desktop table and mobile card layout
- **Pagination** — API-level `limit` / `skip`, page size 10 / 20 / 50, URL-persisted
- **Search** — debounced, URL-persisted, resets to page 1, race-condition protection
- **Category filtering** — dynamic list from DummyJSON, URL-persisted
- **Sorting** — by Price / Rating / Title, ascending / descending, URL-persisted
- **Product details** — image gallery, description, metadata, stock, reviews
- **Add product** — validated form, loading and error states, duplicate-submit prevention
- **Edit product** — pre-populated form, update API, navigation on success
- **Delete product** — confirmation dialog, DELETE API, UI reflects deletion immediately
- **Form validation** — all fields validated on submit and on blur
- **Responsive UI** — adapts from 375 px mobile to 1440 px desktop
- **Loading / error / empty states** — every async operation has appropriate UI feedback
- **URL state** — page, limit, search, category, sort and order persist across refreshes

---

## Tech Stack

| Tool | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org) | React framework, App Router, file-based routing |
| [React 19](https://react.dev) | UI library |
| [TypeScript](https://typescriptlang.org) | Static typing |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first styling |
| [Axios](https://axios-http.com) | HTTP client, shared instance, interceptors |
| [Lucide React](https://lucide.dev) | Icons |
| [DummyJSON](https://dummyjson.com) | Public REST API (products, auth) |

---

## Setup

```bash
git clone https://github.com/Amolraut638/product-admin-dashboard
cd product-admin-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The application does not require any environment variables. The DummyJSON base URL (`https://dummyjson.com`) is configured once in `src/lib/axios.ts`.

---

## Demo Credentials

```
Username: emilys
Password: emilyspass
```

These are the DummyJSON demo credentials required by the assignment. Any valid DummyJSON account works.

---

## API Endpoints

The following DummyJSON endpoints are used:

```
POST   /auth/login                       Sign in
GET    /products                         List all products
GET    /products/search?q=<query>        Search products
GET    /products/category-list           Get all category slugs
GET    /products/category/<category>     Filter by category
GET    /products/<id>                    Product details
POST   /products/add                     Create a product (simulated)
PUT    /products/<id>                    Update a product (simulated)
DELETE /products/<id>                    Delete a product (simulated)
```

---

## DummyJSON CRUD Limitation

> **Important:** DummyJSON provides simulated CRUD endpoints. Create, update and delete requests return successful responses, but the remote dataset is **not permanently modified**. The application reflects successful mutations in the current client-side session where appropriate. Refreshing or reloading data from DummyJSON will restore the original dataset.

This is a limitation of the DummyJSON demo API, not a bug in the application. In a production application with a real backend, mutations would persist correctly.

---

## Search + Category Design Decision

DummyJSON does not provide a combined server-side **search + category filter** endpoint. The search endpoint (`/products/search`) and the category endpoint (`/products/category/<slug>`) are separate and cannot be composed.

**Implementation decision:** Category filtering is disabled while search is active, and initiating a category filter clears any active search. This avoids misleading or inconsistent results from splitting the request across two endpoints.

This behaviour is reflected in the FilterBar UI, where the category dropdown is cleared when a search query is entered.

---

## Race Condition Solution

Search inputs trigger API requests after a **450 ms debounce** period. If the user types quickly and multiple requests are dispatched, the application prevents stale results from overwriting newer ones through two complementary mechanisms:

1. **AbortController** — each new fetch cancels the previous in-flight request via `controller.abort()`. Axios translates the abort into a `CanceledError`, which is detected with `isCancel()` and silently ignored.
2. **`cancelled` flag** — a local boolean is set to `true` in the effect's cleanup function. Even if the abort arrives after a response, the `cancelled` flag prevents the stale data from being dispatched to state.

Cancellation is never shown as a user-facing error.

---

## Architecture

```
Page / Route component
        ↓
Feature component (e.g. ProductsContent, ProductForm)
        ↓
Service layer (product.service.ts, auth.service.ts)
        ↓
Shared Axios instance (src/lib/axios.ts)
        ↓
DummyJSON API
```

**Key decisions:**

- **Single Axios instance** — the entire application uses one Axios client (`src/lib/axios.ts`) with a request interceptor that attaches the `Authorization: Bearer <token>` header automatically.
- **Service layer** — all API calls live in `src/services/`. Components never import Axios directly.
- **URL as source of truth** — the product list URL (`/products?page=...&limit=...&search=...&category=...&sort=...&order=...`) fully encodes all filter, pagination, and sort state. Sharing or refreshing a URL restores the exact same view.
- **`useReducer` for fetch state** — atomic state transitions (`FETCH_START` → `FETCH_SUCCESS` / `FETCH_ERROR`) avoid impossible intermediate states (e.g. `loading: true` and `error: true` simultaneously). `dispatch()` is also lint-safe to call inside `useEffect`, unlike `useState` setters.
- **Reusable components** — `Button`, `Input`, `Select`, `Badge`, `Card`, `ErrorBanner`, `EmptyState`, and `ConfirmDialog` are shared across all features.

---

## AI Assistance

AI tools were used during development for implementation assistance, debugging, code review, and exploring UI and architecture options. The final implementation was reviewed, tested, and validated manually.

---

## Known Limitations

- **DummyJSON CRUD is non-persistent** — create, update, and delete operations are accepted by the API but do not permanently modify the remote dataset. Changes are reflected in the current session only; refreshing reloads the original DummyJSON data.
- **Search and category filtering are mutually exclusive** — a limitation of the DummyJSON API surface (no combined endpoint exists).
- **Token expiry** — DummyJSON tokens expire. The application handles 401 responses by clearing the stored session and redirecting to `/login`, but does not implement silent token refresh.

---

## Completed Requirements

- [x] Authentication (login, logout, token storage, protected routes)
- [x] Product listing (table + mobile cards)
- [x] Pagination (API limit/skip, page size 10/20/50, URL state)
- [x] Search with debounce (450 ms, URL state, resets page)
- [x] Race-condition protection (AbortController + cancelled flag)
- [x] Category filtering (dynamic, URL state)
- [x] Sorting by price / rating / title, asc / desc (URL state)
- [x] Product details (gallery, reviews, metadata)
- [x] Add product (form, validation, loading, error, duplicate-submit prevention)
- [x] Edit product (pre-populated form, update API, navigation)
- [x] Delete product (confirmation dialog, loading, error, UI mutation)
- [x] Form validation (all fields, per-field errors)
- [x] Responsive design (375 px – 1440 px)
- [x] Loading / error / empty states on all async operations
- [x] URL-persisted filters (refresh preserves state)
- [x] Invalid URL params normalised without crashing

---

## Scripts

```bash
npm run dev      # Start development server (Turbopack)
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint
```
