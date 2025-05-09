# Vietnam Motorbike Helmet Violation Recognition - Frontend

This repository contains the frontend application for the Vietnam Motorbike Helmet Violation Recognition system, a modern web application built with React, TypeScript, and Material UI.

![Motorbike Helmet Detection](https://img.shields.io/badge/Motorbike-Helmet_Detection-blue)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6?logo=typescript)
![Material UI](https://img.shields.io/badge/Material_UI-6.3.0-0081CB?logo=material-ui)
![Vite](https://img.shields.io/badge/Vite-6.0.5-646CFF?logo=vite)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Technologies](#technologies)
- [Requirements](#requirements)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Usage](#usage)
- [Architecture](#architecture)
- [API Integration](#api-integration)
- [Contributing](#contributing)
- [License](#license)

## 🔍 Overview

This project is the frontend component of a system designed to detect and recognize motorcycle helmet violations using computer vision technology. The frontend provides an intuitive interface for monitoring camera feeds, reviewing violation data, and managing the system.

## ✨ Features

- **Real-time Camera Monitoring**: View live camera feeds with MJPEG streaming support
- **Violation Detection**: View and analyze detected helmet violations
- **Dashboard Analytics**: Visualize violation statistics and trends
- **Camera Management**: Add, edit, and manage camera devices
- **Location Management**: Configure and manage monitoring locations
- **User Management**: Administer system users and permissions
- **Responsive Design**: Works on desktop and mobile devices

## 📂 Project Structure

```
vietnam-motorbike-helmet-violation-recognition-fe/
├── public/                  # Public assets
├── src/                     # Source files
│   ├── assets/              # Static assets (images, icons)
│   ├── components/          # Reusable UI components
│   ├── config.tsx           # Environment configurations
│   ├── layout/              # Layout components
│   ├── pages/               # Page components
│   │   ├── Dashboard/       # Dashboard views
│   │   ├── Device/          # Camera device management
│   │   ├── data/            # Data visualization and analytics
│   │   └── ...              # Other page components
│   ├── services/            # API services and utilities
│   ├── stores/              # State management
│   ├── App.tsx              # Main application component
│   └── main.tsx             # Application entry point
├── .gitignore               # Git ignore file
├── index.html               # HTML entry point
├── package.json             # Project dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite configuration
```

## 🛠️ Technologies

- **Core**: React, TypeScript
- **UI Library**: Material UI
- **Build Tool**: Vite
- **State Management**: React Context API
- **Routing**: React Router
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form
- **Charts**: ApexCharts, Recharts
- **Live Data**: WebSockets

## 📋 Requirements

- Node.js 18.x or higher
- npm 9.x or higher
- Modern web browser (Chrome, Firefox, Edge, Safari)

## 🚀 Installation & Setup

1. **Clone the repository**

```bash
git clone https://github.com/your-username/vietnam-motorbike-helmet-violation-recognition-fe.git
cd vietnam-motorbike-helmet-violation-recognition-fe
```

2. **Install dependencies**

```bash
npm install
```

3. **Start development server**

```bash
npm run dev
```

This will start the development server at `http://localhost:5173` (or another port if 5173 is in use).

4. **Build for production**

```bash
npm run build
```

The build output will be in the `dist/` directory.

## ⚙️ Configuration

The application uses environment-specific configuration. Edit the `src/config.tsx` file to set up your API endpoints:

```typescript
// src/config.tsx
const ENV = {
  development: {
    BASE_URL: "http://localhost:3000",
    API_URL: "https://your-dev-api.com/api/",
  },
  production: {
    BASE_URL: "https://yourfrontend.com",
    API_URL: "https://your-production-api.com/api/",
  },
};

// Detect environment
const NODE_ENV = import.meta.env.MODE || "development";

export default ENV[NODE_ENV as "development" | "production"];
```

## 🖥️ Usage

After installation, you can:

1. Log in to the system using the provided credentials
2. Navigate to the Dashboard to view violation statistics
3. Monitor camera feeds in real-time through the Camera Monitoring page
4. Manage cameras and locations through the Device Management page
5. View detected violations and details in the Data section

## 🏗️ Architecture

This application follows a modern React architecture with the following patterns:

### Component Structure

- **Page Components**: Represent full pages and handle data fetching
- **Container Components**: Manage state and business logic
- **UI Components**: Presentational components that render the UI
- **Layout Components**: Handle page layouts and navigation

### Data Flow

1. API services communicate with the backend
2. Page components fetch data and manage local state
3. Data is passed down to child components as props
4. State updates are handled through callbacks or context providers

## 🔌 API Integration

The frontend communicates with the backend API using Axios. The API service is configured in `src/services/axiosInstance.tsx` and provides methods for:

- Authentication
- Camera management
- Violation data retrieval
- User management
- Analytics data

## 👥 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some feature'`)
5. Push to the branch (`git push origin feature/your-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

© 2024 Vietnam Motorbike Helmet Violation Recognition System
