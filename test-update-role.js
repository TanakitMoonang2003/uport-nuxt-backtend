// Simple script to update user role via API
const fetch = require('node-fetch');

async function updateUserRole() {
  try {
    console.log('🔄 Updating user role...');
    
    const response = await fetch('http://localhost:3001/api/admin/update-user-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@cmtc.ac.th',
        newRole: 'admin'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ User role updated successfully!');
      console.log('📧 Email:', data.data.email);
      console.log('👤 Username:', data.data.username);
      console.log('🎯 New Role:', data.data.role);
      console.log('\n🎉 Next steps:');
      console.log('1. Go back to your application');
      console.log('2. Logout and login again');
      console.log('3. You should now see admin navigation!');
    } else {
      console.log('❌ Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateUserRole();
