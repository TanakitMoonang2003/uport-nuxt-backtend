# User Registration System Setup

This guide explains how to set up and test the user registration system for your portfolio application.

## 🎯 What's Been Implemented

### Backend (Next.js)
- ✅ **User Model**: Extended with student and teacher fields
- ✅ **Registration API**: `/api/auth/register` endpoint
- ✅ **Login API**: `/api/auth/login` endpoint
- ✅ **Password Hashing**: Secure password storage with bcrypt
- ✅ **JWT Authentication**: Token-based authentication
- ✅ **Data Validation**: Server-side validation

### Frontend (Nuxt.js)
- ✅ **Registration Form**: Student and teacher registration forms
- ✅ **Form Validation**: Client-side validation
- ✅ **API Integration**: Connected to backend
- ✅ **Error Handling**: User-friendly error messages
- ✅ **Loading States**: Visual feedback during registration

## 🚀 How to Test Registration

### 1. Start Your Backend
```bash
cd portfolio-backend
npm run dev
```
Your backend should be running on `http://localhost:3000`

### 2. Start Your Frontend
```bash
cd PortProject
npm run dev
```
Your frontend should be running on `http://localhost:3001` (or another port)

### 3. Test Registration
1. Go to `http://localhost:3001/auth/register`
2. Fill out the registration form (Student or Teacher)
3. Submit the form
4. Check for success/error messages

### 3. Test with API Directly
```bash
cd portfolio-backend
node scripts/test-registration.js
```

## 📋 Registration Fields

### Student Registration
- **Email**: MUT email address
- **Username**: Unique username
- **Password**: Minimum 6 characters
- **Student ID**: Student identification number
- **First Name**: Student's first name
- **Last Name**: Student's last name
- **Phone**: Contact number
- **Year of Study**: Academic year

### Teacher Registration
- **Email**: MUT email address
- **Username**: Unique username
- **Password**: Minimum 6 characters
- **Teacher ID**: Teacher identification number
- **Title**: Academic title (นาย, นาง, นางสาว, ดร., etc.)
- **First Name**: Teacher's first name
- **Last Name**: Teacher's last name
- **Faculty**: Academic faculty
- **Department**: Department name
- **Position**: Academic position
- **Office Room**: Office location
- **Phone**: Contact number
- **Office Phone**: Office contact
- **Specialization**: Area of expertise

## 🔧 API Endpoints

### Registration
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@cmtc.ac.th",
  "username": "student123",
  "password": "password123",
  "confirmPassword": "password123",
  "userType": "student",
  "studentId": "65123456",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "08-12345678",
  "yearOfStudy": "4แผนก"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@cmtc.ac.th",
  "password": "password123"
}
```

## 🛡️ Security Features

- **Password Hashing**: Passwords are hashed with bcrypt
- **JWT Tokens**: Secure authentication tokens
- **Input Validation**: Server-side validation
- **Duplicate Prevention**: Email and username uniqueness
- **Account Status**: Active/inactive account management

## 🐛 Troubleshooting

### Common Issues

1. **"Network Error"**: 
   - Check if backend is running on port 3000
   - Verify CORS settings

2. **"User already exists"**:
   - Try different email/username
   - Check database for existing users

3. **"Passwords do not match"**:
   - Ensure password and confirmPassword are identical

4. **"Registration failed"**:
   - Check backend logs for detailed error
   - Verify MongoDB connection

### Debug Steps

1. **Check Backend Logs**:
   ```bash
   cd portfolio-backend
   npm run dev
   # Look for error messages in console
   ```

2. **Test Database Connection**:
   ```bash
   # Visit: http://localhost:3000/api/test-db?action=test
   ```

3. **Check Frontend Console**:
   - Open browser developer tools
   - Check Network tab for API calls
   - Look for JavaScript errors

## 📊 Database Schema

The User model now includes:

```javascript
{
  // Basic fields
  username: String (required, unique)
  email: String (required, unique)
  password: String (required, hashed)
  role: String (admin/user)
  isActive: Boolean
  
  // Student fields
  studentId: String
  firstName: String
  lastName: String
  phone: String
  yearOfStudy: String
  
  // Teacher fields
  teacherId: String
  title: String
  faculty: String
  department: String
  position: String
  officeRoom: String
  officePhone: String
  specialization: String
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}
```

## 🎉 Success!

Your registration system is now fully functional! Users can:

1. ✅ Register as students or teachers
2. ✅ Login with their credentials
3. ✅ Have their data securely stored in MongoDB
4. ✅ Receive proper validation and error messages
5. ✅ Experience a smooth user interface

The system is ready for production use with proper security measures and user experience features.
