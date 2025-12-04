# InboxHunter Dashboard

Next.js 14 frontend for the InboxHunter platform.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Components:** Radix UI

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:3000
```

## Scripts

```bash
npm run dev       # Development with hot reload
npm run build     # Build for production
npm run start     # Run production build
npm run lint      # Run linter
```

## Project Structure

```
src/
├── app/                    # App Router pages
│   ├── (auth)/             # Auth pages (login, signup)
│   ├── (dashboard)/        # Dashboard pages
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── globals.css         # Global styles
├── lib/
│   ├── api.ts              # API client
│   ├── store.ts            # Zustand store
│   └── utils.ts            # Utilities
└── components/             # Shared components
```

## Environment Variables

Create `.env.local` or use parent `.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Docker

```bash
# Build image
docker build -t inboxhunter-web .

# Run container
docker run -p 3000:3000 inboxhunter-web
```

## Deployment

### AWS Amplify

1. Connect GitHub repo to Amplify
2. Set root directory to `frontend`
3. Add environment variable: `NEXT_PUBLIC_API_URL`
4. Deploy!

### Docker

The Dockerfile uses Next.js standalone output for minimal image size.

