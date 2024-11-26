// Firebase configuration (already present)
const firebaseConfig = {
    apiKey: "AIzaSyC3M2dFl2RrblpvI5cvSoAcrRLe5ErD1jA",
    authDomain: "digital-bookshelf-c966e.firebaseapp.com",
    projectId: "digital-bookshelf-c966e",
    storageBucket: "digital-bookshelf-c966e.firebasestorage.app",
    messagingSenderId: "790381060352",
    appId: "1:790381060352:web:d57b7c2ecda67c70bd13e5",
    testSecret: "%FIREBASE_TEST"
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
    // Load books from Firestore on page load
    loadBookshelf();
    
    // Event listener for search input (to trigger live search)
    document.getElementById("search").addEventListener("input", searchBooks);
    
    // Event listener for when a book is clicked to add to the bookshelf
    document.querySelector('.search-results').addEventListener('click', handleAddBook);
});

// Function to perform book search using Google Books API
async function searchBooks() {
    const query = document.getElementById("search").value.trim(); // Get the search input

    if (!query) return; // Don't proceed if the search input is empty

    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=3`; // Construct the API URL
    
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
        loadBookshelf();  // Reload bookshelf after adding book
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

// Fetch books from Firestore and display them on the bookshelf
async function loadBookshelf() {
    const bookshelfSection = document.querySelector('.bookshelf');
    
    // Clear any existing books
    bookshelfSection.innerHTML = '';

    try {
        const querySnapshot = await db.collection('bookshelf').get();
        querySnapshot.forEach((doc) => {
            const bookData = doc.data();
            displayBookOnBookshelf(bookData, doc.id); // Include doc.id for deletion and editing
        });
    } catch (error) {
        console.error('Error loading bookshelf:', error);
    }
}

// Display the book on the bookshelf
function displayBookOnBookshelf(bookData, bookId) {
    const bookshelfSection = document.querySelector('.bookshelf');
    const bookElement = document.createElement('div');
    bookElement.classList.add('book');
    bookElement.innerHTML = `
        <img src="${bookData.image}" alt="${bookData.title}" class="book-thumbnail"/>
        <h3>${bookData.title}</h3>
        <p>${bookData.author}</p>
        <button onclick="editBook('${bookId}')">Edit</button>
        <button onclick="deleteBook('${bookId}')">Delete</button>
    `;
    bookshelfSection.appendChild(bookElement);
}

// Function to delete a book from Firestore
async function deleteBook(bookId) {
    const confirmDelete = confirm("Are you sure you want to delete this book from your shelf?");
    if (!confirmDelete) return;

    try {
        await db.collection('bookshelf').doc(bookId).delete();
        alert('Book deleted successfully!');
        loadBookshelf();  // Reload bookshelf after deleting
    } catch (error) {
        console.error('Error deleting book:', error);
        alert('There was an error deleting the book.');
    }
}

// Function to edit a book's metadata (just a prompt for simplicity)
async function editBook(bookId) {
    const newGenre = prompt("Enter the new genre:");
    const newColour = prompt("Enter the new colour:");
    const newDateFinished = prompt("Enter the new finish date (YYYY-MM-DD):");

    try {
        await db.collection('bookshelf').doc(bookId).update({
            genre: newGenre,
            colour: newColour,
            dateFinished: firebase.firestore.Timestamp.fromDate(new Date(newDateFinished))
        });
        alert('Book updated successfully!');
        loadBookshelf();  // Reload bookshelf after editing
    } catch (error) {
        console.error('Error updating book:', error);
        alert('There was an error updating the book.');
    }
}
