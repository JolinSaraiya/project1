# Walkthrough - Green-Tax App (v1.0)

Congratulations! The **Green-Tax Compliance App** is fully built and ready for deployment.

## Key Features

### 1. Role-Based Access Control (RBAC)
-   **User Portal** (`/login`): For Society Secretaries to register and upload evidence.
-   **Admin Portal** (`/admin-login`): Secure access for Municipal Staff.
-   **Verification Workflow**: Users cannot upload until their Society is "Verified" by an Admin.

### 2. Anti-Cheat & Fraud Prevention 🛡️
-   **Geo-Fencing**: Uploads are rejected if the user is >50 meters away from the Society's registered location.
-   **EXIF Metadata Analysis**:
    -   Extracts hidden `DateTimeOriginal` from photos.
    -   **Rejects** photos taken more than **2 hours ago**.
    -   Prevents gallery uploads of old evidence.

### 3. Tax Automation 💰
-   **Approval Logic**: When an admin verifies a photo, the Society's tax bill is **automatically reduced by 5%**.
-   **Real-time Updates**: The dashboard reflects the new tax amount immediately.

### 4. Modern UI & Experience 🎨
-   **Liquid Glass Theme (iOS 26)**: A futuristic aesthetic featuring glassmorphism, animated blobs, and translucent layers.
-   **Login Specifics**: **"Cosmic Glass"** theme with Indigo/Fuchsia/Sky gradients for a deep space vibe.
-   **Dynamic Backgrounds**: Fluid, multi-gradient backgrounds (`liquid-bg`) that create a immersive depth.
-   **Interaction Design**: Hover glows, blurred backdrops, and smooth transitions on all interactive elements.
-   **Mobile-First**: Optimized touch targets and responsive layouts for Secretary's primary device.

### 5. Backend Hardening 🛡️
-   **Auth Standardization**: Strict Email/Password authentication for all roles (Magic Links removed).
-   **Database Triggers**: Automatic profile creation on signup via PL/pgSQL function (`handle_new_user`).
-   **Robust SQL Scripts**: `disable_triggers.sql` (Recommended Fix), `reset_and_fix_auth.sql`, `backend_hardening.sql`, `fix_schema.sql`, and `create_user_safe.js` provided for maintenance.
-   **Client-Side Failover**: `Login.jsx` now handles profile creation directly to bypass potential database trigger failures.

---

## How to Test the Full Flow

### Step 1: Supabase Configuration (Critical ⚡)
1.  Go to **Authentication -> Providers -> Email** in your Supabase Dashboard.
2.  **Disable** "Confirm email" (Toggle OFF).
3.  This prevents "Error sending confirmation email" and allows instant login.

### Step 2: Admin Setup (One-time)
1.  Run the SQL script `make_admin.sql` to promote your email to Admin.
2.  Login at `/admin-login`.

### Step 2: User Registration (Society Secretary)
1.  Open an Incognito window or use your phone (`http://<YOUR_IP>:5173`).
2.  **Sign Up** as a new user.
3.  **Register a Society**: "Green Heights".
4.  *Notice*: You cannot upload yet (Status: "Pending Verification").

### Step 3: Admin Verification
1.  Go back to your **Admin Dashboard**.
2.  See "Green Heights" in the **Society Registrations** list.
3.  Click **"Verify"**.

### Step 4: Evidence Upload (User)
1.  Refresh the User Dashboard.
2.  See the **"Verified"** badge and "📸 Upload Evidence" button.
3.  **Try to Cheat**: Upload an old photo -> **Rejected**.
4.  **Do it Right**: Take a fresh photo -> **Accepted**.

### Step 5: Final Approval (Admin)
1.  Admin sees the new upload in "Evidence Verification Queue".
2.  Click **"Approve"**.
3.  Tax amount drops by 5%!

## Deployment
You can deploy this app easily for free using:
-   **Frontend**: Vercel or Netlify (Drag and drop the `client/dist` folder after running `npm run build`).
-   **Backend**: Render or Railway (Connect your GitHub repo).
-   **Database**: Already hosted on Supabase! 🚀
