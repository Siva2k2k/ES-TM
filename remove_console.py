#!/usr/bin/env python3
"""
Script to remove console.log, console.warn, console.debug, and console.info statements
while preserving console.error statements from TypeScript/JavaScript files.
"""

import re
import os
from pathlib import Path

def remove_console_statements(content):
    """
    Remove console.log, console.warn, console.debug, and console.info statements.
    Preserves console.error statements.
    """
    # Pattern to match console.log, console.warn, console.debug, console.info
    # Handles multiline statements and various formats
    patterns = [
        # Simple single-line console statements
        r'^\s*console\.(log|warn|debug|info)\([^)]*\);\s*$',
        # Console statements that span multiple lines (up to 5 lines)
        r'^\s*console\.(log|warn|debug|info)\([^;]*?\);\s*$',
    ]

    lines = content.split('\n')
    result_lines = []
    skip_next = False
    i = 0

    while i < len(lines):
        line = lines[i]

        # Check if this line contains a console statement we want to remove
        if re.search(r'console\.(log|warn|debug|info)\(', line):
            # Check if it's a complete statement on one line
            if ');' in line or line.rstrip().endswith(')'):
                # Skip this line entirely
                i += 1
                continue
            else:
                # Multi-line console statement - find the end
                j = i
                statement = line
                while j < len(lines) and ');' not in lines[j]:
                    j += 1
                    if j < len(lines):
                        statement += '\n' + lines[j]

                # Skip all lines in this console statement
                i = j + 1
                continue

        result_lines.append(line)
        i += 1

    return '\n'.join(result_lines)

def process_file(file_path):
    """Process a single file to remove console statements."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if file has any console statements to remove
        if not re.search(r'console\.(log|warn|debug|info)\(', content):
            return 0

        # Count console statements before removal
        count = len(re.findall(r'console\.(log|warn|debug|info)\(', content))

        # Remove console statements
        new_content = remove_console_statements(content)

        # Write back the modified content
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)

        return count
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return 0

def main():
    frontend_src = Path(r'd:\Web_dev\React\BOLT PHASE-2\ES-TM Claude\frontend\src')

    files_to_process = [
        'contexts/ThemeContext.tsx',
        'config/axios.config.ts',
        'components/billing/TaskBillingView.tsx',
        'components/EmployeeTimesheet.tsx',
        'components/TeamReview.tsx',
        'components/timesheet/TimesheetForm.tsx',
        'components/settings/SecuritySettings.tsx',
        'components/RoleSwitcher.tsx',
        'lib/backendApi.ts',
        'hooks/useCopyToClipboard.ts',
        'hooks/useRoleManager.ts',
        'hooks/useLocalStorage.ts',
        'store/contexts/AuthContext.tsx',
        'services/UserService.ts',
        'services/TimesheetService.ts',
        'services/TimesheetApprovalService.ts',
        'services/ClientService.ts',
        'services/ReportService.ts',
        'services/ProjectService.ts',
        'services/AuditLogService.ts',
        'services/BackendTimesheetService.ts',
        'pages/NewManagementDashboard.tsx',
        'pages/auth/ResetPasswordPage.tsx',
        'pages/auth/LoginPage.tsx',
        'pages/EmployeeDashboard.tsx',
        'pages/admin/AuditLogsPage.tsx',
    ]

    total_removed = 0
    files_processed = 0

    for file_rel_path in files_to_process:
        file_path = frontend_src / file_rel_path
        if file_path.exists():
            count = process_file(file_path)
            if count > 0:
                print(f"Removed {count} console statements from {file_rel_path}")
                total_removed += count
                files_processed += 1
        else:
            print(f"File not found: {file_path}")

    print(f"\n✅ Total: Removed {total_removed} console statements from {files_processed} files")

if __name__ == '__main__':
    main()
