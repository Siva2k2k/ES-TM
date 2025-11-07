# Microsoft SSO Implementation Guide

This guide explains how to configure and use Microsoft SSO (Single Sign-On) with your application.

## Features

✅ **Traditional OAuth Flow** - "Sign in with Microsoft" button on login page
✅ **SharePoint Seamless Login** - Silent authentication for users coming from SharePoint
✅ **Auto-merge Accounts** - Existing local accounts automatically link to Microsoft accounts
✅ **Manual Account Linking** - Users can link Microsoft account from settings
✅ **Unified JWT Tokens** - Both local and Microsoft auth use same JWT system
✅ **Audit Logging** - All SSO events are logged for security tracking

---

## Prerequisites

1. Azure AD (Microsoft Entra ID) account
2. Application registered in Azure Portal
3. Client ID, Client Secret, and Tenant ID from Azure

---

## Azure App Registration Setup

### Step 1: Create App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure:
   - **Name**: Your App Name (e.g., "ES-TM Employee Timesheet")
   - **Supported account types**: Choose based on your needs:
     - Single tenant (your organization only)
     - Multi-tenant (any Azure AD tenant)
     - Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**:
     - **Web**: `https://your-app.herokuapp.com/api/v1/auth/microsoft/callback`
     - **SPA**: `https://your-app.herokuapp.com`

### Step 2: Configure Authentication

1. Go to **Authentication** section
2. Add redirect URIs:
   - **Development Backend**: `http://localhost:3001/api/v1/auth/microsoft/callback`
   - **Development Frontend**: `http://localhost:5173`
   - **Production Backend**: `https://your-app.herokuapp.com/api/v1/auth/microsoft/callback`
   - **Production Frontend**: `https://your-app.herokuapp.com`
3. Enable **Access tokens** and **ID tokens** under Implicit grant and hybrid flows
4. Set **Supported account types** as needed
5. Click **Save**

### Step 3: Create Client Secret

1. Go to **Certificates & secrets** > **Client secrets**
2. Click **New client secret**
3. Add description: "Production Secret" or "Development Secret"
4. Set expiry (e.g., 24 months)
5. Click **Add**
6. **IMPORTANT**: Copy the secret value immediately (it won't be shown again)

### Step 4: Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission** > **Microsoft Graph** > **Delegated permissions**
3. Add these permissions:
   - `openid` - Sign in and read user profile
   - `profile` - View user's basic profile
   - `email` - View user's email address
   - `User.Read` - Read user profile
4. Click **Add permissions**
5. Click **Grant admin consent** (if you have admin rights)

### Step 5: Get Configuration Values

From the **Overview** page, copy:
- **Application (client) ID** - This is your `MICROSOFT_CLIENT_ID`
- **Directory (tenant) ID** - This is your `MICROSOFT_TENANT_ID`
- **Client Secret Value** (from step 3) - This is your `MICROSOFT_CLIENT_SECRET`

---

## Backend Configuration

### 1. Environment Variables

Add to `backend/.env`:

```env
# Microsoft SSO Configuration
MICROSOFT_CLIENT_ID=your_actual_client_id_here
MICROSOFT_CLIENT_SECRET=your_actual_client_secret_here
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:3001/api/v1/auth/microsoft/callback
FRONTEND_URL=http://localhost:5173
```

**Tenant ID Options:**
- `common` - Multi-tenant (any Microsoft account)
- `organizations` - Any organizational account
- `consumers` - Personal Microsoft accounts only
- `{tenant-id}` - Specific tenant only

### 2. Production Configuration (Heroku)

Set environment variables on Heroku:

```bash
heroku config:set MICROSOFT_CLIENT_ID=your_client_id
heroku config:set MICROSOFT_CLIENT_SECRET=your_client_secret
heroku config:set MICROSOFT_TENANT_ID=common
heroku config:set MICROSOFT_REDIRECT_URI=https://your-app.herokuapp.com/api/v1/auth/microsoft/callback
heroku config:set FRONTEND_URL=https://your-app.herokuapp.com
```

---

## Frontend Configuration

### 1. Environment Variables

Add to `frontend/.env`:

```env
# Microsoft SSO Configuration
VITE_MICROSOFT_CLIENT_ID=your_actual_client_id_here
VITE_MICROSOFT_TENANT_ID=common
VITE_MICROSOFT_REDIRECT_URI=http://localhost:5173
```

### 2. Production Configuration

For production, update `.env.production` or set via build process:

```env
VITE_MICROSOFT_CLIENT_ID=your_client_id
VITE_MICROSOFT_TENANT_ID=common
VITE_MICROSOFT_REDIRECT_URI=https://your-app.herokuapp.com
```

---

## Usage

### 1. Sign in with Microsoft Button

Users can click the "Sign in with Microsoft" button on the login page:

1. User clicks button → Redirects to Microsoft login
2. User authenticates with Microsoft
3. Microsoft redirects back with authorization code
4. Backend exchanges code for tokens
5. Backend checks if user exists:
   - **If Microsoft ID exists**: Login existing user
   - **If email exists**: Auto-merge with local account
   - **If neither exists**: Create new user (role: employee, pending approval)
6. Backend generates JWT tokens
7. Frontend stores JWT and redirects to dashboard

### 2. SharePoint Seamless Login

When users access the app from SharePoint:

1. MSAL attempts silent authentication on app load
2. If user has active Microsoft session, authentication happens automatically
3. User is redirected through OAuth flow silently
4. User lands on dashboard without clicking anything

**Note**: For full seamless authentication, ensure SharePoint users access the app via the correct domain registered in Azure AD.

### 3. Account Linking (Manual)

Existing users can link their Microsoft account:

1. User logs in with email/password
2. Goes to Settings > Account
3. Clicks "Link Microsoft Account"
4. Authenticates with Microsoft
5. Account is linked - user can now use either login method

---

## Authentication Flow Diagrams

### Traditional "Sign in with Microsoft" Flow

```
User clicks button
    ↓
Frontend: Redirect to /api/v1/auth/microsoft
    ↓
Backend: Generate authorization URL with state (CSRF)
    ↓
Backend: Redirect to Microsoft login
    ↓
User authenticates with Microsoft
    ↓
Microsoft: Redirect to /api/v1/auth/microsoft/callback?code=...&state=...
    ↓
Backend: Validate state (CSRF)
    ↓
Backend: Exchange code for Microsoft token
    ↓
Backend: Extract user info (id, email, name)
    ↓
Backend: Check if user exists
    ├─ Microsoft ID exists → Login user
    ├─ Email exists → Auto-merge accounts
    └─ New user → Create with role: employee
    ↓
Backend: Generate JWT tokens
    ↓
Backend: Redirect to frontend with tokens
    ↓
Frontend: Store JWT in localStorage
    ↓
Frontend: Load user profile
    ↓
Frontend: Redirect to dashboard
```

### SharePoint Seamless Login Flow

```
User accesses app from SharePoint
    ↓
Frontend: App loads
    ↓
Frontend: Check if JWT exists in localStorage
    ├─ YES → Load user and continue
    └─ NO → Attempt silent Microsoft auth
        ↓
        MSAL: Check for cached Microsoft account
        ├─ NO → Show normal login page
        └─ YES → Acquire token silently
            ↓
            MSAL: Success - User has active Microsoft session
            ↓
            Frontend: Auto-click "Sign in with Microsoft"
            (follows traditional flow above)
```

---

## Security Features

### 1. CSRF Protection
- State parameter used in OAuth flow
- Validated on callback to prevent CSRF attacks

### 2. Token Validation
- Microsoft tokens validated by MSAL Node
- JWTs signed and verified with secret keys
- Token expiry checked on every request

### 3. Account Security
- Microsoft accounts cannot be linked to multiple users
- Email conflicts handled gracefully
- Failed login attempts tracked (existing feature)
- Account lockout after multiple failures (existing feature)

### 4. Audit Logging
All SSO events are logged:
- `USER_LOGIN` - SSO login success/failure
- `USER_CREATED` - New user from SSO
- `USER_ACCOUNT_MERGED` - Auto-merge event
- `USER_ACCOUNT_LINKED` - Manual link event

---

## Database Schema

### User Model Changes

```typescript
{
  // Existing fields...
  email: string;
  password_hash?: string;  // Optional (not required for SSO users)

  // New SSO fields
  auth_provider: 'local' | 'microsoft';  // Default: 'local'
  microsoft_id?: string;                 // Azure AD user ID
  microsoft_email?: string;              // Microsoft account email
  avatar_url?: string;                   // Profile picture URL
  last_sso_login?: Date;                 // Last SSO login timestamp
}
```

### Indexes Added

```javascript
UserSchema.index({ microsoft_id: 1 }, { sparse: true });
UserSchema.index({ auth_provider: 1 });
```

---

## Troubleshooting

### Issue: "Sign in with Microsoft" button not showing

**Solution**: Check that MSAL is configured:
```typescript
// frontend/src/config/msalConfig.ts
export const isMsalConfigured = (): boolean => {
  return Boolean(import.meta.env.VITE_MICROSOFT_CLIENT_ID);
};
```

Ensure `VITE_MICROSOFT_CLIENT_ID` is set in `.env`

### Issue: "Failed to initiate Microsoft login"

**Cause**: Backend MSAL configuration missing

**Solution**:
1. Check backend `.env` has `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET`
2. Check backend logs for MSAL initialization errors
3. Verify redirect URI matches Azure app registration

### Issue: "Invalid or expired token"

**Cause**: Microsoft token callback failed

**Solution**:
1. Verify `MICROSOFT_REDIRECT_URI` matches exactly in:
   - Backend `.env`
   - Azure app registration
2. Check that redirect URI uses correct protocol (http vs https)
3. For Heroku, use `https://` not `http://`

### Issue: "This Microsoft account is already linked to another user"

**Cause**: Microsoft ID is already associated with different account

**Solution**:
1. User must login to original account
2. Unlink Microsoft account from settings
3. Then link to desired account

### Issue: SharePoint seamless login not working

**Possible Causes**:
1. User doesn't have active Microsoft session
2. MSAL cache cleared
3. App accessed directly (not from SharePoint)
4. Different tenant domain

**Solution**:
1. Ensure user is logged into Microsoft (office.com, sharepoint.com)
2. Clear browser cache and try again
3. Verify `MICROSOFT_TENANT_ID` matches SharePoint tenant

### Issue: "Account pending approval" after SSO login

**Cause**: New SSO users are created with `is_approved_by_super_admin: false`

**Solution**:
1. Super admin needs to approve user in User Management page
2. Or update user directly in MongoDB:
```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { is_approved_by_super_admin: true } }
)
```

---

## Testing

### Local Testing Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Environment variables configured
- [ ] "Sign in with Microsoft" button appears
- [ ] Click button redirects to Microsoft login
- [ ] After authentication, redirects back to app
- [ ] JWT tokens stored in localStorage
- [ ] User profile loads correctly
- [ ] Dashboard displays

### Production Testing Checklist (Heroku)

- [ ] Heroku config vars set correctly
- [ ] Azure redirect URIs updated for production domain
- [ ] HTTPS redirect URIs (not HTTP)
- [ ] Test full login flow in production
- [ ] Test account auto-merge (existing email)
- [ ] Test new user creation
- [ ] Verify audit logs in database

---

## API Endpoints

### Microsoft SSO Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/auth/microsoft` | Initiate OAuth flow | No |
| GET | `/api/v1/auth/microsoft/callback` | Handle OAuth callback | No |
| POST | `/api/v1/auth/microsoft/link` | Link Microsoft account | Yes (JWT) |

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review Azure app registration configuration
3. Check backend logs for detailed error messages
4. Verify environment variables are correct
5. Test in incognito mode to rule out cache issues

---

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Rotate client secrets** - Update every 6-12 months
3. **Use specific tenant ID** - For production, avoid "common" if possible
4. **Enable MFA** - Require MFA for admin accounts
5. **Monitor audit logs** - Regularly review SSO login events
6. **Test logout flow** - Ensure sessions clear properly
7. **Secure redirect URIs** - Only whitelist necessary domains

---

## Additional Resources

- [Microsoft Identity Platform Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [MSAL Node Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node)
- [MSAL Browser Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-browser)
- [Azure AD App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
