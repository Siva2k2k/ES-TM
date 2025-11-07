# ID Validation Fixes Needed

## Handlers requiring ID validation:

1. handleRemoveProjectMember - projectId, userId
2. handleUpdateProject - projectId, clientId (optional)
3. handleUpdateTask - taskId
4. handleDeleteProject - projectId ✓ (already has error)
5. handleUpdateClient - clientId
6. handleDeleteClient - clientId
7. handleCreateTimesheet - userId (optional, defaults to authUser)
8. handleDeleteTimesheet - timesheetId
9. handleDeleteEntries - timesheetId, entryId
10. handleCopyEntry - timesheetId, entryId
11. handleApproveProjectWeek - projectId
12. handleRejectProjectWeek - projectId
13. handleSendReminder - projectId
14. handleExportProjectBilling - projectIds (array), clientIds (optional array)
15. handleExportUserBilling - userIds (array), projectIds (optional), clientIds (optional)
16. handleGetAuditLogs - no ID validation needed (filters)

## User/Client/Project creation handlers
These use VoiceFieldMapper which already handles validation, so IDs come pre-validated.
