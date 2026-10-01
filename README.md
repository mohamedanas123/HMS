# Hospital Management System (HMS)

A full-stack Hospital Management System built with **Spring Boot** and **React (Vite)**.

## Project Structure

```text
HMS/
├── Backend/
│   └── demo/            # Spring Boot REST API (Java 21, Maven)
├── frontend/            # React SPA (Vite, React Router, Axios)
├── logs/                # Application runtime logs
└── .gitignore           # Git ignore rules for full-stack repository
```

## Tech Stack

- **Backend**: Java 21, Spring Boot, Spring Security (JWT), Maven, JPA / Hibernate
- **Frontend**: React 18, Vite, React Router DOM, Axios, React Hot Toast
- **Build Tools**: Apache Maven (wrapper included), Node.js / npm

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd Backend/demo
   ```
2. Build and run the Spring Boot application:
   ```bash
   ./mvnw clean spring-boot:run
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
