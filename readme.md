# duology

Convert social posts (Farcaster, Lens, and X/Twitter) to images

## Try Out

[https://duology.vercel.app](https://duology.vercel.app)

## Supported Social Sources

- **Farcaster** (Warpcast): Paste link to any cast, e.g. `https://warpcast.com/~/cast/0x8b...`
- **Lens v3**: Paste link to any post, e.g. `https://lens.xyz/posts/0x01-12345`
- **X/Twitter**: Paste link to any tweet, e.g. `https://twitter.com/username/status/1234567890` (uses public syndication API, no keys required)

## How it works

1. Enter a post URL and generate a branded image.
2. Add to gallery and share.
3. 100% free – no API keys required for basic usage.

## Environment Variables

See [`.env.example`](./.env.example) for the minimal list.  
Copy it to `.env` and fill in your Supabase keys.

- `NEYNAR_API_KEY` (optional, for Farcaster; otherwise uses public endpoints with lower rate-limits)
- No Twitter API or RapidAPI keys are required.

## Contribution

Feel free to contribute. Open a new [issue](https://github.com/ozgrozer/duology/issues), or make a [pull request](https://github.com/ozgrozer/duology/pulls).

## License

[GPL-3.0](license)
