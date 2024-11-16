# Book Cover Generator Worker

A Cloudflare Worker that retrieves book cover images using the Open Library API. Given a book title and author name, it searches for matching ISBNs and returns thumbnail cover images. If no cover is found, it generates a placeholder image with the book details.

## Features

- Fetches book covers using ISBN lookup through Open Library
- Fallback to dynamically generated placeholder images
- Caches responses for improved performance
- Handles special characters and edge cases
- No API key required

## Example Outputs

### Successful Cover Retrievals

| Book | Example URL | Result |
|------|-------------|---------|
| The Great Gatsby | `/?book_title=The Great Gatsby&author_name=F. Scott Fitzgerald` | <img src="docs/images/gatsby.jpeg" width="200" alt="The Great Gatsby Cover"/> |
| 1984 | `/?book_title=1984&author_name=George Orwell` | <img src="docs/images/1984.jpeg" width="200" alt="1984 Cover"/> |

### Fallback Placeholder

When a book cover isn't found, the service generates a placeholder with the book details:

| Example | URL | Generated Placeholder |
|---------|-----|---------------------|
| Non-existent Book | `/?book_title=The Amazing Adventures of Nobody&author_name=John Smith` | <img src="docs/images/none.svg" width="200" alt="Placeholder Example"/> |

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your worker:
```bash
# Copy the example configuration
cp wrangler.example.toml wrangler.toml

# Edit wrangler.toml with your preferred settings
# Especially update the 'name' field to your desired worker name
```

## KV Store Setup

1. Create a KV namespace in the Cloudflare dashboard:
   ```bash
   # Using Wrangler CLI
   wrangler kv:namespace create BOOK_COVERS
   
   # Also create a preview namespace for development
   wrangler kv:namespace create BOOK_COVERS --preview
   ```

2. Update your `wrangler.toml` with the KV namespace bindings:
   ```toml
   kv_namespaces = [
     { binding = "BOOK_COVERS", id = "xxx", preview_id = "yyy" }
   ]
   ```

3. Add required permissions:
   ```toml
   [[permissions]]
   type = "kv"
   target = "BOOK_COVERS"
   operation = ["read", "write", "delete"]
   ```

## Development

Run the worker locally:
```bash
npm run dev
```

The worker will be available at `http://localhost:8787`. Test it using the example URLs shown in the [Example Outputs](#example-outputs) section above.

## Deployment

Deploy to Cloudflare Workers:
```bash
# Login to Cloudflare (first time only)
wrangler login

# Deploy your worker
npm run deploy
```

After deployment, your worker will be available at:
```
https://[worker-name].[your-subdomain].workers.dev
```

## API Usage

### Parameters

| Parameter | Description | Required | Example |
|-----------|-------------|----------|---------|
| `book_title` | The title of the book | Yes | `Pride and Prejudice` |
| `author_name` | The name of the book's author | Yes | `Jane Austen` |

### Response Types

| Scenario | Response Type | Example |
|----------|--------------|---------|
| Cover found | `image/jpeg` | <img src="docs/images/gatsby.jpeg" width="100" alt="Cover Example"/> |
| No cover found | `image/svg+xml` | <img src="docs/images/none.svg" width="100" alt="Placeholder Example"/> |

## Cache Management

The worker implements a caching strategy to improve performance:

- Successful cover URLs are cached for 30 days
- Placeholder results are cached for 7 days
- Cache keys format: `cover:${bookTitle}:${authorName}`

### Managing KV Store

View cached entries:
```bash
# List all keys
wrangler kv:key list --namespace-id=xxx

# Get specific value
wrangler kv:key get --namespace-id=xxx "your-key"

# Delete specific key
wrangler kv:key delete --namespace-id=xxx "your-key"
```

## Resource Limits

- KV Store:
  - Keys: Maximum 512 bytes
  - Values: Maximum 25 MB
  - Read: ~1ms
  - Write: ~30ms
- Worker:
  - CPU: 10ms - 50ms per request
  - Memory: 128 MB
  - Environment Variables: 1 KB each
  - Subrequests: 50 per request

## Performance Optimization

The worker implements several optimizations:

1. KV Caching:
   - Reduces API calls to Open Library
   - Improves response times for repeated requests
   - Handles both successful and fallback cases

2. Browser Caching:
   - Images are cached with `Cache-Control: public, max-age=31536000, immutable`
   - Reduces bandwidth usage and improves load times

3. Early Returns:
   - Returns cached results immediately when available
   - Avoids unnecessary API calls and processing

## Error Handling Examples

| Scenario | URL | Result |
|----------|-----|--------|
| Empty parameters | `/?book_title=&author_name=` | Default placeholder |
| Missing author | `/?book_title=NonExistentBook` | Default placeholder |
| Special characters | `/?book_title=L'Étranger&author_name=Albert Camus` | Handles correctly |

## Monitoring

### Viewing Logs

```bash
# View real-time logs
wrangler tail

# Filter logs by status
wrangler tail --status=error

# Filter logs by method
wrangler tail --method=GET
```

### Key Metrics to Monitor

- Cache hit ratio
- Response times
- Error rates
- KV store usage

## Common Issues

| Issue | Solution |
|-------|----------|
| Placeholder instead of cover | Verify book title and author spelling |
| No image displayed | Check browser console for errors |
| Deployment fails | Ensure `wrangler.toml` is configured correctly |

## Example Test URLs

Try these URLs with your deployed worker:

```
https://[your-worker].[subdomain].workers.dev/?book_title=Pride%20and%20Prejudice&author_name=Jane%20Austen
https://[your-worker].[subdomain].workers.dev/?book_title=1984&author_name=George%20Orwell
https://[your-worker].[subdomain].workers.dev/?book_title=To%20Kill%20a%20Mockingbird&author_name=Harper%20Lee
https://[your-worker].[subdomain].workers.dev/?book_title=The%20Hunger%20Games&author_name=Suzanne%20Collins
https://[your-worker].[subdomain].workers.dev/?book_title=Harry%20Potter%20and%20the%20Sorcerer%27s%20Stone&author_name=J.K.%20Rowling
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License

## Credits

- Book cover images provided by [Open Library](https://openlibrary.org/)
- Placeholder images generated using [Placehold.co](https://placehold.co/)