// Initialize Firebase
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

console.log("Firebase initialized successfully!");

// Function to perform live book search using Google Books API
async function searchBooks() {
    const query = document.getElementById('search').value.trim();
    if (!query) return; // Prevent search if input is empty

    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=5`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Clear previous results
        const resultsList = document.getElementById('search-results');
        resultsList.innerHTML = "";

        if (data.items) {
            data.items.forEach((book) => {
                const title = book.volumeInfo.title || "Unknown Title";
                const author = book.volumeInfo.authors ? book.volumeInfo.authors.join(", ") : "Unknown Author";

                // Create a list item for each book
                const resultItem = document.createElement("li");
                resultItem.textContent = `${title} by ${author}`;
                resultItem.classList.add("search-result");
                resultItem.addEventListener("click", () => confirmAddBook(book)); // Add click event
                resultsList.appendChild(resultItem);
            });
        } else {
            resultsList.innerHTML = `<li>No results found for "${query}"</li>`;
        }
    } catch (error) {
        console.error("Error fetching books:", error);
    }
}

// Function to confirm adding a book to the bookshelf
function confirmAddBook(book) {
    const title = book.volumeInfo.title || "Unknown Title";
    const author = book.volumeInfo.authors ? book.volumeInfo.authors.join(", ") : "Unknown Author";

    if (confirm(`Do you want to add "${title}" by ${author} to your bookshelf?`)) {
        collectBookMetadata(book); // Proceed to collect metadata
    }
}

// Function to collect additional metadata for the book
function collectBookMetadata(book) {
    const title = book.volumeInfo.title || "Unknown Title";
    const author = book.volumeInfo.authors ? book.volumeInfo.authors.join(", ") : "Unknown Author";

    const genre = prompt("Enter the genre of the book:", "Fiction");
    const color = prompt("Enter a color for the book cover (e.g., #ff5733):", "#ffffff");
    const finishedDate = prompt("Enter the date you finished reading (YYYY-MM-DD):", new Date().toISOString().split("T")[0]);

    // Add the book to Firebase
    addBookToFirestore({ title, author, genre, color, finishedDate });
}

// Function to add a book to Firestore
async function addBookToFirestore(bookData) {
    try {
        await db.collection("books").add(bookData);
        alert(`"${bookData.title}" has been added to your bookshelf!`);
    } catch (error) {
        console.error("Error adding book to Firestore:", error);
        alert("Failed to add book. Please try again later.");
    }
}

// Event listener for dynamic search
document.getElementById("search").addEventListener("input", searchBooks);
