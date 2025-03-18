# Documentation Reorganization Script
# This script reorganizes the documentation files according to the new structure

# Create the necessary directories (only if they don't exist)
$directories = @(
    "_dev\shared\guides\api",
    "_dev\shared\guides\authentication",
    "_dev\shared\guides\database",
    "_dev\shared\guides\deployment",
    "_dev\shared\guides\patterns",
    "_dev\shared\guides\security",
    "_dev\shared\guides\testing",
    "_dev\shared\architecture\client",
    "_dev\shared\architecture\server",
    "_dev\shared\standards",
    "_dev\shared\operations",
    "_dev\shared\templates\documentation",
    "_dev\shared\templates\code",
    "_dev\shared\updates\bugfixes",
    "_dev\shared\updates\enhancements"
)

foreach ($dir in $directories) {
    $fullPath = Join-Path -Path $PSScriptRoot -ChildPath "..\..\$dir"
    if (-not (Test-Path -Path $fullPath)) {
        New-Item -Path $fullPath -ItemType Directory -Force | Out-Null
        Write-Host "Created directory: $fullPath"
    }
}

# File mapping: source path => destination path
$fileMapping = @{
    # Database related files
    "..\..\shared\notes\database\database_migration_guide.md" = "..\..\shared\guides\database\database-migration-guide.md"
    "..\..\shared\notes\database\database_seeding_guide.md" = "..\..\shared\guides\database\database-seeding-guide.md"
    "..\..\shared\notes\database\seeding_guide.md" = "..\..\shared\guides\database\seeding-guide.md"
    "..\..\shared\notes\database-management-guide.md" = "..\..\shared\guides\database\database-management-guide.md"
    "..\..\shared\notes\database-sync-guide.md" = "..\..\shared\guides\database\database-sync-guide.md"
    "..\..\shared\notes\database_naming_convention.md" = "..\..\shared\guides\database\database-naming-conventions.md"
    
    # Authentication related files
    "..\..\shared\notes\authentication_system_guide.md" = "..\..\shared\guides\authentication\authentication-system-guide.md"
    "..\..\shared\notes\auth_fixes.md" = "..\..\shared\guides\authentication\authentication-fixes.md"
    "..\..\shared\notes\auth_system_debugging.md" = "..\..\shared\guides\authentication\authentication-system-debugging.md"
    "..\..\shared\notes\general\authentication_system_design_updated.md" = "..\..\shared\guides\authentication\authentication-system-design.md"
    
    # API related files
    "..\..\shared\printify_api_guide.md" = "..\..\shared\guides\api\printify-api-guide.md"
    "..\..\api_route_migration.md" = "..\..\shared\guides\api\api-route-migration.md"
    
    # Security related files
    "..\..\shared\notes\permissions_middleware_implementation.md" = "..\..\shared\guides\security\permissions-middleware-implementation.md"
    "..\..\shared\notes\permissions_usage_guide.md" = "..\..\shared\guides\security\permissions-usage-guide.md"
    "..\..\shared\notes\role_based_permissions_guide.md" = "..\..\shared\guides\security\role-based-permissions-guide.md"
    "..\..\shared\notes\security_logging_guide.md" = "..\..\shared\guides\security\security-logging-guide.md"
    
    # Testing related files
    "..\..\shared\testing_guidelines.md" = "..\..\shared\guides\testing\testing-guidelines.md"
    "..\..\shared\notes\testing_guidelines.md" = "..\..\shared\guides\testing\comprehensive-testing-guidelines.md"
    
    # Patterns related files
    "..\..\shared\notes\patterns\dependency_injection.md" = "..\..\shared\guides\patterns\dependency-injection-guide.md"
    "..\..\shared\notes\patterns\factory_pattern.md" = "..\..\shared\guides\patterns\factory-pattern-guide.md"
    "..\..\shared\notes\dependency_injection.md" = "..\..\shared\guides\patterns\dependency-injection-implementation.md"
    
    # Deployment related files
    "..\..\shared\notes\heroku_deployment_guide.md" = "..\..\shared\guides\deployment\heroku-deployment-guide.md"
    
    # Standards related files
    "..\..\shared\standards.md" = "..\..\shared\standards\general-standards.md"
    "..\..\shared\notes\rules_and_standards.md" = "..\..\shared\standards\development-rules-and-standards.md"
    "..\..\shared\notes\naming_convention_guide.md" = "..\..\shared\standards\naming-conventions.md"
    
    # Architecture files
    "..\..\shared\Overview.md" = "..\..\shared\architecture\system-overview.md"
    "..\..\shared\notes\developer_handover\application_overview.md" = "..\..\shared\architecture\application-overview.md"
    "..\..\shared\notes\developer_handover\frontend_architecture.md" = "..\..\shared\architecture\client\frontend-architecture.md"
    
    # Updates files
    "..\..\shared\notes\updates\fixes\auth_system_bugfix_notes.md" = "..\..\shared\updates\bugfixes\authentication-system-fixes.md"
    "..\..\shared\notes\updates\enhancements\enhanced-logging-response-system.md" = "..\..\shared\updates\enhancements\enhanced-logging-response-system.md"
    "..\..\shared\notes\updates\enhancements\enhanced-response-system-integration-guide.md" = "..\..\shared\updates\enhancements\enhanced-response-system-integration.md"
    
    # Templates
    "..\..\shared\templates\task_list_template.md" = "..\..\shared\templates\documentation\task-list-template.md"
    
    # Service Guides
    "..\..\shared\notes\email-service-guide.md" = "..\..\shared\guides\api\email-service-guide.md"
    "..\..\shared\notes\email-development-guide.md" = "..\..\shared\guides\api\email-development-guide.md"
    "..\..\shared\notes\contact-info-usage-guide.md" = "..\..\shared\guides\api\contact-info-usage-guide.md"
    "..\..\shared\notes\response-system-guide.md" = "..\..\shared\guides\api\response-system-guide.md"
    "..\..\shared\notes\logger-response-system.md" = "..\..\shared\guides\api\logger-response-system.md"
    "..\..\shared\notes\auditing-system-guide.md" = "..\..\shared\guides\security\auditing-system-guide.md"
}

# Copy files to new locations
foreach ($source in $fileMapping.Keys) {
    $sourcePath = Join-Path -Path $PSScriptRoot -ChildPath $source
    $destinationPath = Join-Path -Path $PSScriptRoot -ChildPath $fileMapping[$source]
    
    if (Test-Path -Path $sourcePath) {
        # Create destination directory if it doesn't exist
        $destinationDir = Split-Path -Path $destinationPath -Parent
        if (-not (Test-Path -Path $destinationDir)) {
            New-Item -Path $destinationDir -ItemType Directory -Force | Out-Null
        }
        
        # Copy the file
        Copy-Item -Path $sourcePath -Destination $destinationPath -Force
        Write-Host "Copied: $sourcePath -> $destinationPath"
    } else {
        Write-Host "Source file not found: $sourcePath" -ForegroundColor Yellow
    }
}

Write-Host "Documentation reorganization completed!" -ForegroundColor Green
