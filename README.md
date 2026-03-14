# Madrasah App 🏫

A modern, fast, and scalable school management system designed to make recording student attendance, inputting grades, and generating teacher reports effortless. 

This application consists of a high-performance **Frontend** powered by React & Vite and a Serverless **Backend API** powered by Hono on Cloudflare Workers, integrated with a serverless PostgreSQL database (Neon).

---

## 🚀 Key Features

### 1. Multi-Tenant Architecture
This application supports multiple schools (tenants) securely from a single central codebase and database.
- Schools log in securely via a unique slug/URL which sets their Context.
- Prevents cross-school data leaking without spinning up separate servers for each.

### 2. Intelligent Data Caching (Offline-Resilient UI)
The frontend uses `localStorage` aggressively to cache options (Classes, Subjects, Exams) and student data. 
- Fast initial load: Returns to the previous state instantly.
- Saves database bandwidth by intelligently bypassing API calls when data hasn't dynamically changed.

### 3. Integrated Google Authentication (OAuth)
The app leverages Google Identity Services directly on the frontend for seamless, robust authentication, ensuring only authorized teachers can make changes.

### 4. Client-Side PDF Generation (Slip Guru)
The Teacher Reporting system ("Slip Guru") handles all logic asynchronously in-browser:
- Generates beautiful PDFs based strictly off specific date ranges using `jsPDF` completely independent of server calculation overhead.
- Generates data-tight tabular CSV files purely in vanilla Javascript. 

### 5. Efficient Bulk Data Processing
Teachers don't need to insert rows one by one. The `saveAbsensi` and `saveNilai` endpoints process array payloads so entire classroom updates are processed efficiently in a single, fast SQL Transactions block using `@neondatabase/serverless` connection pooling.

---

## 🛠 Technology Stack

### Frontend Stack:
- **[React 18](https://react.dev/)**: Component-based UI library for building interactive user interfaces.
- **[Vite](https://vitejs.dev/)**: Next-generation frontend tooling for ultra-fast development and optimized production builds.
- **[Tailwind CSS](https://tailwindcss.com/)**: Fast UI component styling with custom responsive pallets and micro-animations.
- **Lucide & FontAwesome Icons**: For beautiful aesthetic visual queues.

### Backend Stack:
- **[Hono](https://hono.dev/)**: Ultrafast, lightweight, edge-optimized routing framework built natively for serverless environments.
- **[Cloudflare Workers](https://workers.cloudflare.com/)**: Providing zero cold starts and unparalleled massive global CDN reliability.
- **[Neon DB](https://neon.tech/)**: Serverless Postgres using WebSockets for incredibly fast, stateless database queries.

---

## 🚢 Deployment Guide (Cloudflare Pages & Workers)

Because this platform uses a precise Serverless model, the **Frontend** goes to CF Pages, and the **API** goes to CF Workers. 

### Step 1: Deploy Backend (API to Cloudflare Workers)
The API runs entirely as an Edge Worker.

1. Navigate to the API folder:
   ```bash
   cd api
   npm install
   ```
2. Make sure your `wrangler.toml` has your production Neon database URL mapped properly.
3. Deploy to Cloudflare Workers using Wrangler:
   ```bash
   npm run deploy
   # or
   npx wrangler deploy
   ```
   *Take note of the Worker URL provided (e.g. `https://madrasah-api.your-username.workers.dev`).*

### Step 2: Deploy Frontend (to Cloudflare Pages)

1. Navigate back to the root folder:
   ```bash
   cd ..
   npm install
   ```
2. Create or update your `.env` file mapped to the API you just deployed:
   ```env
   VITE_API_URL=https://madrasah-api.your-username.workers.dev
   VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   VITE_API_SECRET=your-secret-token
   ```
3. Build the purely static production build:
   ```bash
   npm run build
   ```
   *The optimized assets will be pushed to the `dist/` directory.*
4. Deploy the `dist` footprint to Cloudflare Pages directly using Wrangler:
   ```bash
   npx wrangler pages deploy dist --project-name="madrasah-app"
   ```
   *(Alternatively, you can seamlessly connect this Git Repository straight to Cloudflare Dashboard > Pages and tell it to auto-deploy the framework "React/Vite" every time you push to Github!)*

---

This piece serves as a clear demonstration of Edge-computing architecture, modern React component optimization practices, and cost-effective multi-tenant structural patterns.
