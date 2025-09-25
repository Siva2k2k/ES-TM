const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test credentials
const MANAGEMENT_CREDENTIALS = {
  email: 'management@company.com',
  password: 'Management123!'
};

const SUPER_ADMIN_CREDENTIALS = {
  email: 'admin@company.com',
  password: 'Admin123!'
};

let managementToken = '';
let superAdminToken = '';

async function login(credentials) {
  try {
    console.log(`🔐 Logging in as ${credentials.email}...`);
    const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, credentials);
    
    if (response.data.success) {
      console.log(`✅ Login successful for ${credentials.email}`);
      return response.data.accessToken;
    } else {
      console.error('❌ Login failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    return null;
  }
}

async function createUserForApproval(token, userData) {
  try {
    console.log(`👤 Creating user for approval: ${userData.email}...`);
    const response = await axios.post(
      `${BASE_URL}/api/v1/users/for-approval`,
      userData,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ User created successfully:', response.data.user.email);
      return response.data.user;
    } else {
      console.error('❌ User creation failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ User creation error:', error.response?.data || error.message);
    return null;
  }
}

async function getPendingApprovals(token) {
  try {
    console.log('📋 Getting pending approvals...');
    const response = await axios.get(
      `${BASE_URL}/api/v1/users/pending-approvals`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    if (response.data.success) {
      console.log(`✅ Found ${response.data.users.length} pending approval(s)`);
      return response.data.users;
    } else {
      console.error('❌ Failed to get pending approvals:', response.data.error);
      return [];
    }
  } catch (error) {
    console.error('❌ Get pending approvals error:', error.response?.data || error.message);
    return [];
  }
}

async function approveUser(token, userId) {
  try {
    console.log(`✅ Approving user: ${userId}...`);
    const response = await axios.post(
      `${BASE_URL}/api/v1/users/${userId}/approve`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ User approved successfully');
      return true;
    } else {
      console.error('❌ User approval failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ User approval error:', error.response?.data || error.message);
    return false;
  }
}

async function getAllUsers(token) {
  try {
    console.log('👥 Getting all users...');
    const response = await axios.get(
      `${BASE_URL}/api/v1/users`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    if (response.data.success) {
      console.log(`✅ Found ${response.data.users.length} user(s)`);
      return response.data.users;
    } else {
      console.error('❌ Failed to get users:', response.data.error);
      return [];
    }
  } catch (error) {
    console.error('❌ Get users error:', error.response?.data || error.message);
    return [];
  }
}

async function testUserManagement() {
  console.log('🚀 Testing User Management Migration to MongoDB...\n');

  // Step 1: Login as management user
  managementToken = await login(MANAGEMENT_CREDENTIALS);
  if (!managementToken) {
    console.log('❌ Cannot proceed without management login');
    return;
  }

  // Step 2: Login as super admin
  superAdminToken = await login(SUPER_ADMIN_CREDENTIALS);
  if (!superAdminToken) {
    console.log('❌ Cannot proceed without super admin login');
    return;
  }

  console.log('\n--- Step 1: Create User from Management Role ---');
  
  // Step 3: Create a new user for approval (using management role)
  const newUserData = {
    email: 'newuser@company.com',
    full_name: 'New Test User',
    role: 'employee',
    hourly_rate: 30
  };

  const createdUser = await createUserForApproval(managementToken, newUserData);
  if (!createdUser) {
    console.log('❌ Cannot proceed without creating user');
    return;
  }

  console.log('\n--- Step 2: Approve User from Super Admin Role ---');
  
  // Step 4: Get pending approvals (super admin)
  const pendingUsers = await getPendingApprovals(superAdminToken);
  
  if (pendingUsers.length > 0) {
    // Step 5: Approve the user (super admin)
    const userToApprove = pendingUsers.find(user => user.email === newUserData.email);
    if (userToApprove) {
      await approveUser(superAdminToken, userToApprove._id);
    }
  }

  console.log('\n--- Step 3: Verify User in MongoDB ---');
  
  // Step 6: Get all users to verify the new user exists
  const allUsers = await getAllUsers(superAdminToken);
  const verifyUser = allUsers.find(user => user.email === newUserData.email);
  
  if (verifyUser) {
    console.log('✅ User successfully created and reflected in MongoDB:');
    console.log(`   - Email: ${verifyUser.email}`);
    console.log(`   - Full Name: ${verifyUser.full_name}`);
    console.log(`   - Role: ${verifyUser.role}`);
    console.log(`   - Hourly Rate: $${verifyUser.hourly_rate}`);
    console.log(`   - Active: ${verifyUser.is_active}`);
    console.log(`   - Approved: ${verifyUser.is_approved_by_super_admin}`);
    console.log(`   - Created: ${verifyUser.created_at}`);
  } else {
    console.log('❌ User not found in database');
  }

  console.log('\n🎉 User Management Migration Test Completed!');
}

// Run the test
testUserManagement().catch(console.error);