# InboxHunter AWS Deployment Guide

Complete step-by-step guide to deploy InboxHunter on AWS using the AWS Console (UI).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS SETUP                                │
└─────────────────────────────────────────────────────────────────┘

    Users                     Agent Desktop App
      │                              │
      ▼                              ▼
┌───────────────┐            ┌───────────────┐
│   Amplify     │            │      S3       │
│  (Frontend)   │            │  (Downloads)  │
│  Next.js App  │            │  Screenshots  │
└───────┬───────┘            └───────────────┘
        │
        │ API calls
        ▼
┌───────────────┐
│     EC2       │
│  ┌─────────┐  │
│  │ Backend │  │
│  │ Node.js │  │
│  └────┬────┘  │
│       │       │
│  ┌────▼────┐  │
│  │PostgreSQL│ │
│  │   DB    │  │
│  └─────────┘  │
└───────────────┘
```

## Prerequisites

- AWS Account (create at https://aws.amazon.com)
- Credit card for AWS billing
- Your domain name (optional but recommended)
- GitHub account with repos pushed

## Estimated Costs

| Service | Specification | Monthly Cost |
|---------|--------------|--------------|
| EC2 | t3.small (2 vCPU, 2GB RAM) | ~$15 |
| EBS | 30GB SSD storage | ~$3 |
| Amplify | Build minutes + hosting | ~$0-5 |
| S3 | 10GB storage + transfer | ~$1-2 |
| **Total** | | **~$20-25/month** |

---

## Part 1: Set Up EC2 Instance (Backend + Database)

### Step 1.1: Launch EC2 Instance

1. **Go to EC2 Dashboard**
   - Log in to AWS Console: https://console.aws.amazon.com
   - Search for "EC2" in the top search bar
   - Click "EC2" to open the dashboard

2. **Click "Launch Instance"**
   - Click the orange "Launch instance" button

3. **Configure Instance:**

   **Name and tags:**
   ```
   Name: inboxhunter-server
   ```

   **Application and OS Images:**
   - Select "Ubuntu"
   - Choose "Ubuntu Server 22.04 LTS (HVM), SSD Volume Type"
   - Architecture: 64-bit (x86)

   **Instance type:**
   - Select `t3.small` (2 vCPU, 2 GB Memory)
   - For testing, you can use `t3.micro` (free tier eligible)

   **Key pair (login):**
   - Click "Create new key pair"
   - Name: `inboxhunter-key`
   - Key pair type: RSA
   - Private key format: .pem (for Mac/Linux) or .ppk (for Windows/PuTTY)
   - Click "Create key pair" - **SAVE THIS FILE SECURELY!**

   **Network settings:**
   - Click "Edit"
   - VPC: (leave default)
   - Subnet: (leave default)
   - Auto-assign public IP: **Enable**
   - Firewall (security groups): **Create security group**
   - Security group name: `inboxhunter-sg`
   
   **Add the following rules:**
   
   | Type | Port | Source | Description |
   |------|------|--------|-------------|
   | SSH | 22 | My IP | SSH access |
   | HTTP | 80 | 0.0.0.0/0 | HTTP traffic |
   | HTTPS | 443 | 0.0.0.0/0 | HTTPS traffic |
   | Custom TCP | 3001 | 0.0.0.0/0 | Backend API |

   **Configure storage:**
   - Size: `30` GiB
   - Volume type: gp3

4. **Launch Instance**
   - Review summary on the right
   - Click "Launch instance"
   - Wait for instance to start (2-3 minutes)

5. **Note Your Instance Details**
   - Go to EC2 → Instances
   - Click on your instance
   - Note the **Public IPv4 address** (e.g., `54.123.45.67`)
   - Note the **Public IPv4 DNS** (e.g., `ec2-54-123-45-67.compute-1.amazonaws.com`)

---

### Step 1.2: Connect to EC2 and Install Dependencies

1. **Connect via SSH**

   **Mac/Linux:**
   ```bash
   # Set permissions on key file
   chmod 400 ~/Downloads/inboxhunter-key.pem
   
   # Connect to EC2
   ssh -i ~/Downloads/inboxhunter-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
   ```

   **Windows (PowerShell):**
   ```powershell
   ssh -i C:\Users\YourName\Downloads\inboxhunter-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
   ```

2. **Update System**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Install Node.js 18**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Verify installation
   node --version  # Should show v18.x.x
   npm --version   # Should show 9.x.x or 10.x.x
   ```

4. **Install PostgreSQL**
   ```bash
   sudo apt install -y postgresql postgresql-contrib
   
   # Start PostgreSQL
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   
   # Verify it's running
   sudo systemctl status postgresql
   ```

5. **Configure PostgreSQL**
   ```bash
   # Switch to postgres user
   sudo -u postgres psql
   ```
   
   In the PostgreSQL prompt:
   ```sql
   -- Create database
   CREATE DATABASE inboxhunter;
   
   -- Create user with password
   CREATE USER inboxhunter_user WITH ENCRYPTED PASSWORD 'YourSecurePassword123!';
   
   -- Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE inboxhunter TO inboxhunter_user;
   
   -- Exit
   \q
   ```

6. **Install PM2 (Process Manager)**
   ```bash
   sudo npm install -g pm2
   ```

7. **Install Git**
   ```bash
   sudo apt install -y git
   ```

---

### Step 1.3: Deploy Backend

1. **Clone Your Repository**
   ```bash
   cd ~
   git clone https://github.com/YOUR_USERNAME/inboxhunter-platform.git
   cd inboxhunter-platform/backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Create Environment File**
   ```bash
   nano .env
   ```
   
   Add the following (replace values):
   ```env
   NODE_ENV=production
   PORT=3001
   HOST=0.0.0.0
   
   # Database - PostgreSQL on same server
   DATABASE_URL="postgresql://inboxhunter_user:YourSecurePassword123!@localhost:5432/inboxhunter"
   
   # JWT Secret - generate a random string
   JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
   JWT_EXPIRES_IN="7d"
   
   # CORS - will update after Amplify deploy
   CORS_ORIGIN="https://your-amplify-domain.amplifyapp.com"
   
   # Agent token expiry
   AGENT_TOKEN_EXPIRES_IN="30d"
   ```
   
   Save: `Ctrl+O`, `Enter`, `Ctrl+X`

4. **Generate Prisma Client & Run Migrations**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

5. **Build the Application**
   ```bash
   npm run build
   ```

6. **Start with PM2**
   ```bash
   pm2 start dist/index.js --name "inboxhunter-api"
   
   # Save PM2 configuration
   pm2 save
   
   # Setup PM2 to start on boot
   pm2 startup
   # Run the command it outputs
   ```

7. **Verify Backend is Running**
   ```bash
   # Check PM2 status
   pm2 status
   
   # Check logs
   pm2 logs inboxhunter-api
   
   # Test API
   curl http://localhost:3001/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

8. **Test from Browser**
   - Open: `http://YOUR_EC2_PUBLIC_IP:3001/health`
   - Should see JSON response

---

### Step 1.4: Set Up Nginx (Reverse Proxy + SSL)

1. **Install Nginx**
   ```bash
   sudo apt install -y nginx
   ```

2. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/inboxhunter
   ```
   
   Add:
   ```nginx
   server {
       listen 80;
       server_name YOUR_EC2_PUBLIC_IP;  # Or your domain: api.inboxhunter.io
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
           
           # WebSocket support
           proxy_read_timeout 86400;
       }
   }
   ```

3. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/inboxhunter /etc/nginx/sites-enabled/
   sudo nginx -t  # Test configuration
   sudo systemctl restart nginx
   ```

4. **Test Through Nginx**
   - Open: `http://YOUR_EC2_PUBLIC_IP/health`
   - Should work without port number now

---

## Part 2: Set Up S3 Bucket (Screenshots + Downloads)

### Step 2.1: Create S3 Bucket

1. **Go to S3 Dashboard**
   - Search for "S3" in AWS Console
   - Click "Create bucket"

2. **Configure Bucket:**
   
   **General configuration:**
   - Bucket name: `inboxhunter-storage` (must be globally unique, add random suffix if needed)
   - AWS Region: Same as your EC2 (e.g., us-east-1)

   **Object Ownership:**
   - Select "ACLs disabled (recommended)"

   **Block Public Access settings:**
   - **Uncheck** "Block all public access"
   - Check the acknowledgment box

   **Bucket Versioning:**
   - Disable (optional, enable for production)

   **Default encryption:**
   - Server-side encryption: Enable
   - Encryption type: Amazon S3 managed keys (SSE-S3)

3. **Click "Create bucket"**

### Step 2.2: Configure Bucket Policy (for public downloads)

1. **Go to your bucket** → **Permissions** tab

2. **Edit Bucket Policy** → Add:
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Sid": "PublicReadForDownloads",
               "Effect": "Allow",
               "Principal": "*",
               "Action": "s3:GetObject",
               "Resource": "arn:aws:s3:::inboxhunter-storage/downloads/*"
           },
           {
               "Sid": "PublicReadForScreenshots",
               "Effect": "Allow",
               "Principal": "*",
               "Action": "s3:GetObject",
               "Resource": "arn:aws:s3:::inboxhunter-storage/screenshots/*"
           }
       ]
   }
   ```

### Step 2.3: Configure CORS (for frontend uploads)

1. **Go to bucket** → **Permissions** → **CORS configuration**

2. **Add:**
   ```json
   [
       {
           "AllowedHeaders": ["*"],
           "AllowedMethods": ["GET", "PUT", "POST"],
           "AllowedOrigins": ["https://your-amplify-domain.amplifyapp.com", "http://localhost:3000"],
           "ExposeHeaders": ["ETag"]
       }
   ]
   ```

### Step 2.4: Create Folder Structure

1. **In your bucket, create folders:**
   - `downloads/` - For agent installers
   - `downloads/v2.0.0/` - Version-specific releases
   - `screenshots/` - For error screenshots
   - `uploads/` - For user uploads

2. **Upload test file:**
   - Click on `downloads/` folder
   - Click "Upload"
   - Add a test file
   - Click "Upload"

3. **Get Public URL:**
   - Click on uploaded file
   - Copy "Object URL"
   - Test in browser - should be accessible

---

## Part 3: Deploy Frontend to Amplify

### Step 3.1: Create Amplify App

1. **Go to AWS Amplify**
   - Search for "Amplify" in AWS Console
   - Click "AWS Amplify"

2. **Click "Create new app"**

3. **Select "Host web app"**

4. **Choose Source:**
   - Select "GitHub"
   - Click "Continue"
   - Authorize AWS Amplify to access your GitHub

5. **Select Repository:**
   - Repository: `inboxhunter-platform`
   - Branch: `main`
   - Click "Next"

6. **Configure Build Settings:**
   
   **App name:** `inboxhunter-web`
   
   **Build and test settings:**
   - Check "My app is a monorepo"
   - Monorepo root directory: `frontend`
   
   **Build settings** (should auto-detect, or use):
   ```yaml
   version: 1
   applications:
     - frontend:
         phases:
           preBuild:
             commands:
               - npm ci
           build:
             commands:
               - npm run build
         artifacts:
           baseDirectory: .next
           files:
             - '**/*'
         cache:
           paths:
             - node_modules/**/*
             - .next/cache/**/*
       appRoot: frontend
   ```

7. **Environment Variables:**
   Click "Advanced settings" → "Environment variables" → Add:
   
   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | `http://YOUR_EC2_PUBLIC_IP` |
   
   (Update to HTTPS domain later)

8. **Click "Next"** → **"Save and deploy"**

9. **Wait for Deployment**
   - First build takes 5-10 minutes
   - Watch the build logs for any errors

10. **Get Your Amplify URL**
    - After successful deploy, note the URL
    - Example: `https://main.d1234abcd.amplifyapp.com`

### Step 3.2: Update Backend CORS

1. **SSH back into EC2:**
   ```bash
   ssh -i ~/Downloads/inboxhunter-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
   ```

2. **Update .env:**
   ```bash
   cd ~/inboxhunter-platform/backend
   nano .env
   ```
   
   Update CORS_ORIGIN:
   ```env
   CORS_ORIGIN="https://main.d1234abcd.amplifyapp.com"
   ```

3. **Restart Backend:**
   ```bash
   pm2 restart inboxhunter-api
   ```

### Step 3.3: Test the Application

1. **Open Amplify URL** in browser
2. **Create account** on signup page
3. **Login** and verify dashboard loads
4. **Check browser console** for any API errors

---

## Part 4: Create IAM User for S3 Access (Backend)

### Step 4.1: Create IAM Policy

1. **Go to IAM** → **Policies** → **Create policy**

2. **JSON tab:**
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Action": [
                   "s3:PutObject",
                   "s3:GetObject",
                   "s3:DeleteObject",
                   "s3:ListBucket"
               ],
               "Resource": [
                   "arn:aws:s3:::inboxhunter-storage",
                   "arn:aws:s3:::inboxhunter-storage/*"
               ]
           }
       ]
   }
   ```

3. **Name:** `InboxHunterS3Access`
4. **Create policy**

### Step 4.2: Create IAM User

1. **Go to IAM** → **Users** → **Create user**

2. **User name:** `inboxhunter-backend`

3. **Permissions:**
   - Select "Attach policies directly"
   - Search and select `InboxHunterS3Access`

4. **Create user**

5. **Create Access Key:**
   - Click on the user
   - "Security credentials" tab
   - "Create access key"
   - Use case: "Application running on AWS compute service"
   - Create and **save the Access Key ID and Secret Access Key**

### Step 4.3: Update Backend Environment

```bash
# SSH into EC2
nano ~/inboxhunter-platform/backend/.env
```

Add:
```env
# AWS S3
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
S3_BUCKET="inboxhunter-storage"
```

Restart:
```bash
pm2 restart inboxhunter-api
```

---

## Part 5: Set Up Custom Domain (Optional)

### Step 5.1: For Frontend (Amplify)

1. **Go to Amplify** → Your app → **Domain management**
2. **Click "Add domain"**
3. **Enter your domain:** `inboxhunter.io`
4. **Configure subdomains:**
   - `inboxhunter.io` → main branch
   - `www.inboxhunter.io` → redirect to root
5. **Update DNS** at your domain registrar with provided CNAME records

### Step 5.2: For Backend (EC2)

1. **Point subdomain to EC2:**
   - Add A record: `api.inboxhunter.io` → EC2 Public IP

2. **Install Certbot for SSL:**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d api.inboxhunter.io
   ```

3. **Update Nginx config** with your domain

4. **Update Backend CORS:**
   ```env
   CORS_ORIGIN="https://inboxhunter.io"
   ```

5. **Update Frontend env** in Amplify:
   ```
   NEXT_PUBLIC_API_URL=https://api.inboxhunter.io
   ```

---

## Part 6: Maintenance Commands

### Backend Management

```bash
# SSH into server
ssh -i ~/Downloads/inboxhunter-key.pem ubuntu@YOUR_EC2_IP

# View logs
pm2 logs inboxhunter-api

# Restart backend
pm2 restart inboxhunter-api

# Update backend code
cd ~/inboxhunter-platform
git pull origin main
cd backend
npm install
npm run build
npx prisma migrate deploy
pm2 restart inboxhunter-api

# Check status
pm2 status
```

### Database Management

```bash
# Connect to PostgreSQL
sudo -u postgres psql -d inboxhunter

# Common commands:
\dt                    # List tables
SELECT * FROM "User";  # Query users
\q                     # Exit
```

### Amplify Redeployment

- Push to GitHub main branch triggers automatic redeploy
- Or go to Amplify → App → Click "Redeploy this version"

---

## Part 7: Upload Agent Builds to S3

### Manual Upload

1. **Go to S3** → your bucket → `downloads/`
2. **Create version folder:** `v2.0.0/`
3. **Upload files:**
   - `InboxHunterAgent-windows.exe`
   - `InboxHunterAgent-macos`
   - `InboxHunterAgent-linux`

### Download URLs

```
https://inboxhunter-storage.s3.amazonaws.com/downloads/v2.0.0/InboxHunterAgent-windows.exe
https://inboxhunter-storage.s3.amazonaws.com/downloads/v2.0.0/InboxHunterAgent-macos
https://inboxhunter-storage.s3.amazonaws.com/downloads/v2.0.0/InboxHunterAgent-linux
```

---

## Quick Reference

### URLs After Setup

| Service | URL |
|---------|-----|
| Frontend | `https://main.xxxxx.amplifyapp.com` or `https://inboxhunter.io` |
| Backend API | `http://EC2_IP:3001` or `https://api.inboxhunter.io` |
| Health Check | `https://api.inboxhunter.io/health` |
| S3 Downloads | `https://inboxhunter-storage.s3.amazonaws.com/downloads/` |

### SSH Quick Connect

```bash
ssh -i ~/Downloads/inboxhunter-key.pem ubuntu@YOUR_EC2_IP
```

### Environment Files Location

- Backend: `~/inboxhunter-platform/backend/.env`
- Frontend: Amplify Console → Environment variables

---

## Troubleshooting

### Backend not accessible

```bash
# Check if running
pm2 status

# Check logs
pm2 logs inboxhunter-api --lines 50

# Check port is listening
sudo netstat -tlnp | grep 3001

# Check nginx
sudo nginx -t
sudo systemctl status nginx
```

### Database connection issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U inboxhunter_user -d inboxhunter -h localhost
```

### CORS errors

1. Check `CORS_ORIGIN` in backend `.env` matches frontend URL exactly
2. Restart backend: `pm2 restart inboxhunter-api`
3. Clear browser cache

### Amplify build fails

1. Check build logs in Amplify Console
2. Verify `frontend` folder structure
3. Check environment variables are set

---

## Security Checklist

- [ ] Change default PostgreSQL password
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Restrict SSH to your IP only in Security Group
- [ ] Enable SSL (HTTPS) with Certbot
- [ ] Don't commit .env files to git
- [ ] Regularly update system: `sudo apt update && sudo apt upgrade`
- [ ] Set up AWS billing alerts

---

## Next Steps

1. ✅ Backend deployed on EC2
2. ✅ Database running on EC2
3. ✅ Frontend deployed on Amplify
4. ✅ S3 configured for storage
5. ⬜ Set up custom domain
6. ⬜ Configure SSL certificates
7. ⬜ Set up monitoring (CloudWatch)
8. ⬜ Configure backups

---

*Last updated: December 2024*

