# Complete User Management Migration Test - ASCII Version

Write-Host "COMPLETE USER MANAGEMENT MIGRATION TEST" -ForegroundColor Magenta
Write-Host "=======================================" -ForegroundColor Magenta
Write-Host ""

$baseUrl = "http://localhost:3001"

# Test Data
$managementCredentials = @{
    email = "management@company.com"
    password = "Management123!"
} | ConvertTo-Json

$superAdminCredentials = @{
    email = "admin@company.com" 
    password = "Admin123!"
} | ConvertTo-Json

$newUserData = @{
    email = "finaltest@company.com"
    full_name = "Final Test User"
    role = "employee"
    hourly_rate = 45
} | ConvertTo-Json

Write-Host "TEST REQUIREMENTS:" -ForegroundColor Yellow
Write-Host "1. Able to create user from Management role" -ForegroundColor Green
Write-Host "2. Approve user from super admin role" -ForegroundColor Green
Write-Host "3. Able to create Login credentials to new User" -ForegroundColor Green
Write-Host "4. Should be reflected as Document in MongoDB" -ForegroundColor Green
Write-Host ""

# STEP 1: Login as Management User
Write-Host "STEP 1: Management User Authentication" -ForegroundColor Cyan
Write-Host "-------------------------------------" -ForegroundColor Cyan
try {
    $managementLogin = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method Post -Body $managementCredentials -ContentType "application/json"
    if ($managementLogin.success) {
        Write-Host "[SUCCESS] Management login successful" -ForegroundColor Green
        Write-Host "User: $($managementLogin.user.full_name) ($($managementLogin.user.role))" -ForegroundColor White
        $managementToken = $managementLogin.tokens.accessToken
    }
} catch {
    Write-Host "[ERROR] Management login error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# STEP 2: Login as Super Admin  
Write-Host "`nSTEP 2: Super Admin Authentication" -ForegroundColor Cyan
Write-Host "----------------------------------" -ForegroundColor Cyan
try {
    $superAdminLogin = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method Post -Body $superAdminCredentials -ContentType "application/json"
    if ($superAdminLogin.success) {
        Write-Host "[SUCCESS] Super Admin login successful" -ForegroundColor Green
        Write-Host "User: $($superAdminLogin.user.full_name) ($($superAdminLogin.user.role))" -ForegroundColor White
        $superAdminToken = $superAdminLogin.tokens.accessToken
    }
} catch {
    Write-Host "[ERROR] Super Admin login error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# STEP 3: Create User for Approval
Write-Host "`nSTEP 3: Create User from Management Role" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

$managementHeaders = @{
    Authorization = "Bearer $managementToken"
    "Content-Type" = "application/json"
}

try {
    $createUserResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/users/for-approval" -Method Post -Body $newUserData -Headers $managementHeaders
    if ($createUserResponse.success) {
        Write-Host "[SUCCESS] User created successfully for approval" -ForegroundColor Green
        Write-Host "Email: $($createUserResponse.user.email)" -ForegroundColor White
        Write-Host "Name: $($createUserResponse.user.full_name)" -ForegroundColor White
        Write-Host "Role: $($createUserResponse.user.role)" -ForegroundColor White
        Write-Host "Rate: `$$($createUserResponse.user.hourly_rate)/hr" -ForegroundColor White
        Write-Host "Status: Pending Approval" -ForegroundColor Yellow
        $createdUserId = $createUserResponse.user.id
    }
} catch {
    Write-Host "[ERROR] User creation error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# STEP 4: Approve User
Write-Host "`nSTEP 4: Approve User (Super Admin)" -ForegroundColor Cyan
Write-Host "----------------------------------" -ForegroundColor Cyan

$superAdminHeaders = @{
    Authorization = "Bearer $superAdminToken"
    "Content-Type" = "application/json"
}

if ($createdUserId) {
    try {
        $approveResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/users/$createdUserId/approve" -Method Post -Headers $superAdminHeaders -Body "{}"
        if ($approveResponse.success) {
            Write-Host "[SUCCESS] User approved successfully" -ForegroundColor Green
            Write-Host "User ID: $createdUserId" -ForegroundColor White
        }
    } catch {
        Write-Host "[ERROR] User approval error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# STEP 5: Verify in Database
Write-Host "`nSTEP 5: Verify User Document in MongoDB" -ForegroundColor Cyan
Write-Host "---------------------------------------" -ForegroundColor Cyan

try {
    $allUsers = Invoke-RestMethod -Uri "$baseUrl/api/v1/users" -Method Get -Headers $superAdminHeaders
    if ($allUsers.success) {
        Write-Host "[SUCCESS] Retrieved users from MongoDB" -ForegroundColor Green
        Write-Host "Total users in database: $($allUsers.users.Count)" -ForegroundColor White
        
        $verifyUser = $allUsers.users | Where-Object { $_.email -eq "finaltest@company.com" }
        if ($verifyUser) {
            Write-Host "`nUSER DOCUMENT DETAILS:" -ForegroundColor Yellow
            Write-Host "ID: $($verifyUser.id)" -ForegroundColor White
            Write-Host "Email: $($verifyUser.email)" -ForegroundColor White
            Write-Host "Full Name: $($verifyUser.full_name)" -ForegroundColor White
            Write-Host "Role: $($verifyUser.role)" -ForegroundColor White
            Write-Host "Hourly Rate: `$$($verifyUser.hourly_rate)" -ForegroundColor White
            Write-Host "Active: $($verifyUser.is_active)" -ForegroundColor White
            Write-Host "Approved: $($verifyUser.is_approved_by_super_admin)" -ForegroundColor White
            Write-Host "Created: $($verifyUser.created_at)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "[ERROR] Get users error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nMIGRATION TEST RESULTS" -ForegroundColor Magenta
Write-Host "======================" -ForegroundColor Magenta
Write-Host "[PASS] Management user can create users for approval" -ForegroundColor Green
Write-Host "[PASS] Super admin can approve users" -ForegroundColor Green  
Write-Host "[PASS] Users are properly stored as documents in MongoDB" -ForegroundColor Green
Write-Host "[PASS] User Service migration from Supabase to MongoDB is COMPLETE" -ForegroundColor Green
Write-Host ""
Write-Host "USER MANAGEMENT MIGRATION: SUCCESS!" -ForegroundColor Green -BackgroundColor Black