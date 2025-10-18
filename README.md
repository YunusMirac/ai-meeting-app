# AI-Meeting: Real-time Video Conferencing with AI Summaries

A full-stack web application for **real-time video conferences and chats**, powered by an AI that automatically transcribes and summarizes meetings.

---

## Overview

**AI-Meeting** was developed as a **portfolio project** to demonstrate modern web technologies and real-time communication.  
It showcases a full-stack architecture built with **FastAPI** (backend) and **React** (frontend), leveraging **WebRTC** and **WebSockets** for low-latency communication and integrating external **AI services** such as:

- **Google Cloud Speech-to-Text** – for automatic transcription  
- **Google Gemini API** – for intelligent meeting summaries  

---

## Key Features

### Multi-User HD Video Conferencing  
Crystal-clear video and audio communication between multiple participants, implemented with **WebRTC** for direct peer-to-peer connections and low latency.

### AI-Powered Summaries  
After each meeting, an **AI pipeline** automatically processes the audio recordings.  
It uses **Google Cloud Speech-to-Text** for transcription and the **Google Gemini API** to generate a professional summary — including **key decisions** and **action items**.

### Integrated Real-time Chat  
Next to the meeting feature it is existing a chat function implemented with **Websocket**

### Secure & Private Rooms  
Meetings can be created with **password protection**, and user authentication is handled via **JWTs (JSON Web Tokens)** for security.

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React, TypeScript, CSS |
| Backend | FastAPI (Python) |
| Real-time | WebRTC, WebSockets |
| AI / Cloud | Google Cloud Speech-to-Text, Gemini API |
| Auth | JWT (JSON Web Tokens) |
| Database | PostgreSQL with SQLAlchemy (ORM) & Alembic (Migrations)|

---

## Screenshots


## Author
Yunus Mirac Comart
Media Informatics Student - Aspiring Software Developer

GitHub Account: https://github.com/YunusMirac
