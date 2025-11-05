# AI Image Detection Frontend

A modern, futuristic-themed frontend application for detecting AI-generated images, built with React, TypeScript, and Vite.

## Features

- 🎨 Futuristic AI-themed UI with neon colors
- 🔐 User authentication (register, login, password reset)
- 🖼️ Single image analysis with AI detection
- 📊 Batch image processing
- 📱 Responsive design
- ⚡ Built with Vite for fast development

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **Styling**: CSS3 with custom properties
- **Backend**: FastAPI (separate repository)

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation
```
bash
npm install
npm run dev 
```

# Environment Variables
Create a .env file and add the following line:
```
VITE_API_URL=http://localhost:8008
```

# Project Structure
```
src/
├── components/     # React components
├── contexts/      # React contexts (Auth)
├── services/      # API service functions
├── types/         # TypeScript type definitions
└── App.tsx        # Main app component
```
# Backend Repository
The FastAPI backend for this project is available at: [Backend Repository Link]

## License
MIT

