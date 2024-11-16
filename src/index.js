export default {
	async fetch(request, env, ctx) {
	  console.log('Fetch event received');
	  return handleRequest(request, env);
	}
  };
  
  async function handleRequest(request, env) {
	console.log('handleRequest started');
	const url = new URL(request.url);
	const bookTitle = url.searchParams.get('book_title') || 'Unknown Title';
	const authorName = url.searchParams.get('author_name') || 'Unknown Author';
	
	console.log('Query params:', { bookTitle, authorName });
  
	// Create a cache key from the book title and author
	const cacheKey = `cover:${bookTitle}:${authorName}`.toLowerCase();
	
	// Try to get the cached cover URL
	const cachedCover = await env.BOOK_COVERS.get(cacheKey);
	if (cachedCover) {
	  console.log('Found cached cover URL:', cachedCover);
	  if (cachedCover === 'PLACEHOLDER') {
		return getPlaceholderImage(bookTitle, authorName);
	  }
	  
	  // Fetch the cached cover image
	  const cachedResponse = await fetch(cachedCover);
	  if (cachedResponse.ok) {
		return new Response(cachedResponse.body, {
		  headers: {
			'Content-Type': 'image/jpeg',
			'Cache-Control': 'public, max-age=31536000, immutable'
		  }
		});
	  }
	  // If the cached URL is no longer valid, delete it and continue with normal flow
	  await env.BOOK_COVERS.delete(cacheKey);
	}
  
	// Attempt to fetch ISBNs from Open Library
	console.log('Fetching ISBNs...');
	const isbns = await fetchISBNs(bookTitle, authorName);
	console.log('ISBNs received:', isbns);
	
	if (isbns.length === 0) {
	  console.log("No ISBNs found, using placeholder");
	  // Cache the placeholder result
	  await env.BOOK_COVERS.put(cacheKey, 'PLACEHOLDER', {
		expirationTtl: 86400 * 7 // Cache for 7 days
	  });
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
		// Cache the successful cover URL
		await env.BOOK_COVERS.put(cacheKey, coverUrl, {
		  expirationTtl: 86400 * 30 // Cache for 30 days
		});
		return new Response(imageResponse.body, {
		  headers: {
			'Content-Type': 'image/jpeg',
			'Cache-Control': 'public, max-age=31536000, immutable'
		  }
		});
	  } else {
		console.log(`No cover found for ISBN ${isbns[i]}`);
	  }
	}
  
	// If no valid cover images were found, cache and return the placeholder
	console.log("No valid covers found, using placeholder");
	await env.BOOK_COVERS.put(cacheKey, 'PLACEHOLDER', {
	  expirationTtl: 86400 * 7 // Cache for 7 days
	});
	return getPlaceholderImage(bookTitle, authorName);
  }
  
  async function getPlaceholderImage(bookTitle, authorName) {
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