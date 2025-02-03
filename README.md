# Mind Mentor 

An AI-powered study assistant that helps students create personalized study plans, find learning resources, and track their progress.

## Features

### 1. Study Planning 📚
- Generate personalized study plans based on subject and exam date
- Track progress with an interactive calendar
- Get smart recommendations for study sessions

### 2. Resource Curation 🔍
- Find the best learning resources for any subject
- Access curated video tutorials, courses, and documentation
- Save and organize learning materials

### 3. Productivity Tools ⚡
- Pomodoro Timer for focused study sessions
- Smart Notes system for organizing learning materials
- Progress tracking and statistics

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + Shadcn UI
- NextAuth.js for authentication

### Backend
- Express.js server
- MongoDB with Mongoose
- Google Gemini AI
- Tavily API

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/KartikLabhshetwar/mind-mentor
cd mind-mentor
```

2. Install dependencies:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

3. Set up environment variables:

Create `.env.local` in root directory:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
MONGODB_URI=your-mongodb-uri
AI_MIDDLEWARE_URL=http://localhost:3001
```

Create `server/.env`:
```env
GOOGLE_API_KEY=your-gemini-api-key
TAVILY_API_KEY=your-tavily-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Start the development servers:

Frontend:
```bash
npm run dev
```

Backend:
```bash
cd server
npm run dev
```

## Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Backend (Render)
1. Push server directory to GitHub
2. Create new Web Service on Render
3. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add environment variables
5. Deploy

## API Routes

### Study Plan
- `POST /api/plan`: Generate study plan
- `GET /api/study-plan`: Get user's plans
- `PUT /api/study-plan/:id`: Update plan

### Resources
- `POST /api/curate`: Get curated resources
- `GET /api/resources`: Get saved resources
- `POST /api/resources`: Save new resource

### User
- `POST /api/auth/signin`: Sign in
- `POST /api/auth/register`: Register
- `GET /api/user/profile`: Get profile
- `PUT /api/user/profile`: Update profile

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License

---

Built by Kartik Labhshetwar
