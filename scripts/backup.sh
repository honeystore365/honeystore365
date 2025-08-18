#!/bin/bash

# Backup script for Manahal Al-Rahiq
# Usage: ./scripts/backup.sh [environment] [type]
# Environment: local, staging, production
# Type: full, data, schema

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-production}
BACKUP_TYPE=${2:-full}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

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

# Function to check prerequisites
check_prerequisites() {
    # Check if Supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed. Please install it first:"
        echo "npm install -g supabase"
        exit 1
    fi
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    print_success "Prerequisites checked"
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

# Function to backup database
backup_database() {
    local backup_file="$BACKUP_DIR/${ENVIRONMENT}_db_${BACKUP_TYPE}_${TIMESTAMP}.sql"
    
    print_info "Creating database backup ($BACKUP_TYPE) for $ENVIRONMENT..."
    
    case $BACKUP_TYPE in
        full)
            if [ "$ENVIRONMENT" = "local" ]; then
                supabase db dump --file "$backup_file"
            else
                # For remote databases
                if [ -n "$DATABASE_URL" ] && command -v pg_dump &> /dev/null; then
                    pg_dump "$DATABASE_URL" > "$backup_file"
                else
                    print_error "Cannot create full backup for remote database. DATABASE_URL not set or pg_dump not available."
                    return 1
                fi
            fi
            ;;
        data)
            if [ "$ENVIRONMENT" = "local" ]; then
                supabase db dump --data-only --file "$backup_file"
            else
                if [ -n "$DATABASE_URL" ] && command -v pg_dump &> /dev/null; then
                    pg_dump --data-only "$DATABASE_URL" > "$backup_file"
                else
                    print_error "Cannot create data backup for remote database."
                    return 1
                fi
            fi
            ;;
        schema)
            if [ "$ENVIRONMENT" = "local" ]; then
                supabase db dump --schema-only --file "$backup_file"
            else
                if [ -n "$DATABASE_URL" ] && command -v pg_dump &> /dev/null; then
                    pg_dump --schema-only "$DATABASE_URL" > "$backup_file"
                else
                    print_error "Cannot create schema backup for remote database."
                    return 1
                fi
            fi
            ;;
        *)
            print_error "Unknown backup type: $BACKUP_TYPE"
            print_info "Available types: full, data, schema"
            return 1
            ;;
    esac
    
    if [ -f "$backup_file" ]; then
        # Compress the backup
        gzip "$backup_file"
        backup_file="${backup_file}.gz"
        
        local file_size=$(du -h "$backup_file" | cut -f1)
        print_success "Database backup created: $backup_file ($file_size)"
        
        # Verify backup integrity
        if gzip -t "$backup_file"; then
            print_success "Backup integrity verified"
        else
            print_error "Backup integrity check failed"
            return 1
        fi
    else
        print_error "Failed to create database backup"
        return 1
    fi
}

# Function to backup storage files
backup_storage() {
    local storage_backup_dir="$BACKUP_DIR/${ENVIRONMENT}_storage_${TIMESTAMP}"
    
    print_info "Creating storage backup for $ENVIRONMENT..."
    
    if [ "$ENVIRONMENT" = "local" ]; then
        # Backup local storage
        if [ -d "$PROJECT_ROOT/supabase/storage" ]; then
            mkdir -p "$storage_backup_dir"
            cp -r "$PROJECT_ROOT/supabase/storage"/* "$storage_backup_dir/"
            
            # Create archive
            tar -czf "${storage_backup_dir}.tar.gz" -C "$BACKUP_DIR" "$(basename "$storage_backup_dir")"
            rm -rf "$storage_backup_dir"
            
            local file_size=$(du -h "${storage_backup_dir}.tar.gz" | cut -f1)
            print_success "Storage backup created: ${storage_backup_dir}.tar.gz ($file_size)"
        else
            print_warning "No local storage directory found"
        fi
    else
        print_warning "Remote storage backup not implemented. Use Supabase dashboard for storage backups."
    fi
}

# Function to backup configuration
backup_config() {
    local config_backup_file="$BACKUP_DIR/${ENVIRONMENT}_config_${TIMESTAMP}.tar.gz"
    
    print_info "Creating configuration backup..."
    
    # Files to backup
    local config_files=(
        "package.json"
        "package-lock.json"
        "next.config.ts"
        "tailwind.config.ts"
        "tsconfig.json"
        ".eslintrc.json"
        ".prettierrc"
        "supabase/config.toml"
        "vercel.json"
    )
    
    # Create temporary directory
    local temp_dir=$(mktemp -d)
    local config_dir="$temp_dir/config"
    mkdir -p "$config_dir"
    
    # Copy configuration files
    for file in "${config_files[@]}"; do
        if [ -f "$PROJECT_ROOT/$file" ]; then
            # Create directory structure
            local dir_path=$(dirname "$file")
            if [ "$dir_path" != "." ]; then
                mkdir -p "$config_dir/$dir_path"
            fi
            cp "$PROJECT_ROOT/$file" "$config_dir/$file"
        fi
    done
    
    # Create archive
    tar -czf "$config_backup_file" -C "$temp_dir" config
    rm -rf "$temp_dir"
    
    local file_size=$(du -h "$config_backup_file" | cut -f1)
    print_success "Configuration backup created: $config_backup_file ($file_size)"
}

# Function to create backup manifest
create_manifest() {
    local manifest_file="$BACKUP_DIR/${ENVIRONMENT}_manifest_${TIMESTAMP}.json"
    
    print_info "Creating backup manifest..."
    
    cat > "$manifest_file" << EOF
{
  "backup_info": {
    "timestamp": "$TIMESTAMP",
    "environment": "$ENVIRONMENT",
    "backup_type": "$BACKUP_TYPE",
    "created_by": "$(whoami)",
    "hostname": "$(hostname)",
    "app_version": "${NEXT_PUBLIC_APP_VERSION:-unknown}"
  },
  "files": [
EOF

    # List all backup files created in this session
    local first=true
    for file in "$BACKUP_DIR"/*_${TIMESTAMP}*; do
        if [ -f "$file" ]; then
            if [ "$first" = true ]; then
                first=false
            else
                echo "," >> "$manifest_file"
            fi
            
            local filename=$(basename "$file")
            local filesize=$(du -h "$file" | cut -f1)
            local checksum=$(sha256sum "$file" | cut -d' ' -f1)
            
            cat >> "$manifest_file" << EOF
    {
      "filename": "$filename",
      "size": "$filesize",
      "checksum": "$checksum",
      "type": "$(echo "$filename" | cut -d'_' -f2)"
    }
EOF
        fi
    done
    
    cat >> "$manifest_file" << EOF

  ]
}
EOF

    print_success "Backup manifest created: $manifest_file"
}

# Function to cleanup old backups
cleanup_old_backups() {
    local retention_days=${BACKUP_RETENTION_DAYS:-30}
    
    print_info "Cleaning up backups older than $retention_days days..."
    
    # Find and remove old backups
    find "$BACKUP_DIR" -name "${ENVIRONMENT}_*" -type f -mtime +$retention_days -delete
    
    # Count remaining backups
    local backup_count=$(find "$BACKUP_DIR" -name "${ENVIRONMENT}_*" -type f | wc -l)
    print_success "Cleanup completed. $backup_count backups remaining for $ENVIRONMENT"
}

# Function to upload backup to cloud (optional)
upload_to_cloud() {
    if [ -n "$BACKUP_CLOUD_STORAGE" ] && [ "$BACKUP_CLOUD_STORAGE" = "true" ]; then
        print_info "Uploading backups to cloud storage..."
        
        # This would integrate with AWS S3, Google Cloud Storage, etc.
        # Implementation depends on your cloud provider
        
        print_warning "Cloud upload not implemented. Configure your cloud storage provider."
    fi
}

# Function to send notification
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$BACKUP_WEBHOOK_URL" ]; then
        curl -X POST "$BACKUP_WEBHOOK_URL" \
             -H "Content-Type: application/json" \
             -d "{\"status\":\"$status\",\"message\":\"$message\",\"environment\":\"$ENVIRONMENT\",\"timestamp\":\"$TIMESTAMP\"}" \
             2>/dev/null || print_warning "Failed to send notification"
    fi
}

# Main execution
main() {
    print_info "Starting backup for $ENVIRONMENT environment"
    print_info "Backup type: $BACKUP_TYPE"
    
    # Check prerequisites
    check_prerequisites
    
    # Load environment variables
    load_env
    
    # Perform backups
    local backup_success=true
    
    # Database backup
    if ! backup_database; then
        backup_success=false
    fi
    
    # Storage backup (if requested)
    if [ "$BACKUP_TYPE" = "full" ]; then
        backup_storage
        backup_config
    fi
    
    # Create manifest
    create_manifest
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Upload to cloud (if configured)
    upload_to_cloud
    
    if [ "$backup_success" = true ]; then
        print_success "Backup completed successfully!"
        send_notification "success" "Backup completed for $ENVIRONMENT"
        
        # Show backup summary
        print_info "Backup summary:"
        ls -lh "$BACKUP_DIR"/*_${TIMESTAMP}*
    else
        print_error "Backup completed with errors"
        send_notification "error" "Backup failed for $ENVIRONMENT"
        exit 1
    fi
}

# Help function
show_help() {
    echo "Backup Script for Manahal Al-Rahiq"
    echo ""
    echo "Usage: $0 [environment] [type]"
    echo ""
    echo "Environments:"
    echo "  local      - Local development database"
    echo "  staging    - Staging environment database"
    echo "  production - Production database (default)"
    echo ""
    echo "Backup Types:"
    echo "  full       - Complete backup (database + storage + config)"
    echo "  data       - Data only backup"
    echo "  schema     - Schema only backup"
    echo ""
    echo "Examples:"
    echo "  $0 production full"
    echo "  $0 staging data"
    echo "  $0 local schema"
    echo ""
    echo "Environment Variables:"
    echo "  BACKUP_RETENTION_DAYS - Days to keep backups (default: 30)"
    echo "  BACKUP_CLOUD_STORAGE  - Enable cloud upload (true/false)"
    echo "  BACKUP_WEBHOOK_URL    - Webhook for notifications"
    echo ""
    echo "Prerequisites:"
    echo "  - Supabase CLI installed"
    echo "  - Environment variables configured"
    echo "  - pg_dump for remote database backups"
}

# Check for help flag
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# Run main function
main