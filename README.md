# FoodFlow

## Credential Management

### Google Cloud Credentials
1. Copy `matching/foodflowcertificate.template.json` to `matching/foodflowcertificate.json`
2. Fill in your Google Cloud credentials in the new file
3. Never commit `foodflowcertificate.json` to the repository
4. Keep your credentials secure and never share them

### Environment Variables
Create a `.env` file in the root directory with the following structure:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## Development Setup
1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npx expo start
```
