# Google Cloud Run Deployment Guide

This guide walks you through deploying the Package Tracker to Google Cloud Run, a serverless platform that automatically scales your application.

## 🚀 Quick Start

### Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Google Cloud SDK** installed and authenticated
3. **Docker** installed (for local testing)
4. **Project with required APIs** enabled

### 1. Set up Google Cloud Project

```bash
# Create a new project (optional)
gcloud projects create your-project-id --name="Package Tracker"

# Set the project
gcloud config set project your-project-id

# Enable required APIs (done automatically by deploy script)
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com
```

### 2. Deploy to Cloud Run

**Option A: Quick Deploy (Recommended for first deployment)**
```bash
# Deploy directly to Cloud Run
./deploy.sh your-project-id us-central1 --direct
```

**Option B: Cloud Build Deploy**
```bash
# Deploy using Cloud Build
./deploy.sh your-project-id us-central1
```

### 3. Set up API Credentials (Optional)

```bash
# Set up secrets for carrier APIs
./setup-secrets.sh your-project-id

# Uncomment secrets in service.yaml
# Then redeploy
./deploy.sh your-project-id us-central1
```

## 📁 Deployment Files

### Core Files

- **`Dockerfile`** - Container configuration for Cloud Run
- **`cloudbuild.yaml`** - Cloud Build configuration for CI/CD
- **`service.yaml`** - Cloud Run service specification
- **`deploy.sh`** - Automated deployment script
- **`setup-secrets.sh`** - Secret Manager setup script

### Configuration

```
package-tracker/
├── Dockerfile              # Container image definition
├── cloudbuild.yaml         # Cloud Build pipeline
├── service.yaml            # Cloud Run service config
├── deploy.sh              # Deployment automation
├── setup-secrets.sh       # Secrets management
├── server.js              # Application server (updated for Cloud Run)
└── package.json           # Dependencies & scripts
```

## 🔧 Detailed Configuration

### Dockerfile

The Dockerfile creates a production-ready container:

- **Base Image**: `node:18-alpine` (lightweight)
- **Security**: Non-root user
- **Port**: 8080 (Cloud Run standard)
- **Health Check**: Built-in API endpoint
- **Optimization**: Multi-stage build, production dependencies only

### Cloud Build (`cloudbuild.yaml`)

Automated CI/CD pipeline that:

1. Builds container image
2. Pushes to Google Container Registry  
3. Deploys to Cloud Run
4. Configures service settings

**Trigger on Git push:**
```bash
# Connect repository for automatic builds
gcloud builds triggers create github \
  --repo-name=package-tracker \
  --repo-owner=your-username \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

### Service Configuration (`service.yaml`)

Production-ready settings:

- **Memory**: 512Mi
- **CPU**: 1000m (1 vCPU)
- **Concurrency**: 80 requests per instance
- **Scaling**: 0-10 instances
- **Health Checks**: Liveness and readiness probes
- **Secrets**: Google Secret Manager integration

## 🔐 API Credentials Management

### Setting up Secrets

1. **Run the setup script:**
   ```bash
   ./setup-secrets.sh your-project-id
   ```

2. **Enter your API credentials** when prompted:
   - USPS Client ID & Secret (from https://developer.usps.com/)
   - UPS API Key & OAuth credentials  
   - FedEx API Key & OAuth credentials
   - DHL API Key

3. **Update service.yaml:**
   ```bash
   # Uncomment the secret environment variables in service.yaml
   # Then redeploy
   ./deploy.sh your-project-id
   ```

### Manual Secret Management

```bash
# Create a secret
gcloud secrets create usps-client-id --replication-policy="automatic"

# Add secret value
echo "your-client-id" | gcloud secrets versions add usps-client-id --data-file=-

# View secrets
gcloud secrets list

# Update a secret
echo "new-value" | gcloud secrets versions add usps-client-id --data-file=-
```

## 🌐 Post-Deployment

### Service URL

After deployment, your service will be available at:
```
https://package-tracker-xxxxxxxxx-uc.a.run.app
```

### Health Check

Verify deployment:
```bash
curl https://your-service-url/api/track/ping
```

### Test Tracking

```bash
# Test API endpoint
curl -X POST https://your-service-url/api/track \
  -H "Content-Type: application/json" \
  -d '{"trackingNumber": "9400136106193369031407", "carrier": "usps"}'
```

## 📊 Monitoring & Logs

### Cloud Run Console
- **Metrics**: https://console.cloud.google.com/run
- **Logs**: View real-time logs and errors
- **Traffic**: Monitor request volume and latency

### Cloud Logging
```bash
# View logs
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=package-tracker"

# Follow logs in real-time
gcloud logs tail "resource.type=cloud_run_revision AND resource.labels.service_name=package-tracker"
```

## 🔄 Updates & Maintenance

### Deploying Updates

```bash
# Redeploy after code changes
./deploy.sh your-project-id

# Or use Cloud Build trigger (automatic on git push)
git push origin main
```

### Updating Environment Variables

```bash
# Update environment variables
gcloud run services update package-tracker \
  --set-env-vars "NEW_VAR=value" \
  --region us-central1
```

### Updating Secrets

```bash
# Update an existing secret
echo "new-secret-value" | gcloud secrets versions add secret-name --data-file=-

# Service will automatically use the latest version
```

## 💰 Cost Optimization

### Pricing

Cloud Run pricing (as of 2024):
- **CPU**: $0.00002400 per vCPU-second
- **Memory**: $0.00000250 per GiB-second  
- **Requests**: $0.40 per million requests
- **Free Tier**: 2 million requests/month, 400,000 GiB-seconds/month

### Optimization Tips

1. **Scale to Zero**: Automatic scaling saves costs during low usage
2. **Right-size Resources**: Monitor and adjust CPU/memory limits
3. **Use Secrets**: Avoid storing credentials in environment variables
4. **Cache Responses**: Implement caching for API calls to reduce costs

## 🛡️ Security Best Practices

1. **Use IAM Roles**: Grant minimum required permissions
2. **Enable VPC Connector**: For private resource access
3. **HTTPS Only**: Cloud Run enforces HTTPS automatically
4. **Secret Manager**: Store sensitive data securely
5. **Regular Updates**: Keep dependencies and base images updated

## 🚨 Troubleshooting

### Common Issues

**Deployment Fails:**
```bash
# Check build logs
gcloud builds log $(gcloud builds list --limit=1 --format="value(id)")

# Check service logs
gcloud logs read "resource.type=cloud_run_revision"
```

**API Keys Not Working:**
```bash
# Verify secrets exist
gcloud secrets list

# Check service has access to secrets
gcloud run services describe package-tracker --format="export" | grep -A5 secrets
```

**503 Service Unavailable:**
- Check health check endpoint
- Verify port 8080 is exposed  
- Review startup logs

### Getting Help

1. **Cloud Run Documentation**: https://cloud.google.com/run/docs
2. **Google Cloud Support**: https://cloud.google.com/support
3. **Stack Overflow**: Tag questions with `google-cloud-run`

## 🔮 Next Steps

1. **Set up monitoring** with Google Cloud Monitoring
2. **Configure custom domain** and SSL certificate
3. **Implement CI/CD pipeline** with Cloud Build triggers
4. **Add API rate limiting** and caching
5. **Set up automated backups** for configuration

---

## 📞 Support

For issues specific to this package tracker:
1. Check the logs first
2. Verify API credentials are correctly configured
3. Test the health check endpoint
4. Review the deployment scripts for any errors

**Remember**: USPS Web Tools API retires January 25, 2026 - migration to new USPS APIs required! 