# MongoDB User Setup Script
# Run this in MongoDB shell (mongosh)

# Switch to admin database
use admin

# Create an admin user with the credentials from your .env file
db.createUser({
  user: "Admin",
  pwd: "1234", 
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" },
    { role: "dbAdminAnyDatabase", db: "admin" },
    { role: "clusterAdmin", db: "admin" }
  ]
})

# Switch to your application database
use timesheet-management

# Create a user specifically for your application database (optional, more secure)
db.createUser({
  user: "Admin", 
  pwd: "1234",
  roles: [
    { role: "readWrite", db: "timesheet-management" },
    { role: "dbAdmin", db: "timesheet-management" }
  ]
})

# Verify the user was created
db.getUsers()

print("✅ MongoDB users created successfully!")
print("You can now use the credentials: Admin:1234")
print("Connection string: mongodb://Admin:1234@localhost:27017/timesheet-management")