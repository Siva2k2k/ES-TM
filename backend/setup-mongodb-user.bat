@echo off
echo Creating MongoDB user Admin:1234...
echo.

mongosh --eval "
use admin;
db.createUser({
  user: 'Admin',
  pwd: '1234',
  roles: [
    { role: 'userAdminAnyDatabase', db: 'admin' },
    { role: 'readWriteAnyDatabase', db: 'admin' }
  ]
});
print('✅ User Admin created successfully!');
exit;
"

if %errorlevel% equ 0 (
    echo.
    echo ✅ MongoDB user setup completed successfully!
    echo You can now test the connection with: npm run test:auth
) else (
    echo.
    echo ❌ Failed to create MongoDB user
    echo Please check if MongoDB is running and try the manual steps in MONGODB_SETUP_GUIDE.md
)

pause