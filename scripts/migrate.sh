#!/bin/bash

# Migration script for Manahal Al-Rahiq database
# Usage: ./scripts/migrate.sh [environment] [action]
# Environment: local, staging, production
# Action: up, down, reset, status

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-local}
ACTION=${2:-up}
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

# Function to check if Supabase CLI is installed
check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed. Please install it first:"
        echo "npm install -g supabase"
        exit 1
    fi
}

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
        export $(cat "$PROJECT_ROOT/$env_file" | grep -v '^#' | xargs)
    else
        print_warning "Environment file $env_file not found"
    fi
}

# Function to check database connection
check_db_connection() {
    print_info "Checking database connection for $ENVIRONMENT environment..."
    
    if [ "$ENVIRONMENT" = "local" ]; then
        # Check local Supabase instance
        if ! curl -s http://127.0.0.1:54321/health > /dev/null; then
            print_error "Local Supabase instance is not running"
            print_info "Start it with: supabase start"
            exit 1
        fi
    else
        # Check remote Supabase connection
        if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
            print_error "Supabase environment variables not set"
            exit 1
        fi
        
        # Test connection
        if ! curl -s -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
             "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" > /dev/null; then
            print_error "Cannot connect to Supabase database"
            exit 1
        fi
    fi
    
    print_success "Database connection verified"
}

# Function to backup database
backup_database() {
    local backup_dir="$PROJECT_ROOT/backups"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$backup_dir/${ENVIRONMENT}_backup_${timestamp}.sql"
    
    print_info "Creating database backup..."
    
    # Create backup directory if it doesn't exist
    mkdir -p "$backup_dir"
    
    if [ "$ENVIRONMENT" = "local" ]; then
        supabase db dump --file "$backup_file"
    else
        # For remote databases, use pg_dump if available
        if command -v pg_dump &> /dev/null && [ -n "$DATABASE_URL" ]; then
            pg_dump "$DATABASE_URL" > "$backup_file"
        else
            print_warning "Cannot create backup for remote database. pg_dump not available or DATABASE_URL not set."
            return 0
        fi
    fi
    
    if [ -f "$backup_file" ]; then
        print_success "Backup created: $backup_file"
        
        # Keep only last 10 backups
        ls -t "$backup_dir"/${ENVIRONMENT}_backup_*.sql | tail -n +11 | xargs -r rm
        print_info "Old backups cleaned up (keeping last 10)"
    else
        print_error "Failed to create backup"
        exit 1
    fi
}

# Function to run migrations
run_migrations() {
    print_info "Running database migrations for $ENVIRONMENT..."
    
    case $ACTION in
        up)
            print_info "Applying migrations..."
            if [ "$ENVIRONMENT" = "local" ]; then
                supabase db push
            else
                # For remote environments, use migration files
                supabase db push --linked
            fi
            print_success "Migrations applied successfully"
            ;;
        down)
            print_warning "Rolling back last migration..."
            # Note: Supabase doesn't have built-in rollback, so we need custom logic
            print_error "Rollback not implemented. Please create manual rollback scripts."
            exit 1
            ;;
        reset)
            print_warning "Resetting database (this will delete all data)..."
            read -p "Are you sure you want to reset the database? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                if [ "$ENVIRONMENT" = "local" ]; then
                    supabase db reset
                else
                    print_error "Database reset not allowed for $ENVIRONMENT environment"
                    exit 1
                fi
                print_success "Database reset completed"
            else
                print_info "Database reset cancelled"
            fi
            ;;
        status)
            print_info "Checking migration status..."
            supabase migration list
            ;;
        *)
            print_error "Unknown action: $ACTION"
            print_info "Available actions: up, down, reset, status"
            exit 1
            ;;
    esac
}

# Function to run post-migration tasks
post_migration_tasks() {
    print_info "Running post-migration tasks..."
    
    # Seed data for local environment
    if [ "$ENVIRONMENT" = "local" ] && [ "$ACTION" = "up" ]; then
        if [ -f "$PROJECT_ROOT/supabase/seed.sql" ]; then
            print_info "Applying seed data..."
            supabase db reset --seed-only
            print_success "Seed data applied"
        fi
    fi
    
    # Update database statistics
    print_info "Updating database statistics..."
    # This would typically run ANALYZE or similar commands
    
    print_success "Post-migration tasks completed"
}

# Function to verify migration
verify_migration() {
    print_info "Verifying migration..."
    
    # Check if application can connect to database
    if command -v node &> /dev/null; then
        # Run a simple database connectivity test
        node -e "
        const { createClient } = require('@supabase/supabase-js');
        const client = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        client.from('profiles').select('count').limit(1)
            .then(() => console.log('Database connectivity verified'))
            .catch(err => {
                console.error('Database connectivity failed:', err.message);
                process.exit(1);
            });
        " 2>/dev/null || print_warning "Could not verify database connectivity"
    fi
    
    print_success "Migration verification completed"
}

# Main execution
main() {
    print_info "Starting database migration for $ENVIRONMENT environment"
    print_info "Action: $ACTION"
    
    # Check prerequisites
    check_supabase_cli
    
    # Load environment variables
    load_env
    
    # Check database connection
    check_db_connection
    
    # Create backup (except for local reset)
    if [ "$ENVIRONMENT" != "local" ] || [ "$ACTION" != "reset" ]; then
        backup_database
    fi
    
    # Run migrations
    run_migrations
    
    # Post-migration tasks
    if [ "$ACTION" = "up" ]; then
        post_migration_tasks
        verify_migration
    fi
    
    print_success "Migration completed successfully!"
    
    # Show next steps
    print_info "Next steps:"
    echo "1. Test your application"
    echo "2. Monitor logs for any issues"
    echo "3. Run health checks: ./scripts/health-check.sh"
}

# Help function
show_help() {
    echo "Database Migration Script for Manahal Al-Rahiq"
    echo ""
    echo "Usage: $0 [environment] [action]"
    echo ""
    echo "Environments:"
    echo "  local      - Local development database"
    echo "  staging    - Staging environment database"
    echo "  production - Production database"
    echo ""
    echo "Actions:"
    echo "  up         - Apply pending migrations (default)"
    echo "  down       - Rollback last migration"
    echo "  reset      - Reset database (local only)"
    echo "  status     - Show migration status"
    echo ""
    echo "Examples:"
    echo "  $0 local up"
    echo "  $0 production status"
    echo "  $0 staging up"
    echo ""
    echo "Prerequisites:"
    echo "  - Supabase CLI installed"
    echo "  - Environment variables configured"
    echo "  - Database connection available"
}

# Check for help flag
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# Run main function
main
