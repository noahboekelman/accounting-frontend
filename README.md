This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, set up your environment variables:

```bash
# Copy the example environment file
cp .env.local.example .env.local

# Edit .env.local and set your backend API URL
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

### Authentication
- **Modern Login Page**: Beautiful dark-themed login page with gradient effects
- **JWT Authentication**: Secure JWT-based authentication with access and refresh tokens
- **Auto Token Refresh**: Automatic token refresh on 401 responses via HTTP interceptor
- **Protected Routes**: Authentication context for managing user state across the app

### HTTP Client
The app includes a robust HTTP client (`src/lib/httpClient.ts`) with:
- Automatic token management (access and refresh tokens)
- 401 interceptor that automatically refreshes tokens
- Retry logic for failed requests after token refresh
- Type-safe API calls with TypeScript

### Architecture
```
src/
├── app/
│   ├── login/          # Login page with dark theme
│   └── page.tsx        # Home page with auth check
├── lib/
│   ├── httpClient.ts   # HTTP client with token refresh
│   ├── auth/
│   │   └── AuthContext.tsx  # Auth state management
│   └── types/
│       └── auth.ts     # TypeScript types for auth
```

## API Integration

The app integrates with the backend API defined in `backend_openapi.json`. Key endpoints:
- `POST /auth/login` - Login with username/password
- `POST /auth/refresh` - Refresh access token
- `POST /auth/fresh-login` - Get fresh token for sensitive operations

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
