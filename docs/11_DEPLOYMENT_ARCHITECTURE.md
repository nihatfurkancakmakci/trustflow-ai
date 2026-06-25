# Deployment Architecture

## 1. Overview
The infrastructure is designed for high availability, low maintenance, and easy scaling.

## 2. Infrastructure Stack
- **Frontend**: Vercel (Next.js)
- **Backend**: Railway (NestJS Docker container)
- **Database**: Railway (PostgreSQL)
- **Blockchain RPC**: Stellar Horizon / Soroban RPC (Public nodes or QuickNode)

## 3. CI/CD Pipeline
- **Repository**: GitHub
- **Frontend Deployment**: Automatic Vercel deployment on push to `main`.
- **Backend Deployment**: Automatic Railway deployment via Dockerfile on push to `main`.
- **Environment Variables**: Managed securely via Vercel and Railway dashboards.

## 4. Network Diagram
```text
[ Internet User ]
      |
[ Vercel Edge Network ] ---> [ Next.js Frontend ]
      |
[ Railway Private Network ]
      | ---> [ NestJS Backend ]
      | ---> [ PostgreSQL Database ]
      
[ NestJS Backend ] ---> [ External: Gemini / Groq API ]
[ NestJS Backend ] ---> [ External: Stellar RPC ]
```

## 5. Monitoring & Logging
- **Application Logs**: Sentry for error tracking.
- **Server Logs**: Railway native logging.
- **Analytics**: Vercel Analytics for frontend performance.
