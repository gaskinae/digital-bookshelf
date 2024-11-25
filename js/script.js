function addPlaceholderBook() {
    const bookshelf = document.querySelector('.bookshelf');
    const book = document.createElement('div');
    book.className = 'book';
    book.textContent = 'Sample Book';
    bookshelf.appendChild(book);
}
addPlaceholderBook();