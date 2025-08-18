#!/bin/bash

# Health check script for Manahal Al-Rahiq
# Usage: ./scripts/health-check.sh [url] [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
URL=${1:-http://localhost:3000}
ENVIRONMENT=${2:-local}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMEOUT=30
MAX_RETRIES=3

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if URL is reachable
check_url_reachable() {
    local url=$1
    local retries=0
    
    print_info "Checking if $url is reachable..."
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -s --max-time $TIMEOUT "$url" > /dev/null; then
            print_success "URL is reachable"
            return 0
        fi
        
        retries=$((retries + 1))
        if [ $retries -lt $MAX_RETRIES ]; then
            print_warning "Attempt $retries failed, retrying in 5 seconds..."
            sleep 5
        fi
    done
    
    print_error "URL is not reachable after $MAX_RETRIES attempts"
    return 1
}

# Function to check health endpoint
check_health_endpoint() {
    local health_url="$URL/api/health"
    
    print_info "Checking health endpoint: $health_url"
    
    local response=$(curl -s --max-time $TIMEOUT "$health_url" 2>/dev/null)
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$health_url" 2>/dev/null)
    
    if [ "$status_code" = "200" ]; then
        print_success "Health endpoint is healthy (HTTP $status_code)"
        
        # Parse health response if it's JSON
        if command -v jq &> /dev/null && echo "$response" | jq . > /dev/null 2>&1; then
            local status=$(echo "$response" | jq -r '.status // "unknown"')
            local uptime=$(echo "$response" | jq -r '.uptime // "unknown"')
            local version=$(echo "$response" | jq -r '.version // "unknown"')
            
            print_info "Status: $status"
            print_info "Uptime: $uptime seconds"
            print_info "Version: $version"
        else
            print_info "Health response: $response"
        fi
        
        return 0
    else
        print_error "Health endpoint is unhealthy (HTTP $status_code)"
        print_error "Response: $response"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    print_info "Checking database connectivity..."
    
    # Load environment variables
    local env_file=""
    case $ENVIRONMENT in
        local)
            env_file=".env.local"
            ;;
        staging)
            env_file=".env.staging"
            ;;
        production)
            env_file=".env.production"
            ;;
    esac
    
    if [ -f "$PROJECT_ROOT/$env_file" ]; then
        export $(cat "$PROJECT_ROOT/$env_file" | grep -v '^#' | xargs)
    fi
    
    # Check Supabase connection
    if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        local supabase_health_url="$NEXT_PUBLIC_SUPABASE_URL/rest/v1/"
        local supabase_status=$(curl -s -o /dev/null -w "%{http_code}" \
                               -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
                               --max-time $TIMEOUT "$supabase_health_url" 2>/dev/null)
        
        if [ "$supabase_status" = "200" ]; then
            print_success "Database connection is healthy"
        else
            print_error "Database connection failed (HTTP $supabase_status)"
            return 1
        fi
    else
        print_warning "Supabase environment variables not found, skipping database check"
    fi
}

# Function to check external services
check_external_services() {
    print_info "Checking external services..."
    
    # Check UploadThing (if configured)
    if [ -n "$UPLOADTHING_TOKEN" ]; then
        local uploadthing_status=$(curl -s -o /dev/null -w "%{http_code}" \
                                  -H "X-Uploadthing-Api-Key: $UPLOADTHING_TOKEN" \
                                  --max-time $TIMEOUT "https://api.uploadthing.com/v6/getUsageInfo" 2>/dev/null)
        
        if [ "$uploadthing_status" = "200" ]; then
            print_success "UploadThing service is healthy"
        else
            print_warning "UploadThing service check failed (HTTP $uploadthing_status)"
        fi
    fi
    
    # Check Sentry (if configured)
    if [ -n "$NEXT_PUBLIC_SENTRY_DSN" ]; then
        # Extract Sentry project URL from DSN
        local sentry_host=$(echo "$NEXT_PUBLIC_SENTRY_DSN" | sed -n 's/.*@\([^/]*\).*/\1/p')
        if [ -n "$sentry_host" ]; then
            local sentry_status=$(curl -s -o /dev/null -w "%{http_code}" \
                                 --max-time $TIMEOUT "https://$sentry_host" 2>/dev/null)
            
            if [ "$sentry_status" = "200" ] || [ "$sentry_status" = "403" ]; then
                print_success "Sentry service is reachable"
            else
                print_warning "Sentry service check failed (HTTP $sentry_status)"
            fi
        fi
    fi
}

# Function to check SSL certificate
check_ssl_certificate() {
    if [[ $URL == https://* ]]; then
        print_info "Checking SSL certificate..."
        
        local domain=$(echo "$URL" | sed -n 's/https:\/\/\([^\/]*\).*/\1/p')
        local cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            local not_after=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
            local expiry_date=$(date -d "$not_after" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$not_after" +%s 2>/dev/null)
            local current_date=$(date +%s)
            local days_until_expiry=$(( (expiry_date - current_date) / 86400 ))
            
            if [ $days_until_expiry -gt 30 ]; then
                print_success "SSL certificate is valid (expires in $days_until_expiry days)"
            elif [ $days_until_expiry -gt 0 ]; then
                print_warning "SSL certificate expires soon (in $days_until_expiry days)"
            else
                print_error "SSL certificate has expired"
                return 1
            fi
        else
            print_error "Failed to check SSL certificate"
            return 1
        fi
    else
        print_info "Skipping SSL check (HTTP URL)"
    fi
}

# Function to check performance metrics
check_performance() {
    print_info "Checking performance metrics..."
    
    # Measure response time
    local start_time=$(date +%s%N)
    curl -s --max-time $TIMEOUT "$URL" > /dev/null
    local end_time=$(date +%s%N)
    local response_time=$(( (end_time - start_time) / 1000000 ))
    
    print_info "Response time: ${response_time}ms"
    
    if [ $response_time -lt 1000 ]; then
        print_success "Response time is good (< 1s)"
    elif [ $response_time -lt 3000 ]; then
        print_warning "Response time is acceptable (< 3s)"
    else
        print_error "Response time is slow (> 3s)"
        return 1
    fi
    
    # Check if gzip compression is enabled
    local content_encoding=$(curl -s -H "Accept-Encoding: gzip" -I "$URL" | grep -i "content-encoding" | grep -i "gzip")
    if [ -n "$content_encoding" ]; then
        print_success "Gzip compression is enabled"
    else
        print_warning "Gzip compression is not enabled"
    fi
}

# Function to check security headers
check_security_headers() {
    print_info "Checking security headers..."
    
    local headers=$(curl -s -I "$URL")
    local security_score=0
    local total_checks=5
    
    # Check for security headers
    if echo "$headers" | grep -qi "x-frame-options"; then
        print_success "X-Frame-Options header present"
        security_score=$((security_score + 1))
    else
        print_warning "X-Frame-Options header missing"
    fi
    
    if echo "$headers" | grep -qi "x-content-type-options"; then
        print_success "X-Content-Type-Options header present"
        security_score=$((security_score + 1))
    else
        print_warning "X-Content-Type-Options header missing"
    fi
    
    if echo "$headers" | grep -qi "x-xss-protection"; then
        print_success "X-XSS-Protection header present"
        security_score=$((security_score + 1))
    else
        print_warning "X-XSS-Protection header missing"
    fi
    
    if echo "$headers" | grep -qi "strict-transport-security"; then
        print_success "Strict-Transport-Security header present"
        security_score=$((security_score + 1))
    else
        print_warning "Strict-Transport-Security header missing"
    fi
    
    if echo "$headers" | grep -qi "content-security-policy"; then
        print_success "Content-Security-Policy header present"
        security_score=$((security_score + 1))
    else
        print_warning "Content-Security-Policy header missing"
    fi
    
    local security_percentage=$((security_score * 100 / total_checks))
    print_info "Security headers score: $security_score/$total_checks ($security_percentage%)"
    
    if [ $security_percentage -ge 80 ]; then
        print_success "Security headers configuration is good"
    elif [ $security_percentage -ge 60 ]; then
        print_warning "Security headers configuration needs improvement"
    else
        print_error "Security headers configuration is poor"
        return 1
    fi
}

# Function to generate health report
generate_report() {
    local report_file="$PROJECT_ROOT/health-report-$(date +%Y%m%d_%H%M%S).json"
    
    print_info "Generating health report..."
    
    cat > "$report_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENVIRONMENT",
  "url": "$URL",
  "checks": {
    "url_reachable": $url_reachable_status,
    "health_endpoint": $health_endpoint_status,
    "database": $database_status,
    "ssl_certificate": $ssl_status,
    "performance": $performance_status,
    "security_headers": $security_status
  },
  "overall_status": "$overall_status"
}
EOF
    
    print_success "Health report generated: $report_file"
}

# Main execution
main() {
    print_info "Starting health check for $URL ($ENVIRONMENT environment)"
    
    local overall_status="healthy"
    local url_reachable_status="false"
    local health_endpoint_status="false"
    local database_status="false"
    local ssl_status="false"
    local performance_status="false"
    local security_status="false"
    
    # Run health checks
    if check_url_reachable "$URL"; then
        url_reachable_status="true"
    else
        overall_status="unhealthy"
    fi
    
    if check_health_endpoint; then
        health_endpoint_status="true"
    else
        overall_status="unhealthy"
    fi
    
    if check_database; then
        database_status="true"
    else
        overall_status="unhealthy"
    fi
    
    check_external_services
    
    if check_ssl_certificate; then
        ssl_status="true"
    else
        overall_status="degraded"
    fi
    
    if check_performance; then
        performance_status="true"
    else
        overall_status="degraded"
    fi
    
    if check_security_headers; then
        security_status="true"
    else
        overall_status="degraded"
    fi
    
    # Generate report
    generate_report
    
    # Final status
    echo ""
    print_info "Health check completed"
    
    case $overall_status in
        healthy)
            print_success "Overall status: HEALTHY ✅"
            exit 0
            ;;
        degraded)
            print_warning "Overall status: DEGRADED ⚠️"
            exit 1
            ;;
        unhealthy)
            print_error "Overall status: UNHEALTHY ❌"
            exit 2
            ;;
    esac
}

# Help function
show_help() {
    echo "Health Check Script for Manahal Al-Rahiq"
    echo ""
    echo "Usage: $0 [url] [environment]"
    echo ""
    echo "Parameters:"
    echo "  url         - URL to check (default: http://localhost:3000)"
    echo "  environment - Environment name (default: local)"
    echo ""
    echo "Examples:"
    echo "  $0"
    echo "  $0 https://manahal-alrahiq.com production"
    echo "  $0 https://staging-manahal.vercel.app staging"
    echo ""
    echo "Checks performed:"
    echo "  - URL reachability"
    echo "  - Health endpoint (/api/health)"
    echo "  - Database connectivity"
    echo "  - External services"
    echo "  - SSL certificate (for HTTPS)"
    echo "  - Performance metrics"
    echo "  - Security headers"
    echo ""
    echo "Exit codes:"
    echo "  0 - Healthy"
    echo "  1 - Degraded"
    echo "  2 - Unhealthy"
}

# Check for help flag
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# Run main function
main