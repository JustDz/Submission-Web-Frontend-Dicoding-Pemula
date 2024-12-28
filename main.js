const books = [];
const RENDER_EVENT = "render-book";
const SAVED_EVENT = "saved-book";
const STORAGE_KEY = "BOOKSHELF_APPS";

// Fungsi untuk menghasilkan ID unik menggunakan timestamp saat ini
function generateId() {
  return +new Date();
}

// Fungsi untuk menghasilkan objek buku
function generateBookObject(id, title, author, year, isComplete) {
  return {
    id,
    title,
    author,
    year,
    isComplete,
  };
}

// Fungsi untuk mencari buku berdasarkan ID
function findBook(bookId) {
  return books.find((book) => book.id === bookId) || null;
}

// Fungsi untuk menemukan indeks buku berdasarkan ID
function findBookIndex(bookId) {
  return books.findIndex((book) => book.id === bookId);
}

// Fungsi untuk mengecek apakah browser mendukung localStorage
function isStorageExist() {
  if (typeof Storage === "undefined") {
    alert("Browser kamu tidak mendukung local storage");
    return false;
  }
  return true;
}

// Fungsi untuk menyimpan data buku ke localStorage
function saveData() {
  if (isStorageExist()) {
    const parsed = JSON.stringify(
      books.map((book) => ({
        ...book,
        year: parseInt(book.year),
      }))
    );
    localStorage.setItem(STORAGE_KEY, parsed);
    document.dispatchEvent(new Event(SAVED_EVENT));
  }
}

function loadDataFromStorage() {
  const serializedData = localStorage.getItem(STORAGE_KEY);
  const data = JSON.parse(serializedData);

  if (data !== null) {
    books.push(
      ...data.map((book) => ({
        ...book,
        year: parseInt(book.year),
        isComplete: book.isComplete ?? false,
      }))
    );
  }

  document.dispatchEvent(new Event(RENDER_EVENT));
  updateBookCounts();
}

// Fungsi untuk membuat elemen HTML buku
function makeBook(bookObject) {
  const { id, title, author, year, isComplete } = bookObject;

  const textTitle = document.createElement("h3");
  textTitle.innerText = title;
  textTitle.setAttribute("data-testid", "bookItemTitle");

  const textAuthor = document.createElement("p");
  textAuthor.innerText = `Penulis: ${author}`;
  textAuthor.setAttribute("data-testid", "bookItemAuthor");

  const textYear = document.createElement("p");
  textYear.innerText = `Tahun: ${year}`;
  textYear.setAttribute("data-testid", "bookItemYear");

  const textContainer = document.createElement("div");
  textContainer.classList.add("inner");
  textContainer.append(textTitle, textAuthor, textYear);

  const container = document.createElement("div");
  container.classList.add("book-item");
  container.setAttribute("id", `book-${id}`);
  container.setAttribute("data-bookid", id);
  container.setAttribute("data-testid", "bookItem");
  container.append(textContainer);

  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("button-container");

  if (isComplete) {
    // Tombol undo untuk memindahkan buku ke rak belum selesai
    const undoButton = createButton("undo-button", "bx-arrow-back", () =>
      undoBookFromCompleted(id)
    );
    undoButton.setAttribute("data-testid", "bookItemIsCompleteButton");

    // Tombol untuk menghapus buku
    const trashButton = createButton("trash-button", "bxs-trash", () =>
      removeBookFromCompleted(id)
    );
    trashButton.setAttribute("data-testid", "bookItemDeleteButton");

    buttonContainer.append(undoButton, trashButton);
  } else {
    // Tombol check untuk memindahkan buku ke rak selesai
    const checkButton = createButton("check-button", "bx-checkbox", () =>
      addBookToCompleted(id)
    );
    checkButton.setAttribute("data-testid", "bookItemIsCompleteButton");

    // Tombol untuk mengedit buku
    const editButton = createButton("edit-button", "bx-edit-alt", () =>
      editBook(id)
    );
    editButton.setAttribute("data-testid", "bookItemEditButton");

    // Tombol untuk menghapus buku
    const trashButton = createButton("trash-button", "bxs-trash", () =>
      removeBookFromCompleted(id)
    );
    trashButton.setAttribute("data-testid", "bookItemDeleteButton");

    buttonContainer.append(editButton, checkButton, trashButton);
  }

  container.append(buttonContainer);
  return container;
}

// Fungsi untuk menghapus buku yang sudah selesai
function removeBookFromCompleted(bookId) {
  const bookTarget = findBookIndex(bookId);

  if (bookTarget === -1) return;
  const bookName = books[bookTarget].title;

  books.splice(bookTarget, 1);

  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();

  // Menampilkan alert
  alert(`Buku "${bookName}" berhasil dihapus!`);

  updateBookCounts();
}

// Fungsi untuk membuat tombol dengan event listener
function createButton(className, iconClass, eventListener) {
  const button = document.createElement("button");
  button.classList.add(className);
  button.setAttribute(
    "data-testid",
    `bookItem${className.split("-")[0]}Button`
  );

  const icon = document.createElement("i");
  icon.classList.add("bx", iconClass);
  button.appendChild(icon);

  button.addEventListener("click", eventListener);
  return button;
}

// Fungsi untuk menambahkan buku baru
function addBook() {
  const textBookTitle = document.getElementById("bookFormTitle").value.trim();
  const textBookAuthor = document.getElementById("bookFormAuthor").value.trim();
  const textBookYear = document.getElementById("bookFormYear").value.trim();
  const isCompleted = document.getElementById("bookFormIsComplete").checked;

  if (!textBookTitle || !textBookAuthor || !textBookYear) {
    alert("Mohon isi semua data buku!");
    return;
  }

  let fullDate;
  if (textBookYear.length === 4) {
    fullDate = `${textBookYear}-01-01`; // Format as yyyy-MM-dd
  } else {
    fullDate = textBookYear;
  }

  const date = new Date(fullDate);
  if (isNaN(date.getTime())) {
    alert("Tahun tidak valid!");
    return;
  }

  const isDuplicate = books.some(
    (book) =>
      book.title.toLowerCase() === textBookTitle.toLowerCase() &&
      book.author.toLowerCase() === textBookAuthor.toLowerCase() &&
      book.year === textBookYear
  );

  if (isDuplicate) {
    alert("Buku sudah ada dalam daftar!");
    return;
  }

  const bookObject = generateBookObject(
    generateId(),
    textBookTitle,
    textBookAuthor,
    date.getFullYear(),
    isCompleted
  );
  books.push(bookObject);

  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
  alert(`Buku "${textBookTitle}" berhasil ditambahkan!`);
  resetForm();
}

// Fungsi untuk mereset form input
function resetForm() {
  document.getElementById("bookForm").reset();
}

// Fungsi untuk mencari buku berdasarkan judul
function searchBooks(query) {
  const lowerCaseQuery = query.toLowerCase();
  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(lowerCaseQuery)
  );

  renderBookList(filteredBooks);
}

// Fungsi untuk merender buku yang sudah selesai dan yang belum
// Fungsi untuk merender buku yang sudah selesai dan yang belum
function renderBookList(bookList) {
  const incompleteBookList = document.getElementById("incompleteBookList");
  const completeBookList = document.getElementById("completeBookList");

  incompleteBookList.innerHTML = ""; // Kosongkan daftar buku belum selesai
  completeBookList.innerHTML = ""; // Kosongkan daftar buku selesai

  for (const book of bookList) {
    const bookElement = makeBook(book);
    if (book.isComplete) {
      completeBookList.append(bookElement); // Tambahkan ke rak selesai
    } else {
      incompleteBookList.append(bookElement); // Tambahkan ke rak belum selesai
    }
  }
}

// Fungsi untuk mengupdate jumlah buku yang tampil
function updateBookCounts() {
  const totalBooksElem = document.getElementById("totalBooksCount");
  const incompleteBooksElem = document.getElementById("incompleteBooksCount");
  const completedBooksElem = document.getElementById("completedBooksCount");

  if (totalBooksElem) totalBooksElem.innerText = books.length;
  if (incompleteBooksElem)
    incompleteBooksElem.innerText = books.filter(
      (book) => !book.isComplete
    ).length;
  if (completedBooksElem)
    completedBooksElem.innerText = books.filter(
      (book) => book.isComplete
    ).length;
}

// Fungsi untuk menambahkan buku ke rak selesai
function addBookToCompleted(bookId) {
  const bookTarget = findBook(bookId);

  if (bookTarget == null) return;

  bookTarget.isComplete = true; // Ubah status buku menjadi selesai dibaca
  document.dispatchEvent(new Event(RENDER_EVENT)); // Render ulang tampilan
  saveData(); // Simpan data

  updateBookCounts(); // Update jumlah buku
}

// Fungsi untuk membatalkan status selesai dari buku
function undoBookFromCompleted(bookId) {
  const bookTarget = findBook(bookId);
  if (bookTarget == null) return;

  bookTarget.isComplete = false; // Ubah status buku menjadi belum selesai dibaca
  document.dispatchEvent(new Event(RENDER_EVENT)); // Render ulang tampilan
  saveData(); // Simpan data

  updateBookCounts(); // Update jumlah buku
}

// Fungsi untuk menghapus semua buku
function clearAllBooks() {
  const confirmation = confirm("Apakah Anda yakin ingin menghapus semua buku?");
  if (confirmation) {
    books.length = 0;
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
    alert("Semua buku berhasil dihapus.");
    updateBookCounts();
  }
}

// Fungsi untuk mengedit buku
function editBook(bookId) {
  const bookTarget = findBook(bookId);

  if (bookTarget == null) return;

  const textBookTitle = document.getElementById("bookFormTitle");
  const textBookAuthor = document.getElementById("bookFormAuthor");
  const textBookYear = document.getElementById("bookFormYear");

  textBookTitle.value = bookTarget.title;
  textBookAuthor.value = bookTarget.author;
  textBookYear.value = bookTarget.year;

  const submitButton = document.getElementById("bookFormSubmit");
  const updateButton = document.getElementById("updateButton");

  submitButton.style.display = "none";
  updateButton.style.display = "block";

  const newUpdateButton = updateButton.cloneNode(true);
  updateButton.parentNode.replaceChild(newUpdateButton, updateButton);

  newUpdateButton.addEventListener("click", function () {
    const updatedTitle = textBookTitle.value.trim();
    const updatedAuthor = textBookAuthor.value.trim();
    const updatedYear = textBookYear.value.trim();

    if (!updatedTitle || !updatedAuthor || !updatedYear) {
      alert("Mohon isi semua data buku!");
      return;
    }

    bookTarget.title = updatedTitle;
    bookTarget.author = updatedAuthor;
    bookTarget.year = updatedYear;

    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();

    alert(`Buku "${updatedTitle}" berhasil diperbarui!`);

    textBookTitle.value = "";
    textBookAuthor.value = "";
    textBookYear.value = "";
    submitButton.style.display = "block";
    newUpdateButton.style.display = "none";
  });
}

// Event listener saat DOM siap
document.addEventListener("DOMContentLoaded", function () {
  const submitForm = document.getElementById("bookForm");
  const searchForm = document.getElementById("searchBook");
  const searchInput = document.getElementById("searchBookTitle");

  submitForm.addEventListener("submit", function (event) {
    event.preventDefault();
    addBook();
  });

  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const query = searchInput.value.trim();
    searchBooks(query);
  });

  searchInput.addEventListener("input", function () {
    const query = searchInput.value.trim();
    searchBooks(query);
  });

  const clearAllButton = document.getElementById("clearAll");
  clearAllButton.addEventListener("click", function () {
    clearAllBooks();
  });

  if (isStorageExist()) {
    loadDataFromStorage();
  }

  updateBookCounts();
});

// Event listener saat data berhasil disimpan
document.addEventListener(SAVED_EVENT, () => {
  console.log("Data berhasil disimpan.");
});

// Event listener saat rendering buku dilakukan
document.addEventListener(RENDER_EVENT, function () {
  const incompleteBookList = document.getElementById("incompleteBookList");
  const completeBookList = document.getElementById("completeBookList");

  incompleteBookList.innerHTML = "";
  completeBookList.innerHTML = "";

  for (const bookItem of books) {
    const bookElement = makeBook(bookItem);
    if (bookItem.isComplete) {
      completeBookList.append(bookElement);
    } else {
      incompleteBookList.append(bookElement);
    }
  }

  updateBookCounts();
});
