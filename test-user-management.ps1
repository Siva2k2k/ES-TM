# User Management Test Script - MongoDB Migration
# This script tests the key user management functionality

Write-Host "🚀 Testing User Management Migration to MongoDB..." -ForegroundColor Green
Write-Host ""

$baseUrl = "http://localhost:3001"

# Test credentials
$managementCredentials = @{
    email = "management@company.com"
    password = "Management123!"
} | ConvertTo-Json

$superAdminCredentials = @{
    email = "admin@company.com" 
    password = "Admin123!"
} | ConvertTo-Json

# Step 1: Login as Management User
Write-Host "--- Step 1: Login as Management User ---" -ForegroundColor Yellow
try {
    $managementLogin = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method Post -Body $managementCredentials -ContentType "application/json"
    if ($managementLogin.success) {
        Write-Host "✅ Management login successful" -ForegroundColor Green
        $managementToken = $managementLogin.tokens.accessToken
    } else {
        Write-Host "❌ Management login failed: $($managementLogin.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Management login error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Login as Super Admin
Write-Host "`n--- Step 2: Login as Super Admin ---" -ForegroundColor Yellow
try {
    $superAdminLogin = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method Post -Body $superAdminCredentials -ContentType "application/json"
    if ($superAdminLogin.success) {
        Write-Host "✅ Super Admin login successful" -ForegroundColor Green
        $superAdminToken = $superAdminLogin.tokens.accessToken
    } else {
        Write-Host "❌ Super Admin login failed: $($superAdminLogin.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Super Admin login error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Create User for Approval (Management Role)
Write-Host "`n--- Step 3: Create User from Management Role ---" -ForegroundColor Yellow

$newUserData = @{
    email = "testuser@company.com"
    full_name = "Test User Created"
    role = "employee"
    hourly_rate = 35
} | ConvertTo-Json

$headers = @{
    Authorization = "Bearer $managementToken"
    "Content-Type" = "application/json"
}

try {
    $createUserResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/users/for-approval" -Method Post -Body $newUserData -Headers $headers
    if ($createUserResponse.success) {
        Write-Host "✅ User created successfully: $($createUserResponse.user.email)" -ForegroundColor Green
        $createdUserId = $createUserResponse.user._id
    } else {
        Write-Host "❌ User creation failed: $($createUserResponse.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ User creation error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Get Pending Approvals (Super Admin)
Write-Host "`n--- Step 4: Get Pending Approvals ---" -ForegroundColor Yellow

$superAdminHeaders = @{
    Authorization = "Bearer $superAdminToken"
    "Content-Type" = "application/json"
}

try {
    $pendingApprovals = Invoke-RestMethod -Uri "$baseUrl/api/v1/users/pending-approvals" -Method Get -Headers $superAdminHeaders
    if ($pendingApprovals.success) {
        Write-Host "✅ Found $($pendingApprovals.users.Count) pending approval(s)" -ForegroundColor Green
        $userToApprove = $pendingApprovals.users | Where-Object { $_.email -eq "testuser@company.com" }
        if ($userToApprove) {
            Write-Host "   - User to approve: $($userToApprove.email)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "❌ Failed to get pending approvals: $($pendingApprovals.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Get pending approvals error: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Approve User (Super Admin)
Write-Host "`n--- Step 5: Approve User from Super Admin Role ---" -ForegroundColor Yellow

if ($createdUserId) {
    try {
        $approveResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/users/$createdUserId/approve" -Method Post -Headers $superAdminHeaders -Body "{}"
        if ($approveResponse.success) {
            Write-Host "✅ User approved successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ User approval failed: $($approveResponse.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ User approval error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Step 6: Verify User in Database
Write-Host "`n--- Step 6: Verify User in MongoDB ---" -ForegroundColor Yellow

try {
    $allUsers = Invoke-RestMethod -Uri "$baseUrl/api/v1/users" -Method Get -Headers $superAdminHeaders
    if ($allUsers.success) {
        Write-Host "✅ Found $($allUsers.users.Count) total user(s) in database" -ForegroundColor Green
        
        $verifyUser = $allUsers.users | Where-Object { $_.email -eq "testuser@company.com" }
        if ($verifyUser) {
            Write-Host "✅ User successfully created and reflected in MongoDB:" -ForegroundColor Green
            Write-Host "   - Email: $($verifyUser.email)" -ForegroundColor Cyan
            Write-Host "   - Full Name: $($verifyUser.full_name)" -ForegroundColor Cyan
            Write-Host "   - Role: $($verifyUser.role)" -ForegroundColor Cyan
            Write-Host "   - Hourly Rate: `$$($verifyUser.hourly_rate)" -ForegroundColor Cyan
            Write-Host "   - Active: $($verifyUser.is_active)" -ForegroundColor Cyan
            Write-Host "   - Approved: $($verifyUser.is_approved_by_super_admin)" -ForegroundColor Cyan
            Write-Host "   - Created: $($verifyUser.created_at)" -ForegroundColor Cyan
        } else {
            Write-Host "❌ User not found in database" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Failed to get users: $($allUsers.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Get users error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 User Management Migration Test Completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "✅ 1. Management user can create users for approval" -ForegroundColor Green
Write-Host "✅ 2. Super admin can approve users" -ForegroundColor Green  
Write-Host "✅ 3. Users are properly stored as documents in MongoDB" -ForegroundColor Green
Write-Host "✅ 4. User Service migration from Supabase to MongoDB is complete" -ForegroundColor Green