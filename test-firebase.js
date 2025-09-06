// Test Firebase connection
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCn0OL6-s6mq0FvWORZ2kDLN1lEqM-ADvo",
  authDomain: "rctscm01.firebaseapp.com",
  projectId: "rctscm01",
  storageBucket: "rctscm01.firebasestorage.app",
  messagingSenderId: "254761013200",
  appId: "1:254761013200:web:4b82ce8ff1a8733f1333d5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...');
    
    // Try to read from users collection
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    console.log('Firebase connection successful!');
    console.log('Users collection size:', querySnapshot.size);
    
    querySnapshot.forEach((doc) => {
      console.log('User document:', doc.id, doc.data());
    });
    
  } catch (error) {
    console.error('Firebase connection error:', error.code, error.message);
  }
}

testFirebaseConnection();