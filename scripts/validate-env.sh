#!/bin/bash

# Environment validation script for Manahal Al-Rahiq
# Usage: ./scripts/validate-env.sh [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-local}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

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

# Required environment variables
declare -A REQUIRED_VARS=(
    ["NEXT_PUBLIC_SUPABASE_URL"]="Supabase project URL"
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]="Supabase anonymous key"
    ["SUPABASE_SERVICE_ROLE_KEY"]="Supabase service role key"
    ["JWT_SECRET"]="JWT secret for authentication"
    ["NEXTAUTH_SECRET"]="NextAuth secret"
)

# Optional environment variables
declare -A OPTIONAL_VARS=(
    ["NEXT_PUBLIC_APP_NAME"]="Application name"
    ["NEXT_PUBLIC_APP_VERSION"]="Application version"
    ["NEXT_PUBLIC_SITE_URL"]="Site URL"
    ["UPLOADTHING_TOKEN"]="UploadThing token"
    ["NEXT_PUBLIC_SENTRY_DSN"]="Sentry DSN"
    ["SENTRY_ORG"]="Sentry organization"
    ["SENTRY_PROJECT"]="Sentry project"
    ["SENTRY_AUTH_TOKEN"]="Sentry auth token"
    ["LOG_LEVEL"]="Logging level"
    ["NEXT_PUBLIC_ENABLE_CHATBOT"]="Enable chatbot feature"
    ["NEXT_PUBLIC_ENABLE_ANALYTICS"]="Enable analytics"
    ["NEXT_PUBLIC_ENABLE_A11Y"]="Enable accessibility features"
)

# Production-specific required variables
declare -A PRODUCTION_REQUIRED=(
    ["NEXT_PUBLIC_SENTRY_DSN"]="Sentry DSN for error tracking"
    ["UPLOADTHING_TOKEN"]="UploadThing token for file uploads"
)

# Function to load environment variables
load_env() {
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
        *)
            print_error "Unknown environment: $ENVIRONMENT"
            print_info "Available environments: local, staging, production"
            exit 1
            ;;
    esac
    
    if [ -f "$PROJECT_ROOT/$env_file" ]; then
        print_info "Loading environment variables from $env_file"
        export $(cat "$PROJECT_ROOT/$env_file" | grep -v '^#' | grep -v '^$' | xargs)
        return 0
    else
        print_error "Environment file $env_file not found"
        return 1
    fi
}

# Function to validate variable format
validate_var_format() {
    local var_name=$1
    local var_value=$2
    
    case $var_name in
        "NEXT_PUBLIC_SUPABASE_URL")
            if [[ ! $var_value =~ ^https://[a-zA-Z0-9-]+\.supabase\.co$ ]]; then
                print_error "$var_name has invalid format. Expected: https://project.supabase.co"
                return 1
            fi
            ;;
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"|"SUPABASE_SERVICE_ROLE_KEY")
            if [[ ! $var_value =~ ^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$ ]]; then
                print_error "$var_name has invalid JWT format"
                return 1
            fi
            ;;
        "JWT_SECRET"|"NEXTAUTH_SECRET")
            if [ ${#var_value} -lt 32 ]; then
                print_error "$var_name must be at least 32 characters long"
                return 1
            fi
            ;;
        "NEXT_PUBLIC_SITE_URL")
            if [[ ! $var_value =~ ^https?://[a-zA-Z0-9.-]+$ ]]; then
                print_error "$var_name has invalid URL format"
                return 1
            fi
            ;;
        "NEXT_PUBLIC_SENTRY_DSN")
            if [[ ! $var_value =~ ^https://[a-f0-9]+@[a-zA-Z0-9.-]+/[0-9]+$ ]]; then
                print_error "$var_name has invalid Sentry DSN format"
                return 1
            fi
            ;;
        "LOG_LEVEL")
            if [[ ! $var_value =~ ^(error|warn|info|debug)$ ]]; then
                print_error "$var_name must be one of: error, warn, info, debug"
                return 1
            fi
            ;;
        "NEXT_PUBLIC_ENABLE_"*)
            if [[ ! $var_value =~ ^(true|false)$ ]]; then
                print_error "$var_name must be 'true' or 'false'"
                return 1
            fi
            ;;
    esac
    
    return 0
}

# Function to validate required variables
validate_required_vars() {
    local missing_vars=()
    local invalid_vars=()
    
    print_info "Validating required environment variables..."
    
    for var_name in "${!REQUIRED_VARS[@]}"; do
        local var_value="${!var_name}"
        
        if [ -z "$var_value" ]; then
            missing_vars+=("$var_name")
        else
            if ! validate_var_format "$var_name" "$var_value"; then
                invalid_vars+=("$var_name")
            else
                print_success "$var_name ✓"
            fi
        fi
    done
    
    # Check production-specific variables
    if [ "$ENVIRONMENT" = "production" ]; then
        for var_name in "${!PRODUCTION_REQUIRED[@]}"; do
            local var_value="${!var_name}"
            
            if [ -z "$var_value" ]; then
                missing_vars+=("$var_name")
            else
                if ! validate_var_format "$var_name" "$var_value"; then
                    invalid_vars+=("$var_name")
                else
                    print_success "$var_name ✓"
                fi
            fi
        done
    fi
    
    # Report missing variables
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            local description="${REQUIRED_VARS[$var]:-${PRODUCTION_REQUIRED[$var]:-Unknown}}"
            echo "  - $var: $description"
        done
        return 1
    fi
    
    # Report invalid variables
    if [ ${#invalid_vars[@]} -gt 0 ]; then
        print_error "Invalid environment variables:"
        for var in "${invalid_vars[@]}"; do
            echo "  - $var"
        done
        return 1
    fi
    
    print_success "All required environment variables are valid"
    return 0
}

# Function to validate optional variables
validate_optional_vars() {
    local invalid_vars=()
    
    print_info "Validating optional environment variables..."
    
    for var_name in "${!OPTIONAL_VARS[@]}"; do
        local var_value="${!var_name}"
        
        if [ -n "$var_value" ]; then
            if ! validate_var_format "$var_name" "$var_value"; then
                invalid_vars+=("$var_name")
            else
                print_success "$var_name ✓"
            fi
        else
            print_warning "$var_name not set (optional)"
        fi
    done
    
    # Report invalid variables
    if [ ${#invalid_vars[@]} -gt 0 ]; then
        print_error "Invalid optional environment variables:"
        for var in "${invalid_vars[@]}"; do
            echo "  - $var"
        done
        return 1
    fi
    
    print_success "Optional environment variables validation completed"
    return 0
}

# Function to test database connection
test_database_connection() {
    print_info "Testing database connection..."
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        print_error "Supabase configuration missing"
        return 1
    fi
    
    local health_url="$NEXT_PUBLIC_SUPABASE_URL/rest/v1/"
    local response=$(curl -s -w "%{http_code}" -o /dev/null \
                    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
                    --max-time 10 "$health_url" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        print_success "Database connection successful"
        return 0
    else
        print_error "Database connection failed (HTTP $response)"
        return 1
    fi
}

# Function to test external services
test_external_services() {
    print_info "Testing external services..."
    
    local services_ok=true
    
    # Test UploadThing
    if [ -n "$UPLOADTHING_TOKEN" ]; then
        local ut_response=$(curl -s -w "%{http_code}" -o /dev/null \
                           -H "X-Uploadthing-Api-Key: $UPLOADTHING_TOKEN" \
                           --max-time 10 "https://api.uploadthing.com/v6/getUsageInfo" 2>/dev/null)
        
        if [ "$ut_response" = "200" ]; then
            print_success "UploadThing connection successful"
        else
            print_warning "UploadThing connection failed (HTTP $ut_response)"
            services_ok=false
        fi
    else
        print_warning "UploadThing token not configured"
    fi
    
    # Test Sentry
    if [ -n "$NEXT_PUBLIC_SENTRY_DSN" ]; then
        local sentry_host=$(echo "$NEXT_PUBLIC_SENTRY_DSN" | sed -n 's/.*@\([^/]*\).*/\1/p')
        if [ -n "$sentry_host" ]; then
            local sentry_response=$(curl -s -w "%{http_code}" -o /dev/null \
                                   --max-time 10 "https://$sentry_host" 2>/dev/null)
            
            if [ "$sentry_response" = "200" ] || [ "$sentry_response" = "403" ]; then
                print_success "Sentry service reachable"
            else
                print_warning "Sentry service unreachable (HTTP $sentry_response)"
                services_ok=false
            fi
        fi
    else
        print_warning "Sentry DSN not configured"
    fi
    
    if [ "$services_ok" = true ]; then
        print_success "External services validation completed"
        return 0
    else
        print_warning "Some external services have issues"
        return 1
    fi
}

# Function to generate environment report
generate_report() {
    local report_file="$PROJECT_ROOT/env-validation-report-$(date +%Y%m%d_%H%M%S).json"
    
    print_info "Generating environment validation report..."
    
    cat > "$report_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENVIRONMENT",
  "validation_results": {
    "required_vars": $required_vars_valid,
    "optional_vars": $optional_vars_valid,
    "database_connection": $database_connection_ok,
    "external_services": $external_services_ok
  },
  "overall_status": "$overall_status"
}
EOF
    
    print_success "Validation report generated: $report_file"
}

# Main execution
main() {
    print_info "Starting environment validation for $ENVIRONMENT"
    
    # Load environment variables
    if ! load_env; then
        exit 1
    fi
    
    local required_vars_valid=false
    local optional_vars_valid=false
    local database_connection_ok=false
    local external_services_ok=false
    local overall_status="invalid"
    
    # Validate required variables
    if validate_required_vars; then
        required_vars_valid=true
    fi
    
    # Validate optional variables
    if validate_optional_vars; then
        optional_vars_valid=true
    fi
    
    # Test database connection
    if test_database_connection; then
        database_connection_ok=true
    fi
    
    # Test external services
    if test_external_services; then
        external_services_ok=true
    fi
    
    # Determine overall status
    if [ "$required_vars_valid" = true ] && [ "$database_connection_ok" = true ]; then
        if [ "$optional_vars_valid" = true ] && [ "$external_services_ok" = true ]; then
            overall_status="valid"
        else
            overall_status="valid_with_warnings"
        fi
    else
        overall_status="invalid"
    fi
    
    # Generate report
    generate_report
    
    # Final status
    echo ""
    print_info "Environment validation completed"
    
    case $overall_status in
        valid)
            print_success "Environment is VALID ✅"
            print_info "All checks passed. Ready for deployment."
            exit 0
            ;;
        valid_with_warnings)
            print_warning "Environment is VALID with warnings ⚠️"
            print_info "Core functionality will work, but some features may be limited."
            exit 0
            ;;
        invalid)
            print_error "Environment is INVALID ❌"
            print_info "Please fix the issues above before deployment."
            exit 1
            ;;
    esac
}

# Help function
show_help() {
    echo "Environment Validation Script for Manahal Al-Rahiq"
    echo ""
    echo "Usage: $0 [environment]"
    echo ""
    echo "Environments:"
    echo "  local      - Local development environment"
    echo "  staging    - Staging environment"
    echo "  production - Production environment"
    echo ""
    echo "Validations performed:"
    echo "  - Required environment variables presence and format"
    echo "  - Optional environment variables format"
    echo "  - Database connectivity"
    echo "  - External services connectivity"
    echo ""
    echo "Examples:"
    echo "  $0 local"
    echo "  $0 staging"
    echo "  $0 production"
    echo ""
    echo "Exit codes:"
    echo "  0 - Environment is valid"
    echo "  1 - Environment has critical issues"
}

# Check for help flag
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# Run main function
main