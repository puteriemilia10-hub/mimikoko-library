// Shared cover helpers for the library and OBS. Lookups only run on admin request.
window.MIYUU_COVERS = (() => {
  const normalize = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  function url(book) {
    if (book.cover) return book.cover;
    const isbn = String(book.isbn || '').replace(/[\s-]/g, '');
    return /^(?:\d{13}|\d{9}[\dXx])$/.test(isbn)
      ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false` : '';
  }
  function match(book, results) {
    const title = normalize(book.title), author = normalize(book.author);
    if (!title || !author || author === 'unknown author') return '';
    const found = results.find(item => Number.isSafeInteger(item.cover_i) && item.cover_i > 0
      && normalize(item.title) === title
      && (item.author_name || []).some(name => normalize(name) === author));
    return found ? `https://covers.openlibrary.org/b/id/${found.cover_i}-M.jpg?default=false` : '';
  }
  async function search(books) {
    // Batch titles rather than making hundreds of individual search requests.
    const titles = [...new Set(books.map(book => normalize(book.title)).filter(Boolean))];
    if (!titles.length) return [];
    const params = new URLSearchParams({q: titles.map(title => `title:"${title}"`).join(' OR '), fields: 'title,author_name,cover_i', limit: '100'});
    const response = await fetch(`https://openlibrary.org/search.json?${params}`, {signal: AbortSignal.timeout(20000)});
    if (!response.ok) throw Error(`Open Library returned ${response.status}. Please try again later.`);
    return (await response.json()).docs || [];
  }
  function matchGoogle(book, items) {
    const isbn = String(book.isbn || '').replace(/[\s-]/g, '').toUpperCase();
    for (const item of items) {
      const info = item.volumeInfo || {};
      const sameISBN = /^(?:\d{13}|\d{9}[\dX])$/.test(isbn)
        && (info.industryIdentifiers || []).some(value => String(value.identifier).replace(/[\s-]/g, '').toUpperCase() === isbn);
      const author = normalize(book.author);
      const sameBook = normalize(info.title) === normalize(book.title) && author && author !== 'unknown author'
        && (info.authors || []).some(name => normalize(name) === author);
      if (!sameISBN && !sameBook) continue;
      const image = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;
      if (!image) continue;
      try {
        const cover = new URL(image);
        if (!['http:', 'https:'].includes(cover.protocol)) continue;
        cover.protocol = 'https:';
        return cover.href;
      } catch { /* Ignore malformed cover links. */ }
    }
    return '';
  }
  async function google(book, apiKey) {
    if (!apiKey) return '';
    // Plain title/author search also works for catalogue entries without ISBNs.
    const params = new URLSearchParams({q: `${book.title} ${book.author || ''}`, key: apiKey,
      maxResults: '10', printType: 'books', fields: 'items(volumeInfo(title,authors,industryIdentifiers,imageLinks))'});
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`, {signal: AbortSignal.timeout(20000)});
    if (!response.ok) throw Error(`Google Books returned ${response.status}. Check that Books API is enabled, the key restrictions allow this website, and quota is available.`);
    return matchGoogle(book, (await response.json()).items || []);
  }
  return {url, match, search, google, matchGoogle};
})();
