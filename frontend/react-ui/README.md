# AI-Driven Patient-Specific Valve Sizing and 3D Printing Data Generator

##  Overview
This capstone project integrates **FastAPI**, **React**, and **Google Gemini API** to automate the process of **heart valve sizing** and **3D printing data generation** from anatomical images. It demonstrates a real-world application of **AI + multimodal reasoning** in **biomedical engineering**.

---

##  Core Concept
Using Gemini’s multimodal capabilities, the app analyzes an uploaded mock medical image and user instruction, producing **validated anatomical metrics** (JSON) using **Pydantic** schemas.

---

## Architecture
| Step | Component | Description |
|------|------------|--------------|
| 1 | **React (Frontend)** | Upload image & prompt; sends to backend |
| 2 | **FastAPI (Backend)** | Receives file + text, constructs AI request |
| 3 | **Gemini API** | Performs reasoning & returns structured JSON |
| 4 | **Pydantic** | Validates response structure |
| 5 | **React** | Displays results as 3D printing metrics table |

---

##  Setup & Run

### Backend (FastAPI)
```bash
cd backend

uvicorn main:app --reload
