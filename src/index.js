// src/index.js

export default {
	async fetch(request, env, ctx) {
	  console.log('Fetch event received');
	  return handleRequest(request);
	}
  };
  
  async function handleRequest(request) {
	console.log('handleRequest started');
	const url = new URL(request.url);
	const bookTitle = url.searchParams.get('book_title') || 'Unknown Title';
	const authorName = url.searchParams.get('author_name') || 'Unknown Author';
	
	console.log('Query params:', { bookTitle, authorName });
  
	// Attempt to fetch ISBNs from Open Library
	console.log('Fetching ISBNs...');
	const isbns = await fetchISBNs(bookTitle, authorName);
	console.log('ISBNs received:', isbns);
	
	if (isbns.length === 0) {
	  console.log("No ISBNs found, using placeholder");
	  return getPlaceholderImage(bookTitle, authorName);
	}
  
	// Try fetching cover images for the first ten ISBNs
	for (let i = 0; i < Math.min(10, isbns.length); i++) {
	  const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbns[i]}-L.jpg?default=false`;
	  console.log(`Attempting to fetch cover for ISBN ${isbns[i]} at URL: ${coverUrl}`);
	  
	  const imageResponse = await fetch(coverUrl);
	  console.log(`Cover fetch response status:`, imageResponse.status);
	  
	  if (imageResponse.ok) {
		console.log(`Cover image found for ISBN ${isbns[i]}`);
		return new Response(imageResponse.body, {
		  headers: {
			'Content-Type': 'image/jpeg'
		  }
		});
	  } else {
		console.log(`No cover found for ISBN ${isbns[i]}`);
	  }
	}
  
	// If no valid cover images were found, return the placeholder
	console.log("No valid covers found, using placeholder");
	return getPlaceholderImage(bookTitle, authorName);
  }
  
  async function getPlaceholderImage(bookTitle, authorName) {
	// Create a placeholder URL with book title and author
	const placeholderText = `${bookTitle}\n${authorName}`;
	const encodedText = encodeURIComponent(placeholderText);
	const placeholderUrl = `https://placehold.co/325x500?text=${encodedText}`;
	
	console.log(`Getting placeholder image from URL: ${placeholderUrl}`);
	
	try {
	  const placeholderResponse = await fetch(placeholderUrl);
	  console.log('Placeholder response:', {
		ok: placeholderResponse.ok,
		status: placeholderResponse.status,
		statusText: placeholderResponse.statusText,
		contentType: placeholderResponse.headers.get('content-type'),
		bodyUsed: placeholderResponse.bodyUsed
	  });
  
	  if (!placeholderResponse.ok) {
		throw new Error(`Placeholder service returned ${placeholderResponse.status}`);
	  }
  
	  // Return the placeholder with SVG content type
	  return new Response(placeholderResponse.body, {
		status: 200,
		headers: {
		  'Content-Type': 'image/svg+xml',
		  'Cache-Control': 'public, max-age=31536000, immutable'
		}
	  });
	} catch (error) {
	  console.error('Error with placeholder:', error);
	  return new Response(`Failed to fetch placeholder: ${error.message}`, {
		status: 500,
		headers: {
		  'Content-Type': 'text/plain'
		}
	  });
	}
  }
  
  async function fetchISBNs(bookTitle, authorName) {
	const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(bookTitle)}&author=${encodeURIComponent(authorName)}&fields=isbn`;
	console.log('Fetching ISBNs from URL:', searchUrl);
	
	const response = await fetch(searchUrl);
	console.log('Open Library API response status:', response.status);
	
	if (!response.ok) {
	  console.error("Failed to fetch ISBNs:", response.statusText);
	  return [];
	}
  
	const data = await response.json();
	console.log('Open Library API response data:', data);
	
	if (data.docs.length > 0 && data.docs[0].isbn) {
	  console.log('ISBNs found:', data.docs[0].isbn);
	  return data.docs[0].isbn;
	}
	console.log('No ISBNs found in response');
	return [];
  }