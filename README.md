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

## Error Handling Examples

| Scenario | URL | Result |
|----------|-----|--------|
| Empty parameters | `/?book_title=&author_name=` | Default placeholder |
| Missing author | `/?book_title=NonExistentBook` | Default placeholder |
| Special characters | `/?book_title=L'Étranger&author_name=Albert Camus` | Handles correctly |

## Monitoring

View worker logs in real-time:
```bash
wrangler tail
```

## Security Notes

- Never commit your actual worker routes or domains
- Use environment variables for any environment-specific configuration
- The `wrangler.toml` file is ignored by git to prevent exposing deployment details

## Common Issues

| Issue | Solution |
|-------|----------|
| Placeholder instead of cover | Verify book title and author spelling |
| No image displayed | Check browser console for errors |
| Deployment fails | Ensure `wrangler.toml` is configured correctly |

## License

MIT License