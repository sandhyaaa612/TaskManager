# Full-Stack Workflow Kanban

A beautifully crafted, responsive Full-Stack Kanban Task Manager built with **TypeScript**, **React 19**, **Vite**, **Express**, and **Tailwind CSS**.

🚀 **Live App URL:** [Open Development Workspace](https://ais-dev-rwqti7qm4catuwa56lzyan-420910988175.asia-southeast1.run.app)

---

## 🛠️ Architecture & Tech Stack

### Frontend Layer
- **UI Framework:** React 19 + TypeScript (configured for clean modular structure)
- **Styling Engery:** Tailwind CSS with fluid grid constraints and custom theme tokens (Inter for interface copy and JetBrains Mono for metadata)
- **Micro-Animations:** Framer Motion (`motion/react`) for smooth transitions on login forms, dialog actions, card movements, and floating toast notices
- **Icons Representation:** Feather icons via `lucide-react` for simple consistent visual design

### Backend Layer
- **Server Engine:** Node.js Express Server (`server.ts`) hosting REST API endpoints and asset-serving logic
- **Development Tooling:** Booted via `tsx` for high-fidelity native TypeScript execution in dev mode
- **Bundler Integration:** Compiled into a single, self-contained `dist/server.cjs` file with `esbuild`, resolving ESM/CommonJS path conflicts automatically on deployment

### Persistence Engine
- **Local JSON DB:** Atomic key-value record storage (`db.json`) maintaining users, tasks, and cryptographic sessions on disk
- **Robust Writes:** Implements atomic write verification by dumping changes onto a temporary staging file (`db.json.tmp`) and executing a POSIX `rename` swap to protect data against concurrent writing failures

---

## 🔐 Security & Auth Decisions

Rather than introducing heavy external authentication services or configuration-sensitive bcrypt packages, the application deploys core **Node.js Cryptographic API** primitives:
- **Lightweight Password Hashing:** Password strings are hashed using `PBKDF2` (Password-Based Key Derivation Function 2) with a unique, cryptographically strong salt per user, 1000 standard iterations, and `SHA-512` hashing.
- **Stateful Database-Backed Sessions:** Sessions are initiated by spinning a secure random string token (`sess_` prefix + 32 random bytes), storing the mapping inside `db.json` with a 7-day expiration duration, and verifying it via an Express `authenticate` middleware.
- **Cross-Session Persistence:** Client-side states store the session token in `localStorage` under `task_manager_auth_token` and verify it automatically on boot via a token healthcheck endpoint (`GET /api/auth/me`).

---

## 📋 Features & Specifications

1. **User Onboarding (Auth):** Fully custom Login & Register forms with field validations, error messaging, and automated sign-on on signup.
2. **Interactive Stage Kanban Board:**
   - Three distinct pipeline columns: **Todo (Backlog)**, **In Progress (Active)**, and **Done (Validated)**.
   - Stage indicators featuring custom colorization (Slate/Indigo/Emerald).
3. **Task Operations (CRUD):**
   - Create, edit, and delete task cards within fluid, accessible overlay modals.
   - Assign completion deadliness, priority parameters (**Low**, **Medium**, **High**), and detailed context descriptions.
4. **Fluid Workflow Shifts:** Standard arrow shift triggers inside task cards let users promote/demote tasks instantly across columns. Provides smooth UX on desktop and touch-screens (where traditional drag-and-drop behaves unreliably).
5. **Real-Time Client Queries:**
   - Instantly filter column views by selecting distinct Priority tags.
   - Text match searchbar matching keywords in titles and descriptions.
   - Four sorting pathways: **Newest First**, **Oldest First**, **High Priority**, and **Due Date**.
6. **Toast Action Messaging:** Non-blocking floating success/warning/info toasts that fade out after 5 seconds.
7. **Overdue Safeguards:** Highlight dates in Rose red if a pending task exceeds the current calendar date.

---

## ⚙️ Project Launch & Production

### 1. Initialize Dependencies
```bash
npm install
```

### 2. Launch Local Dev Workspace
```bash
npm run dev
```
Starts Express on port `3000` with the Vite dev middleware mounted. Go to `http://localhost:3000`.

### 3. Build & Package Production Files
```bash
npm run build
```
Generates front-end assets in `/dist` and compiles/bundles the Express backend into `dist/server.cjs`.

### 4. Boot Production Release
```bash
npm run start
```
Runs the self-contained backend file and serves compiled bundle files on host `0.0.0.0:3000`.

---

## ⚖️ Technical Assumptions & Trade-offs

1. **Portable file-system DB (`db.json`):**
   - *Trade-off:* In a high-traffic or distributed cloud hosting setting, write-lock contentions might occur.
   - *Decision:* For a single-threaded serverless container deployment like Cloud Run or Vercel Serverless, local JSON storage is extremely responsive, reliable, zero-maintenance, and fully sufficient. It avoids setting up external database instances while remaining 100% compliant with portable submission requirements.
2. **Native Cryptography over Custom Binary Packages:**
   - *Decision:* Chose built-in Node `crypto` algorithms over npm native `bcrypt` binaries to eliminate dependency compilations that often crash on server distributions like Vercel or Alpine.
3. **Button-Based Stage Movement:**
   - *Trade-off:* Drag-and-drop provides direct visual layout control but can introduce substantial dependencies and clunky touch responses on mobile screens.
   - *Decision:* Chose instant button clicks for stage movement. Highly ergonomic on touch interfaces, responsive, and lightweight.
