# Task: React + Node + Supabase App

## Phase 1: Foundation & Authentication (Completed)
- [x] Initialize Project Structure <!-- id: 0 -->
    - [x] Create `server` directory and initialize Node.js <!-- id: 1 -->
    - [x] Create `client` directory with Vite + React <!-- id: 2 -->
- [x] Setup Backend (Node/Express) <!-- id: 3 -->
    - [x] Install backend dependencies <!-- id: 4 -->
    - [x] Create basic API endpoint <!-- id: 5 -->
- [x] Authentication (Supabase) <!-- id: 10 -->
    - [x] Configure Supabase Client <!-- id: 12 -->
    - [x] Create Login/Signup UI <!-- id: 7 -->
    - [x] Implement Auth Logic (`Login.jsx`, `App.jsx`) <!-- id: 13 -->
    - [x] Debug & Fix 504 Error (Switched to Password Auth) <!-- id: 16 -->

## Phase 2: Green-Tax Compliance (Completed)
- [x] Database Setup <!-- id: 20 -->
    - [x] Create `.env` for Environment Variables <!-- id: 24 -->
    - [x] Execution of SQL Schema (User Action Required) <!-- id: 25 -->
- [x] Build Frontend UI <!-- id: 23 -->
    - [x] Dashboard for Society Secretary <!-- id: 28 -->
    - [x] Implement Client-Side Routing (`react-router-dom`) <!-- id: 30 -->

## Phase 3: Frontend Development (Completed)
- [x] Society Upload Feature <!-- id: 31 -->
    - [x] Create `Upload.jsx` with Camera/File Input <!-- id: 32 -->
    - [x] Implement Browser Geolocation <!-- id: 33 -->
    - [x] Implement Supabase Storage Upload (`compost-evidence`) <!-- id: 34 -->
    - [x] Save Metadata to `compost_logs` <!-- id: 35 -->
- [x] Admin Verification Dashboard <!-- id: 36 -->
    - [x] Create `AdminDashboard.jsx` <!-- id: 37 -->
    - [x] Fetch `compost_logs` joined with `societies` <!-- id: 38 -->
    - [x] Implement Approve/Reject Logic <!-- id: 39 -->

## Phase 4: Logic Implementation (Completed)
- [x] Geo-Fencing (Verification) <!-- id: 40 -->
    - [x] Implement Haversine Formula in `Upload.jsx` <!-- id: 41 -->
    - [x] Validate User Location vs Society Location (< 50m) <!-- id: 42 -->
    - [x] Disable Upload if too far <!-- id: 43 -->
- [x] Tax Calculation <!-- id: 44 -->
    - [x] Update `AdminDashboard.jsx` logic <!-- id: 45 -->
    - [x] Reduce Society Tax by 5% on Approval <!-- id: 46 -->

## Phase 5: UI Redesign & Polish (Tailwind CSS)
- [x] Install & Configure Tailwind CSS <!-- id: 50 -->
    - [x] Initial Setup <!-- id: 58 -->
    - [x] Fix PostCSS Plugin Error (`@tailwindcss/postcss`) <!-- id: 59 -->
- [x] Refactor Components to Tailwind <!-- id: 51 -->
    - [x] `Login.jsx` <!-- id: 52 -->
    - [x] `Dashboard.jsx` (Society Secretary) <!-- id: 53 -->
    - [x] `Upload.jsx` <!-- id: 54 -->
    - [x] `AdminDashboard.jsx` <!-- id: 55 -->
- [x] Society Options (Seeding) <!-- id: 56 -->
    - [x] Add "Seed Societies" button or script <!-- id: 57 -->

## Phase 6: Role-Based Access & Strict Verification (Completed)
- [x] Database Schema updates <!-- id: 60 -->
    - [x] Create `profiles` table (Roles) <!-- id: 61 -->
    - [x] Update `societies` table (`user_id`, `is_verified`) <!-- id: 62 -->
- [x] Separate Logins <!-- id: 63 -->
    - [x] Create `AdminLogin.jsx` <!-- id: 64 -->
    - [x] Update Routing for separate logins <!-- id: 65 -->
- [x] Society Verification Workflow <!-- id: 66 -->
    - [x] Admin: Add "Verify Societies" section <!-- id: 67 -->
    - [x] User: Restrict Uploads until Society Verified <!-- id: 68 -->
    - [x] User: Link Society to Creator (`user_id`) <!-- id: 69 -->

## Phase 7: Anti-Cheat Hardening (EXIF) (Completed)
- [x] Install `exif-js` <!-- id: 70 -->
- [x] Implement EXIF checks in `Upload.jsx` <!-- id: 71 -->
    - [x] Extract `DateTimeOriginal` <!-- id: 72 -->
    - [x] Reject if > 2 hours old <!-- id: 73 -->
    - [x] (Optional) Validate EXIF GPS vs Current Location <!-- id: 74 -->

## Phase 8: "Liquid Glass" UI Redesign (Completed)
- [x] Create Global Glass Utilities (`index.css`) <!-- id: 80 -->
- [x] Redesign `Login.jsx` (Glass Card, Animated Background) <!-- id: 81 -->
- [x] Redesign `Dashboard.jsx` (Floating Cards, Translucent Headers) <!-- id: 82 -->
- [x] Redesign `Upload.jsx` (Modern Form Elements) <!-- id: 83 -->
- [x] Redesign `AdminDashboard.jsx` (Data Tables in Glass) <!-- id: 84 -->

## Phase 9: Backend & Database Hardening (Completed)
- [x] Create Database Trigger for Automatic Profile Creation <!-- id: 90 -->
- [x] Verify Server Connectivity <!-- id: 91 -->
- [ ] Final Deployment Prep <!-- id: 92 -->

## Phase 10: Running Locally
- [x] Verify Servers Running <!-- id: 100 -->
    - [x] Backend (Port 5000) <!-- id: 101 -->
    - [x] Frontend (Port 5174) <!-- id: 102 -->
