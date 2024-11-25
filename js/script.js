// Firebase Configuration (Replace values with your secrets)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialise Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

console.log("Firebase initialised successfully!");

// Function to add a test book to Firestore
async function addTestBook() {
    try {
        await db.collection('books').add({
            title: "Test Book",
            author: "Test Author",
            genre: "Test Genre",
            color: "#000000",
            finishedDate: new Date().toISOString()
        });
        console.log("Test book added successfully!");
    } catch (error) {
        console.error("Error adding test book:", error);
    }
}

// Automatically add a test book to Firestore when the page loads
document.addEventListener('DOMContentLoaded', addTestBook);
