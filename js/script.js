// Firebase configuration
const firebaseConfig = {
    apiKey: "%FIREBASE_API_KEY%",
    authDomain: "%FIREBASE_AUTH_DOMAIN%",
    projectId: "%FIREBASE_PROJECT_ID%",
    storageBucket: "%FIREBASE_STORAGE_BUCKET%",
    messagingSenderId: "%FIREBASE_MESSAGING_SENDER_ID%",
    appId: "%FIREBASE_APP_ID%"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();
db.enablePersistence()
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.log("Persistence failed, multiple tabs open?");
        } else if (err.code === 'unimplemented') {
            console.log("Persistence is not available for this environment.");
        }
    });

// Wait for the DOM to load before running scripts
document.addEventListener('DOMContentLoaded', function() {
    // Event listener for search input (to trigger live search)
    document.getElementById("search").addEventListener("input", searchBooks);
    
    // Event listener for when a book is clicked to add to the bookshelf
    document.querySelector('.search-results').addEventListener('click', handleAddBook);
});

// Function to perform book search using Google Books API
async function searchBooks() {
    const query = document.getElementById("search").value.trim(); // Get the search input

    if (!query) return; // Don't proceed if the search input is empty

    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=10`; // Construct the API URL
    
    try {
        const response = await fetch(apiUrl);
        
        // Check if the response is ok
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json(); // Parse the response data
        
        // Clear previous search results
        document.querySelector('.search-results').innerHTML = "";

        if (data.items) {
            displaySearchResults(data.items); // Display the results if found
        } else {
            document.querySelector('.search-results').innerHTML = `<p class="placeholder">No results found for "${query}"</p>`;
        }
    } catch (error) {
        console.error('Error fetching books:', error);
        document.querySelector('.search-results').innerHTML = "<p class='placeholder'>Failed to fetch books. Try again later.</p>";
    }
}

// Function to display the search results below the input
function displaySearchResults(books) {
    const resultsContainer = document.querySelector('.search-results');
    books.forEach(book => {
        const bookElement = document.createElement('div');
        const title = book.volumeInfo.title || 'Unknown Title';
        const author = book.volumeInfo.authors ? book.volumeInfo.authors.join(', ') : 'Unknown Author';
        const image = book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : 'https://via.placeholder.com/150';

        bookElement.className = 'book-result';
        bookElement.innerHTML = `
            <img src="${image}" alt="${title}" class="book-thumbnail"/>
            <h3>${title}</h3>
            <p>${author}</p>
        `;
        
        bookElement.dataset.book = JSON.stringify({
            title: title,
            author: author,
            image: image,
            bookId: book.id
        });
        
        resultsContainer.appendChild(bookElement);
    });
}

// Handle adding a book to the bookshelf
async function handleAddBook(event) {
    const bookElement = event.target.closest('.book-result');
    if (!bookElement) return; // Ensure that the click was on a book result

    const bookData = JSON.parse(bookElement.dataset.book);
    const confirmAdd = confirm(`Do you want to add "${bookData.title}" by ${bookData.author} to your bookshelf?`);
    
    if (!confirmAdd) return; // If the user cancels, do nothing

    // Prompt user for custom metadata (genre, colour, date finished)
    const genre = prompt("Enter the genre of the book:");
    const colour = prompt("Enter the colour of the book:");
    const dateFinished = prompt("Enter the date you finished reading the book (YYYY-MM-DD):");

    // Add the book to Firebase Firestore
    try {
        await addBookToDatabase(bookData, genre, colour, dateFinished);
        alert(`${bookData.title} has been added to your bookshelf!`);
    } catch (error) {
        console.error('Error adding book to database:', error);
        alert('There was an error adding the book to your bookshelf.');
    }
}

// Function to add book data to Firebase Firestore
async function addBookToDatabase(bookData, genre, colour, dateFinished) {
    console.log("Adding book to database:", bookData, genre, colour, dateFinished);
    try {
        await db.collection('bookshelf').add({
            title: bookData.title,
            author: bookData.author,
            genre: genre,
            colour: colour,
            dateFinished: firebase.firestore.Timestamp.fromDate(new Date(dateFinished)),
            image: bookData.image
        });
        console.log(`${bookData.title} has been added to Firestore!`);
    } catch (error) {
        console.error('Error adding book to Firestore:', error);
    }
}
