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

3. **Install Docker**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Add your user to docker group (so you don't need sudo)
   sudo usermod -aG docker ubuntu
   
   # Install Docker Compose
   sudo apt install -y docker-compose-plugin
   
   # Verify installation
   docker --version
   docker compose version
   
   # IMPORTANT: Log out and back in for group changes to take effect
   exit
   ```
   
   Then SSH back in:
   ```bash
   ssh -i ~/Downloads/inboxhunter-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
   ```

4. **Install Node.js 18**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Verify installation
   node --version  # Should show v18.x.x
   npm --version   # Should show 9.x.x or 10.x.x
   ```

5. **Install PM2 (Process Manager)**
   ```bash
   sudo npm install -g pm2
   ```

6. **Install Git**
   ```bash
   sudo apt install -y git
   ```

---

### Step 1.3: Clone & Configure

1. **Clone Your Repository**
   ```bash
   cd ~
   git clone https://github.com/YOUR_USERNAME/inboxhunter-platform.git
   cd inboxhunter-platform
   ```

2. **Create Environment File**
   ```bash
   # Copy template
   cp env.example .env
   
   # Edit with your values
   nano .env
   ```
   
   Update the following values:
   ```env
   # Database (change password!)
   POSTGRES_USER=inboxhunter
   POSTGRES_PASSWORD=YourSecurePassword123!
   POSTGRES_DB=inboxhunter
   
   # Must match above credentials
   DATABASE_URL="postgresql://inboxhunter:YourSecurePassword123!@localhost:5432/inboxhunter?schema=public"
   
   # Production settings
   NODE_ENV=production
   
   # JWT Secret - generate with: openssl rand -base64 32
   JWT_SECRET="paste-your-generated-secret-here"
   
   # CORS - update after Amplify deploy
   CORS_ORIGIN="https://your-amplify-domain.amplifyapp.com"
   
   # AWS S3 (add after creating IAM user in Part 4)
   AWS_ACCESS_KEY_ID=""
   AWS_SECRET_ACCESS_KEY=""
   AWS_REGION="us-east-1"
   S3_BUCKET="inboxhunter-storage"
   ```
   
   Save: `Ctrl+O`, `Enter`, `Ctrl+X`

3. **Start PostgreSQL Container**
   ```bash
   # Start PostgreSQL (uses docker-compose.yml)
   docker compose up -d postgres
   
   # Verify it's running
   docker ps
   
   # Check logs
   docker logs inboxhunter-db
   ```

4. **Verify Database Connection**
   ```bash
   # Connect to PostgreSQL in Docker
   docker exec -it inboxhunter-db psql -U inboxhunter -d inboxhunter
   
   # In psql prompt, test:
   \dt    # List tables (empty for now)
   \q     # Exit
   ```

---

### Step 1.4: Deploy Backend

1. **Install Dependencies**
   ```bash
   cd ~/inboxhunter-platform/backend
   npm install
   ```

2. **Build the Application**
   ```bash
   npm run build
   ```

3. **Start with PM2**
   ```bash
   # TypeORM auto-syncs schema in development
   # For production, you may want to run migrations first:
   # npm run migration:run
   
   pm2 start dist/main.js --name "inboxhunter-api"
   
   # Save PM2 configuration
   pm2 save
   
   # Setup PM2 to start on boot
   pm2 startup
   # Run the command it outputs (copy and run the sudo command)
   ```

6. **Verify Backend is Running**
   ```bash
   # Check PM2 status
   pm2 status
   
   # Check logs
   pm2 logs inboxhunter-api
   
   # Test API
   curl http://localhost:3001/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

7. **Test from Browser**
   - Open: `http://YOUR_EC2_PUBLIC_IP:3001/health`
   - Should see JSON response

---

### Step 1.5: Set Up Nginx (Reverse Proxy + SSL)

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
# TypeORM auto-syncs in dev, or run migrations for production:
# npm run migration:run
pm2 restart inboxhunter-api

# Check status
pm2 status
```

### Docker Auto-Start on Boot

```bash
# Enable Docker to start on boot
sudo systemctl enable docker

# The PostgreSQL container has restart: always policy,
# so it will auto-restart when Docker starts

# Verify auto-restart policy
docker inspect inboxhunter-db --format '{{.HostConfig.RestartPolicy.Name}}'
# Should output: always
```

### Database Management (Docker PostgreSQL)

```bash
# All commands run from project root
cd ~/inboxhunter-platform

# Connect to PostgreSQL
docker exec -it inboxhunter-db psql -U inboxhunter -d inboxhunter

# Common psql commands:
\dt                    # List tables
SELECT * FROM "User";  # Query users
\q                     # Exit

# View logs
docker logs -f inboxhunter-db

# Restart database
docker compose restart postgres

# Stop database
docker compose down

# Start database
docker compose up -d postgres

# Backup database
docker exec inboxhunter-db pg_dump -U inboxhunter inboxhunter > ~/backup-$(date +%Y%m%d).sql

# Restore database
cat ~/backup.sql | docker exec -i inboxhunter-db psql -U inboxhunter -d inboxhunter
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
# Check Docker container is running
docker ps | grep inboxhunter-db

# If not running, start it
cd ~/inboxhunter-platform
docker compose up -d postgres

# Check container logs for errors
docker logs inboxhunter-db --tail 50

# Test connection
docker exec -it inboxhunter-db psql -U inboxhunter -d inboxhunter -c "SELECT 1"

# Check if port 5432 is listening
sudo netstat -tlnp | grep 5432
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
2. ✅ Database running in Docker on EC2
3. ✅ Frontend deployed on Amplify
4. ✅ S3 configured for storage
5. ⬜ Set up custom domain
6. ⬜ Configure SSL certificates
7. ⬜ Set up monitoring (CloudWatch)
8. ⬜ Configure automated database backups

---

*Last updated: December 2024*

