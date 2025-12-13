#!/bin/bash

# ============================================
# JASPER - Cloudflare DNS Setup Script
# Adds DNS records for portal and client subdomains
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
CLOUDFLARE_API_TOKEN="-y6GblTwC7yGRGvpMgNOXY7gcyn9EVDPnGmdhKqk"
VPS_IP="72.61.201.237"
DOMAIN="jasperfinance.org"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}JASPER - Cloudflare DNS Setup${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Get Zone ID for jasperfinance.org
echo -e "${YELLOW}Getting Zone ID for $DOMAIN...${NC}"
ZONE_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json")

ZONE_ID=$(echo "$ZONE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ZONE_ID" ]; then
    echo -e "${RED}Error: Could not get Zone ID for $DOMAIN${NC}"
    echo "Response: $ZONE_RESPONSE"
    exit 1
fi

echo -e "${GREEN}Zone ID: $ZONE_ID${NC}"

# Function to create or update DNS record
create_dns_record() {
    local NAME="$1"
    local TYPE="$2"
    local CONTENT="$3"
    local PROXIED="$4"

    echo -e "${YELLOW}Setting up $NAME.$DOMAIN -> $CONTENT...${NC}"

    # Check if record exists
    EXISTING=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?type=$TYPE&name=$NAME.$DOMAIN" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json")

    RECORD_ID=$(echo "$EXISTING" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [ -n "$RECORD_ID" ] && [ "$RECORD_ID" != "" ]; then
        # Update existing record
        echo -e "${BLUE}Updating existing record...${NC}"
        RESULT=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data "{\"type\":\"$TYPE\",\"name\":\"$NAME\",\"content\":\"$CONTENT\",\"proxied\":$PROXIED}")
    else
        # Create new record
        echo -e "${BLUE}Creating new record...${NC}"
        RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data "{\"type\":\"$TYPE\",\"name\":\"$NAME\",\"content\":\"$CONTENT\",\"proxied\":$PROXIED}")
    fi

    SUCCESS=$(echo "$RESULT" | grep -o '"success":true')
    if [ -n "$SUCCESS" ]; then
        echo -e "${GREEN}Successfully configured $NAME.$DOMAIN${NC}"
    else
        echo -e "${RED}Failed to configure $NAME.$DOMAIN${NC}"
        echo "Response: $RESULT"
    fi
}

# Create DNS records
# Note: proxied=true means Cloudflare CDN/proxy, proxied=false means DNS-only

echo ""
echo -e "${YELLOW}Creating DNS records...${NC}"
echo ""

# API subdomain (already exists, but let's ensure it's correct)
create_dns_record "api" "A" "$VPS_IP" "true"

# Portal subdomain (Admin Portal)
create_dns_record "portal" "A" "$VPS_IP" "true"

# Client subdomain (Client Portal)
create_dns_record "client" "A" "$VPS_IP" "true"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}DNS Setup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "DNS Records configured:"
echo -e "  - api.jasperfinance.org    -> $VPS_IP (proxied)"
echo -e "  - portal.jasperfinance.org -> $VPS_IP (proxied)"
echo -e "  - client.jasperfinance.org -> $VPS_IP (proxied)"
echo ""
echo -e "${YELLOW}Note: DNS propagation may take a few minutes.${NC}"
