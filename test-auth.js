// Simple test script to verify authentication
const fetch = require('node-fetch');

async function testSignup() {
  console.log('Testing signup...');
  
  const signupData = {
    name: 'Test Admin',
    email: 'testadmin@example.com',
    phone: '+1234567890',
    password: 'password123',
    role: 'ADMIN',
    isActive: true
  };

  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupData),
    });

    const result = await response.json();
    console.log('Signup Response:', response.status, result);
  } catch (error) {
    console.error('Signup Error:', error.message);
  }
}

async function testSignin() {
  console.log('Testing signin...');
  
  const signinData = {
    email: 'testadmin@example.com',
    password: 'password123',
  };

  try {
    const response = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signinData),
    });

    const result = await response.json();
    console.log('Signin Response:', response.status, result);
  } catch (error) {
    console.error('Signin Error:', error.message);
  }
}

// Run tests
testSignup().then(() => {
  setTimeout(testSignin, 2000);
});