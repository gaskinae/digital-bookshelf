// Firebase configuration (to be replaced during deployment)
const firebaseConfig = {
    apiKey: "%FIREBASE_API_KEY%",
    authDomain: "%FIREBASE_AUTH_DOMAIN%",
    projectId: "%FIREBASE_PROJECT_ID%",
    storageBucket: "%FIREBASE_STORAGE_BUCKET%",
    messagingSenderId: "%FIREBASE_MESSAGING_SENDER_ID%",
    appId: "%FIREBASE_APP_ID%"
};

// Initialise Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Event listener for live search as the user types
    document.getElementById("search").addEventListener("input", searchBooks);
});

// Function to handle the book search
async function searchBooks() {
    const query = document.getElementById("search").value;
    const category = document.getElementById("search-category").value; // Get selected category (title or author)

    if (!query) {
        document.querySelector('.bookshelf').innerHTML = "<p class='placeholder'>Your bookshelf is empty. Start typing to search for books!</p>";
        return; // Stop if the input is empty
    }

    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${category}:${query}&maxResults=10`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        // Clear previous results
        document.querySelector('.bookshelf').innerHTML = "";

        if (data.items) {
            data.items.forEach(book => {
                const bookElement = createBookElement(book);
                document.querySelector('.bookshelf').appendChild(bookElement);
            });
        } else {
            document.querySelector('.bookshelf').innerHTML = `<p class="placeholder">No results found for "${query}" in ${category}</p>`;
        }
    } catch (error) {
        console.error('Error fetching books:', error);
        document.querySelector('.bookshelf').innerHTML = "<p class='placeholder'>Failed to fetch books. Try again later.</p>";
    }
}

// Function to create book elements for the bookshelf
function createBookElement(book) {
    const bookElement = document.createElement('div');
    bookElement.className = 'book';

    const title = book.volumeInfo.title || 'Unknown Title';
    const author = book.volumeInfo.authors ? book.volumeInfo.authors.join(', ') : 'Unknown Author';
    const image = book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : 'https://via.placeholder.com/150';

    bookElement.innerHTML = `
        <img src="${image}" alt="${title}" />
        <h3>${title}</h3>
        <p>${author}</p>
    `;
    
    return bookElement;
}
