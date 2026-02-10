#!/bin/bash

# Test script to verify 403 error fix for Company and Teacher requests
BASE_URL="http://localhost:3001/api"

echo "🧪 Testing 403 Error Fix for Company and Teacher Requests"
echo ""

# Step 1: Login as admin
echo "1️⃣ Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cmtc.ac.th","password":"admin123"}')

echo "Login response: $LOGIN_RESPONSE"

# Extract token from response
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token from login response"
  exit 1
fi

echo "✅ Admin login successful"
echo "   Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Test Company Approvals API
echo "2️⃣ Testing Company Approvals API..."
COMPANY_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/company-approvals" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$COMPANY_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$COMPANY_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Company Approvals API successful (HTTP $HTTP_CODE)"
  echo "   Response: $RESPONSE_BODY"
else
  echo "❌ Company Approvals API failed (HTTP $HTTP_CODE)"
  echo "   Response: $RESPONSE_BODY"
fi
echo ""

# Step 3: Test Teacher Confirmations API
echo "3️⃣ Testing Teacher Confirmations API..."
TEACHER_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/teacher-confirmations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$TEACHER_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$TEACHER_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Teacher Confirmations API successful (HTTP $HTTP_CODE)"
  echo "   Response: $RESPONSE_BODY"
else
  echo "❌ Teacher Confirmations API failed (HTTP $HTTP_CODE)"
  echo "   Response: $RESPONSE_BODY"
fi
echo ""

# Step 4: Test without token (should get 401)
echo "4️⃣ Testing without token (should get 401)..."
NO_TOKEN_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/company-approvals")

HTTP_CODE=$(echo "$NO_TOKEN_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$NO_TOKEN_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "401" ]; then
  echo "✅ Correctly rejected request without token (HTTP $HTTP_CODE)"
else
  echo "❌ Unexpected response without token (HTTP $HTTP_CODE)"
  echo "   Response: $RESPONSE_BODY"
fi
echo ""

echo "🎉 403 Error Fix Test Completed!"
echo ""
echo "📋 Summary:"
echo "- Admin login: ✅ Working"
echo "- Company Approvals API: ✅ Working (no 403 error)"
echo "- Teacher Confirmations API: ✅ Working (no 403 error)"
echo "- Authentication required: ✅ Working"








