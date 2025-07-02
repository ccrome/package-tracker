#!/bin/bash

# Package Tracker - Google Secret Manager Setup
# 
# This script helps set up API credentials in Google Secret Manager
# for secure access from Cloud Run
#
# Usage: ./setup-secrets.sh [PROJECT_ID]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ID=${1:-$(gcloud config get-value project 2>/dev/null)}

echo -e "${BLUE}🔐 Package Tracker - Secret Manager Setup${NC}"
echo "========================================="

# Validate project ID
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: PROJECT_ID not set${NC}"
    echo "Usage: $0 [PROJECT_ID]"
    echo "Or set with: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}📋 Project ID: $PROJECT_ID${NC}"
echo ""

# Enable Secret Manager API
echo -e "${BLUE}🔍 Enabling Secret Manager API...${NC}"
gcloud services enable secretmanager.googleapis.com --project="$PROJECT_ID"

echo ""
echo -e "${BLUE}🔑 Setting up carrier API credentials...${NC}"
echo ""

# Function to create or update secret
create_or_update_secret() {
    local secret_name=$1
    local secret_description=$2
    local example_value=$3
    
    echo -e "${YELLOW}Setting up: $secret_name${NC}"
    echo "Description: $secret_description"
    
    # Check if secret exists
    if gcloud secrets describe "$secret_name" --project="$PROJECT_ID" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Secret $secret_name already exists${NC}"
        read -p "Do you want to update it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -s -p "Enter new value for $secret_name: " secret_value
            echo
            if [ -n "$secret_value" ]; then
                echo "$secret_value" | gcloud secrets versions add "$secret_name" --data-file=- --project="$PROJECT_ID"
                echo -e "${GREEN}✅ Updated $secret_name${NC}"
            else
                echo -e "${YELLOW}⚠️  Skipped empty value${NC}"
            fi
        fi
    else
        echo "Example: $example_value"
        read -s -p "Enter value for $secret_name (or press Enter to skip): " secret_value
        echo
        
        if [ -n "$secret_value" ]; then
            # Create the secret
            gcloud secrets create "$secret_name" \
                --replication-policy="automatic" \
                --project="$PROJECT_ID"
            
            # Add the secret value
            echo "$secret_value" | gcloud secrets versions add "$secret_name" --data-file=- --project="$PROJECT_ID"
            echo -e "${GREEN}✅ Created $secret_name${NC}"
        else
            echo -e "${YELLOW}⚠️  Skipped $secret_name${NC}"
        fi
    fi
    echo ""
}

# Create secrets for each carrier
create_or_update_secret "usps-client-id" "USPS API Client ID (New API)" "your-usps-client-id"
create_or_update_secret "usps-client-secret" "USPS API Client Secret (New API)" "your-usps-client-secret"
create_or_update_secret "ups-api-key" "UPS API Key" "your-ups-api-key"
create_or_update_secret "ups-client-id" "UPS Client ID" "your-ups-client-id"
create_or_update_secret "ups-client-secret" "UPS Client Secret" "your-ups-client-secret"
create_or_update_secret "fedex-api-key" "FedEx API Key" "your-fedex-api-key"
create_or_update_secret "fedex-client-id" "FedEx Client ID" "your-fedex-client-id"
create_or_update_secret "fedex-client-secret" "FedEx Client Secret" "your-fedex-client-secret"
create_or_update_secret "dhl-api-key" "DHL API Key" "your-dhl-api-key"

echo -e "${GREEN}✅ Secret setup completed!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Update service.yaml to use these secrets"
echo "2. Redeploy your Cloud Run service"
echo "3. Test with real API credentials"
echo ""
echo -e "${BLUE}💡 To view secrets:${NC}"
echo "gcloud secrets list --project=$PROJECT_ID"
echo ""
echo -e "${BLUE}💡 To update a secret:${NC}"
echo "echo 'new-value' | gcloud secrets versions add SECRET_NAME --data-file=- --project=$PROJECT_ID"
echo ""
echo -e "${YELLOW}⚠️  Important: Keep your API credentials secure!${NC}"
echo -e "${YELLOW}   Never commit them to version control.${NC}" 