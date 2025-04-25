# Python Learning Platform

A personalized Python learning platform that generates dynamic assessments using the Gemini API and creates customized learning paths based on skill gaps.

## Features

- User authentication (login/register)
- Dynamic Python assessment generation
- AI-powered answer evaluation
- Personalized learning paths
- Interactive learning content generation

## Prerequisites

- Node.js 18.x or later
- MongoDB database
- Gemini API key

## Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd python-learning-platform
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following variables:

```
DATABASE_URL="your-mongodb-connection-string"
NEXTAUTH_SECRET="your-secret-key"
GEMINI_API_KEY="your-gemini-api-key"
NEXTAUTH_URL="http://localhost:3000"
```

4. Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:3000

## Usage

1. Register a new account or login with existing credentials
2. Take the Python assessment
3. Review your personalized learning path
4. Click on learning path items to generate detailed content
5. Track your progress and improve your Python skills

## Technologies Used

- Next.js 14
- TypeScript
- MongoDB
- NextAuth.js
- Gemini API
- Tailwind CSS

## Security

- Passwords are hashed using bcrypt
- JWT-based authentication
- Protected API routes
- Environment variables for sensitive data

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
