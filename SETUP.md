# Kontext - Setup Guide

## Fixed Issues

### 1. Zod v4 Validator Fix
**Problem**: The validators were using `.trim().optional()` which doesn't work properly in Zod v4 when the value is undefined.

**Solution**: Changed to use `z.preprocess()` to safely trim strings before validation:
```typescript
z.preprocess(
  (val) => typeof val === 'string' ? val.trim() : val,
  z.string().optional()
)
```

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (Neon cloud DB is already configured in `.env`)

### Server Setup

1. **Navigate to server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run database migrations**:
   ```bash
   npx prisma migrate deploy
   ```

4. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

5. **Seed the database** (optional, creates demo data):
   ```bash
   npx ts-node prisma/seed.ts
   ```

6. **Start the server**:
   ```bash
   npm run dev
   ```

   Server will run on `http://localhost:3001`

### Client Setup

1. **Navigate to client directory**:
   ```bash
   cd client
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

   Client will run on `http://localhost:5173` (or similar)

## Testing the Fix

### Test Create Project Endpoint

1. Make sure server is running
2. Test with curl:
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Project\",\"description\":\"A test\",\"teamSize\":\"1-5\"}"
```

Expected response:
```json
{
  "data": {
    "id": "...",
    "name": "Test Project"
  },
  "message": "Project created",
  "error": null,
  "requestId": "..."
}
```

### Test from UI

1. Open the client in browser
2. Click "Create Project"
3. Fill in:
   - Project Name: "My First Project"
   - Description: "Testing the fix"
   - Team Size: "1-5"
4. Click "Create Project"
5. Should redirect to dashboard successfully

## Common Issues

### Database Connection Error
If you see `Database unavailable`, check:
- DATABASE_URL in `.env` is correct
- Run `npx prisma migrate deploy`

### Validation Error "Project name is required"
Fixed! This was the main bug - Zod v4 validators are now corrected.

### TypeScript Errors
Run: `npx tsc --noEmit` to check for compilation errors

## Architecture

- **Server**: Express + TypeScript + Prisma + PostgreSQL
- **Client**: React + TypeScript + Vite + TailwindCSS
- **Validation**: Zod v4
- **Database**: PostgreSQL (Neon cloud)
