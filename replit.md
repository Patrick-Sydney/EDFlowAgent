# ED Flow Agent

## Overview

ED Flow Agent is a real-time Emergency Department patient flow dashboard designed for healthcare facilities to track and manage patient movement through various care stages. The application provides a visual kanban-style interface showing patients progressing through seven distinct lanes: Waiting → Triage → Roomed → Diagnostics → Review/Decision → Ready for Disposition → Discharged/Admitted. The system features real-time updates, scenario simulation capabilities (like surge scenarios), and role-based visibility controls. It's built to help ED staff efficiently manage patient flow, reduce wait times, and improve overall emergency department operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client is built using React with TypeScript, leveraging Vite for development and build tooling. The UI framework uses shadcn/ui components built on top of Radix UI primitives, styled with Tailwind CSS. State management is handled through Zustand stores for dashboard state, with React Query for server state management and caching. The application uses Wouter for lightweight client-side routing.

### Backend Architecture
The server follows a REST API pattern built with Express.js and TypeScript. It implements Server-Sent Events (SSE) for real-time communication, allowing the dashboard to receive live updates when patient data changes. The storage layer uses an in-memory storage system for development/demo purposes, with interfaces designed to easily swap to persistent database storage. The server includes middleware for request logging and error handling.

### Data Management
Patient data is structured around an "Encounter" model representing each patient visit, with fields for demographics, triage scores (Australian Triage Scale 1-5), current lane, room assignments, and timestamps. The system tracks seven distinct lanes representing the patient journey through the ED. All data mutations broadcast events via SSE to keep the dashboard synchronized across multiple clients.

### Real-time Communication
The application uses Server-Sent Events for real-time updates, with automatic reconnection logic and connection status monitoring. Events are broadcasted for new encounters, encounter updates, and scenario triggers. The client maintains connection health indicators and gracefully handles disconnections.

### Database Schema
Uses Drizzle ORM with PostgreSQL schema definitions. The encounters table includes patient demographics (name, age, sex, NHI), clinical data (ATS triage score, complaint), flow tracking (lane, room, provider, disposition), and timestamps. The schema supports unique constraints and proper indexing for performance.

## External Dependencies

- **Database**: PostgreSQL via Neon Database (@neondatabase/serverless)
- **ORM**: Drizzle ORM for type-safe database operations
- **UI Framework**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom medical-themed color palette
- **State Management**: Zustand for client state, React Query for server state
- **Real-time**: Server-Sent Events (native browser API)
- **Validation**: Zod for runtime type validation and schema definition
- **Date Handling**: date-fns for time calculations and formatting
- **Development**: Vite with React plugin, TypeScript, and hot module replacement

## Recent Changes

### Latest Update - January 2025
**Bulletproof Room Assignment & Reactive Lane Movement Implementation**
- Implemented deterministic immutable Journey store updates for guaranteed React re-renders
- Created live room/phase derivation hooks (`useRoomAndPhase`, `usePhaseMap`) with robust room extraction
- Fixed patient card headers to use live selectors instead of stale props
- Implemented reactive lane classification using live phase mapping
- Room assignments now trigger instant header updates and automatic lane movement
- Complete end-to-end reactivity: Journey event → Live hooks → UI updates instantly