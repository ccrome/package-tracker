#!/bin/bash

# Package Tracker - Google Cloud Run Deployment Script
# 
# This script deploys the package tracker to Google Cloud Run
# 
# Prerequisites:
# 1. Google Cloud SDK installed and authenticated
# 2. Project ID set
# 3. APIs enabled: Cloud Run, Cloud Build, Container Registry
#
# Usage: ./deploy.sh [PROJECT_ID] [REGION]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
DEFAULT_REGION="us-central1"
SERVICE_NAME="package-tracker"

# Get project ID and region
PROJECT_ID=${1:-$(gcloud config get-value project 2>/dev/null)}
REGION=${2:-$DEFAULT_REGION}

echo -e "${BLUE}🚀 Package Tracker - Cloud Run Deployment${NC}"
echo "=================================="

# Validate project ID
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: PROJECT_ID not set${NC}"
    echo "Usage: $0 [PROJECT_ID] [REGION]"
    echo "Or set with: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}📋 Configuration:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service Name: $SERVICE_NAME"
echo ""

# Check if APIs are enabled
echo -e "${BLUE}🔍 Checking required APIs...${NC}"
required_apis=("run.googleapis.com" "cloudbuild.googleapis.com" "containerregistry.googleapis.com")

for api in "${required_apis[@]}"; do
    if gcloud services list --enabled --filter="name:$api" --format="value(name)" | grep -q "$api"; then
        echo -e "${GREEN}✅ $api is enabled${NC}"
    else
        echo -e "${YELLOW}⚠️  Enabling $api...${NC}"
        gcloud services enable "$api" --project="$PROJECT_ID"
    fi
done

echo ""

# Build and deploy
echo -e "${BLUE}🏗️  Building and deploying to Cloud Run...${NC}"

# Option 1: Direct deployment (recommended for first deployment)
if [ "$3" = "--direct" ]; then
    echo -e "${YELLOW}Using direct deployment...${NC}"
    gcloud run deploy "$SERVICE_NAME" \
        --source . \
        --platform managed \
        --region "$REGION" \
        --allow-unauthenticated \
        --memory 512Mi \
        --cpu 1 \
        --max-instances 10 \
        --set-env-vars NODE_ENV=production \
        --port 8080 \
        --project "$PROJECT_ID"
else
    # Option 2: Cloud Build deployment
    echo -e "${YELLOW}Using Cloud Build...${NC}"
    gcloud builds submit \
        --config cloudbuild.yaml \
        --project "$PROJECT_ID" \
        --region "$REGION"
fi

# Get service URL
echo ""
echo -e "${BLUE}🔗 Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --platform managed \
    --region "$REGION" \
    --project "$PROJECT_ID" \
    --format 'value(status.url)')

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo "=================================="
echo -e "${GREEN}🌐 Service URL: $SERVICE_URL${NC}"
echo -e "${GREEN}📊 Health Check: $SERVICE_URL/api/track/ping${NC}"
echo -e "${GREEN}🎯 Test Tracking: $SERVICE_URL${NC}"
echo ""
echo -e "${BLUE}💡 Next steps:${NC}"
echo "1. Visit $SERVICE_URL to test the application"
echo "2. Set up API credentials for real tracking:"
echo "   - USPS: Register at https://developer.usps.com/"
echo "   - UPS: Register at https://developer.ups.com/"
echo "   - FedEx: Register at https://developer.fedex.com/"
echo "   - DHL: Register at https://developer.dhl.com/"
echo "3. Update secrets in Google Secret Manager"
echo "4. Redeploy with API credentials"
echo ""
echo -e "${YELLOW}⚠️  Remember: USPS Web Tools API retires January 25, 2026${NC}"
echo -e "${YELLOW}   Migration to new USPS APIs required!${NC}" 