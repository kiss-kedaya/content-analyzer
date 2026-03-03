@echo off
REM Content Analyzer - Vercel Deployment Script
REM Usage: deploy.cmd [DATABASE_URL]

echo ========================================
echo Content Analyzer - Vercel Deployment
echo ========================================
echo.

if "%1"=="" (
    echo Error: DATABASE_URL is required
    echo Usage: deploy.cmd "postgresql://..."
    exit /b 1
)

set "DATABASE_URL=%~1"

echo [1/5] Checking Vercel CLI...
where vercel >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Vercel CLI not found
    echo Please install: npm install -g vercel
    exit /b 1
)

echo [2/5] Deploying to Vercel...
vercel --prod --yes

echo.
echo [3/5] Setting environment variable...
vercel env add DATABASE_URL production

echo.
echo [4/5] Initializing database...
echo DATABASE_URL=%DATABASE_URL%> .env
npx prisma generate
npx prisma db push --accept-data-loss

echo.
echo [5/5] Deployment complete!
echo.
echo ========================================
echo Next steps:
echo 1. Visit your Vercel dashboard
echo 2. Test the API endpoints
echo 3. Upload content via OpenClaw Agent
echo ========================================
