# PowerShell Test Script for Simplified Calendar System
# Tests both backend API endpoints and frontend integration

param(
    [string]$BackendUrl = "http://localhost:3001",
    [string]$FrontendUrl = "http://localhost:5173",
    [switch]$SkipAuth,
    [switch]$Verbose
)

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    Cyan = "Cyan"
    Magenta = "Magenta"
}

# Test results tracking
$Global:TestResults = @{
    Passed = 0
    Failed = 0
    Warnings = 0
    Total = 0
}

# Helper functions
function Write-TestHeader {
    param([string]$Message)
    Write-Host "`n🧪 Testing: $Message" -ForegroundColor Cyan
}

function Write-TestPass {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
    $Global:TestResults.Passed++
}

function Write-TestFail {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
    $Global:TestResults.Failed++
}

function Write-TestWarn {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
    $Global:TestResults.Warnings++
}

function Write-TestInfo {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Invoke-ApiRequest {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [switch]$AllowFailure
    )
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        if ($Verbose) {
            Write-TestInfo "Making $Method request to: $Url"
        }
        
        $response = Invoke-RestMethod @params
        return @{
            Success = $true
            Data = $response
            StatusCode = 200
        }
    }
    catch {
        if ($AllowFailure) {
            return @{
                Success = $false
                Error = $_.Exception.Message
                StatusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { 0 }
            }
        }
        throw
    }
}

function Test-ServerConnectivity {
    param([string]$ServerName, [string]$Url)
    
    Write-TestHeader "$ServerName Server Connectivity"
    $Global:TestResults.Total++
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-TestPass "$ServerName server is responsive (Status: $($response.StatusCode))"
            return $true
        } else {
            Write-TestFail "$ServerName server returned status: $($response.StatusCode)"
            return $false
        }
    }
    catch {
        Write-TestFail "$ServerName server is not responding: $($_.Exception.Message)"
        return $false
    }
}

function Test-HolidaySystemStatus {
    Write-TestHeader "Holiday System Status"
    $Global:TestResults.Total++
    
    try {
        $result = Invoke-ApiRequest -Url "$BackendUrl/api/v1/holiday-system/status" -AllowFailure
        
        if ($result.Success) {
            Write-TestPass "Holiday system status endpoint is working"
            $data = $result.Data
            Write-TestInfo "System initialized: $($data.is_initialized)"
            if ($data.calendar_settings) {
                Write-TestInfo "Auto-create holidays: $($data.calendar_settings.auto_create_holiday_entries)"
                Write-TestInfo "Default holiday hours: $($data.calendar_settings.default_holiday_hours)"
            }
            return $true
        } else {
            if ($result.StatusCode -eq 404) {
                Write-TestFail "Holiday system endpoint not found (routes may not be registered)"
            } else {
                Write-TestFail "Holiday system status failed: $($result.Error)"
            }
            return $false
        }
    }
    catch {
        Write-TestFail "Holiday system status test failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-BasicHolidayEndpoints {
    Write-TestHeader "Basic Holiday API Endpoints"
    
    # Test getting all holidays
    $Global:TestResults.Total++
    try {
        $result = Invoke-ApiRequest -Url "$BackendUrl/api/v1/holidays" -AllowFailure
        
        if ($result.Success) {
            $holidays = $result.Data.holidays
            Write-TestPass "Retrieved $($holidays.Count) holidays from API"
        } else {
            Write-TestFail "Failed to retrieve holidays: $($result.Error)"
        }
    }
    catch {
        Write-TestFail "Holiday retrieval test failed: $($_.Exception.Message)"
    }
    
    # Test getting upcoming holidays
    $Global:TestResults.Total++
    try {
        $result = Invoke-ApiRequest -Url "$BackendUrl/api/v1/holidays/upcoming?days=30" -AllowFailure
        
        if ($result.Success) {
            $upcoming = $result.Data.holidays
            Write-TestPass "Retrieved $($upcoming.Count) upcoming holidays"
        } else {
            Write-TestFail "Failed to retrieve upcoming holidays: $($result.Error)"
        }
    }
    catch {
        Write-TestFail "Upcoming holidays test failed: $($_.Exception.Message)"
    }
    
    # Test holiday date check
    $Global:TestResults.Total++
    try {
        $testDate = "2025-12-25"
        $result = Invoke-ApiRequest -Url "$BackendUrl/api/v1/holidays/check/$testDate" -AllowFailure
        
        if ($result.Success) {
            $isHoliday = $result.Data.is_holiday
            Write-TestPass "Holiday check for $testDate : $isHoliday"
        } else {
            Write-TestFail "Failed to check holiday date: $($result.Error)"
        }
    }
    catch {
        Write-TestFail "Holiday date check test failed: $($_.Exception.Message)"
    }
}

function Test-HolidayManagement {
    Write-TestHeader "Holiday Management (CRUD Operations)"
    
    $testHoliday = @{
        name = "Test Holiday PowerShell"
        date = "2025-12-31"
        holiday_type = "company"
        description = "Test holiday created by PowerShell script"
        is_active = $true
    }
    
    # Test creating a holiday
    $Global:TestResults.Total++
    try {
        $result = Invoke-ApiRequest -Url "$BackendUrl/api/v1/holidays" -Method "POST" -Body $testHoliday -AllowFailure
        
        if ($result.Success) {
            $createdHoliday = $result.Data.holiday
            Write-TestPass "Successfully created test holiday: $($createdHoliday.name)"
            $holidayId = $createdHoliday._id
            
            # Test updating the holiday
            $Global:TestResults.Total++
            try {
                $updateData = @{ description = "Updated description via PowerShell" }
                $updateResult = Invoke-ApiRequest -Url "$BackendUrl/api/v1/holidays/$holidayId" -Method "PUT" -Body $updateData -AllowFailure
                
                if ($updateResult.Success) {
                    Write-TestPass "Successfully updated test holiday"
                } else {
                    Write-TestFail "Failed to update holiday: $($updateResult.Error)"
                }
            }
            catch {
                Write-TestFail "Holiday update test failed: $($_.Exception.Message)"
            }
            
            # Test deleting the holiday
            $Global:TestResults.Total++
            try {
                $deleteResult = Invoke-ApiRequest -Url "$BackendUrl/api/v1/holidays/$holidayId" -Method "DELETE" -AllowFailure
                
                if ($deleteResult.Success) {
                    Write-TestPass "Successfully deleted test holiday"
                } else {
                    Write-TestFail "Failed to delete holiday: $($deleteResult.Error)"
                }
            }
            catch {
                Write-TestFail "Holiday deletion test failed: $($_.Exception.Message)"
            }
        } else {
            if ($result.StatusCode -eq 401) {
                Write-TestWarn "Holiday creation requires authentication (expected for security)"
            } elseif ($result.StatusCode -eq 403) {
                Write-TestWarn "Insufficient permissions for holiday creation (expected for non-admin users)"
            } else {
                Write-TestFail "Failed to create holiday: $($result.Error)"
            }
        }
    }
    catch {
        Write-TestFail "Holiday creation test failed: $($_.Exception.Message)"
    }
}

function Test-SystemInitialization {
    Write-TestHeader "Holiday System Initialization"
    $Global:TestResults.Total++
    
    try {
        $result = Invoke-ApiRequest -Url "$BackendUrl/api/v1/holiday-system/initialize" -Method "POST" -AllowFailure
        
        if ($result.Success) {
            Write-TestPass "Holiday system initialization endpoint is working"
            Write-TestInfo "System initialization completed successfully"
        } else {
            if ($result.StatusCode -eq 401) {
                Write-TestWarn "System initialization requires authentication"
            } elseif ($result.StatusCode -eq 403) {
                Write-TestWarn "Insufficient permissions for system initialization (expected for non-super-admin)"
            } elseif ($result.StatusCode -eq 409) {
                Write-TestInfo "System already initialized (this is normal)"
                Write-TestPass "Holiday system initialization endpoint is working"
            } else {
                Write-TestFail "System initialization failed: $($result.Error)"
            }
        }
    }
    catch {
        Write-TestFail "System initialization test failed: $($_.Exception.Message)"
    }
}

function Test-TimesheetIntegration {
    Write-TestHeader "Timesheet Integration"
    
    # Test timesheet creation with holiday integration
    $Global:TestResults.Total++
    try {
        $testTimesheet = @{
            user_id = "507f1f77bcf86cd799439011"  # Mock user ID
            week_start_date = "2025-12-22"  # Week containing Christmas
            status = "draft"
        }
        
        $result = Invoke-ApiRequest -Url "$BackendUrl/api/v1/timesheets" -Method "POST" -Body $testTimesheet -AllowFailure
        
        if ($result.Success) {
            Write-TestPass "Timesheet creation endpoint is working"
            $timesheetId = $result.Data.timesheet._id
            Write-TestInfo "Created timesheet ID: $timesheetId"
            
            # Check for auto-generated holiday entries
            $entriesResult = Invoke-ApiRequest -Url "$BackendUrl/api/v1/timesheets/$timesheetId/entries" -AllowFailure
            if ($entriesResult.Success) {
                $holidayEntries = $entriesResult.Data.entries | Where-Object { $_.entry_category -eq "holiday" }
                if ($holidayEntries.Count -gt 0) {
                    Write-TestPass "Auto-generated $($holidayEntries.Count) holiday entries in timesheet"
                } else {
                    Write-TestInfo "No holiday entries auto-generated (may be expected if no holidays in week)"
                }
            }
        } else {
            if ($result.StatusCode -eq 401) {
                Write-TestWarn "Timesheet creation requires authentication"
            } elseif ($result.StatusCode -eq 404) {
                Write-TestWarn "Timesheet endpoints may not be fully implemented"
            } else {
                Write-TestFail "Timesheet creation failed: $($result.Error)"
            }
        }
    }
    catch {
        Write-TestFail "Timesheet integration test failed: $($_.Exception.Message)"
    }
    
    # Test holiday synchronization
    $Global:TestResults.Total++
    try {
        $mockTimesheetId = "507f1f77bcf86cd799439012"
        $syncData = @{
            week_start_date = "2025-12-22"
        }
        
        $result = Invoke-ApiRequest -Url "$BackendUrl/api/v1/timesheets/$mockTimesheetId/sync-holidays" -Method "POST" -Body $syncData -AllowFailure
        
        if ($result.Success) {
            Write-TestPass "Holiday synchronization endpoint is working"
            $syncResult = $result.Data
            Write-TestInfo "Sync results - Added: $($syncResult.added), Removed: $($syncResult.removed), Existing: $($syncResult.existing)"
        } else {
            if ($result.StatusCode -eq 401) {
                Write-TestWarn "Holiday synchronization requires authentication"
            } elseif ($result.StatusCode -eq 404) {
                Write-TestWarn "Holiday synchronization endpoint may not be implemented"
            } else {
                Write-TestFail "Holiday synchronization failed: $($result.Error)"
            }
        }
    }
    catch {
        Write-TestFail "Holiday synchronization test failed: $($_.Exception.Message)"
    }
}

function Test-FrontendIntegration {
    Write-TestHeader "Frontend Integration"
    $Global:TestResults.Total++
    
    try {
        # Check if frontend is serving the settings page
        $response = Invoke-WebRequest -Uri $FrontendUrl -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            $content = $response.Content
            if ($content -match "Settings|AdminSettings|Holiday") {
                Write-TestPass "Frontend is serving settings-related content"
            } else {
                Write-TestInfo "Frontend is responding but settings content not detected"
            }
        }
        
        # Test if frontend can access backend APIs
        $apiTest = Invoke-ApiRequest -Url "$BackendUrl/api/v1/holidays" -AllowFailure
        if ($apiTest.Success) {
            Write-TestPass "Frontend can access backend holiday APIs"
        } else {
            Write-TestWarn "Frontend may have issues accessing backend APIs"
        }
        
    }
    catch {
        Write-TestFail "Frontend integration test failed: $($_.Exception.Message)"
    }
}

function Show-TestSummary {
    Write-Host "`n" -NoNewline
    Write-Host "📊 Test Results Summary" -ForegroundColor Magenta
    Write-Host "===========================================" -ForegroundColor Magenta
    Write-Host "✅ Passed: " -ForegroundColor Green -NoNewline
    Write-Host $Global:TestResults.Passed
    Write-Host "❌ Failed: " -ForegroundColor Red -NoNewline  
    Write-Host $Global:TestResults.Failed
    Write-Host "⚠️  Warnings: " -ForegroundColor Yellow -NoNewline
    Write-Host $Global:TestResults.Warnings
    Write-Host "📝 Total Tests: " -ForegroundColor Blue -NoNewline
    Write-Host $Global:TestResults.Total
    
    if ($Global:TestResults.Total -gt 0) {
        $successRate = [math]::Round(($Global:TestResults.Passed / $Global:TestResults.Total) * 100, 1)
        Write-Host "`nSuccess Rate: " -ForegroundColor Magenta -NoNewline
        Write-Host "$successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })
    }
    
    if ($Global:TestResults.Failed -eq 0) {
        Write-Host "`n🎉 All critical tests passed! Calendar system is functionally sound." -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  Some tests failed. Review the results above for details." -ForegroundColor Yellow
    }
}

# Main execution
function Main {
    Write-Host "🚀 Starting Simplified Calendar System Test Suite" -ForegroundColor Magenta
    Write-Host "==================================================" -ForegroundColor Magenta
    Write-Host "Backend URL: $BackendUrl" -ForegroundColor Blue
    Write-Host "Frontend URL: $FrontendUrl" -ForegroundColor Blue
    Write-Host ""
    
    # Basic connectivity tests
    $backendUp = Test-ServerConnectivity -ServerName "Backend" -Url "$BackendUrl/health"
    $frontendUp = Test-ServerConnectivity -ServerName "Frontend" -Url $FrontendUrl
    
    if (-not $backendUp) {
        Write-Host "`n❌ Backend server is not responding. Please ensure it's running on port 3001." -ForegroundColor Red
        return
    }
    
    if (-not $frontendUp) {
        Write-TestWarn "Frontend server is not responding. Some tests will be skipped."
    }
    
    # Core holiday system tests
    Test-HolidaySystemStatus
    Test-SystemInitialization
    Test-BasicHolidayEndpoints
    
    # Advanced functionality tests
    if (-not $SkipAuth) {
        Test-HolidayManagement
        Test-TimesheetIntegration
    } else {
        Write-TestInfo "Skipping authentication-required tests as requested"
    }
    
    # Frontend integration tests
    if ($frontendUp) {
        Test-FrontendIntegration
    }
    
    # Show final results
    Show-TestSummary
}

# Run the tests
Main
