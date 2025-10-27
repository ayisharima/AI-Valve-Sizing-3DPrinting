
import os
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import json
from PIL import Image
import io
from typing import Optional # <--- IMPORT OPTIONAL

# --- 1. INITIAL SETUP & API KEY CONFIGURATION ---
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

# --- 2. DEFINE THE NEW, FLEXIBLE STRUCTURED OUTPUT ---


class ValveAnalysisResponse(BaseModel):
    
    annulus_diameter_mm: Optional[float] = Field(None, description="The measured diameter of the heart valve annulus in millimeters.")
    leaflet_thickness_mm: Optional[float] = Field(None, description="The average thickness of the valve leaflets in millimeters.")
    is_calcification_detected: Optional[bool] = Field(None, description="A boolean flag indicating if calcification was visually detected.")
    
   
    valve_type: Optional[str] = Field(None, description="The type of heart valve being analyzed (e.g., 'Aortic', 'Mitral').")
    sinus_width_mm: Optional[float] = Field(None, description="The inferred width of the sinus in millimeters.")
    
    # Core Fields 
    design_recommendation: str = Field(..., description="A brief, actionable recommendation for the 3D printing process based on the findings.")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="The AI's confidence in its analysis, from 0.0 to 1.0.")


# --- 3. INITIALIZE THE FASTAPI APP ---
app = FastAPI(
    title="AI Valve Sizing API",
    description="An API that uses Gemini Pro Vision to analyze heart valve scans and return structured fabrication data.",
    version="1.1.0" # Version up
)

# --- 4. CONFIGURE CORS ---
origins = ["http://localhost:3000", "http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 5. DEFINE THE API ENDPOINT ---

@app.post("/api/analyze_scan", response_model=ValveAnalysisResponse)
async def analyze_heart_valve_scan(
    doctor_prompt: str = Form(...),
    scan_image: UploadFile = File(...)
):
    if not scan_image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not a valid image.")

    image_bytes = await scan_image.read()
    image = Image.open(io.BytesIO(image_bytes))

    
    system_instruction = f"""
    You are a specialized medical analyst AI. Your task is to analyze the provided medical image based on the doctor's prompt and return your findings in a structured JSON format.

    The user's prompt is: "{doctor_prompt}"

    Based on the prompt and the image, generate a JSON object.
    The JSON output MUST strictly conform to the schema of the fields you can confidently determine. Possible fields are:
    {{
        "annulus_diameter_mm": float,
        "leaflet_thickness_mm": float,
        "is_calcification_detected": boolean,
        "valve_type": "string",
        "sinus_width_mm": float,
        "design_recommendation": "string",
        "confidence_score": float
    }}

    CRITICAL INSTRUCTIONS:
    1.  Only include fields in your JSON response that you can determine from the user's specific prompt and the image.
    2.  The 'design_recommendation' and 'confidence_score' fields are ALWAYS required.
    3.  Your final output must be ONLY the JSON object, without any extra text or markdown formatting.
    """

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content([system_instruction, image])
        
        json_text = response.text.strip().replace("```json\n", "").replace("\n```", "")
        response_data = json.loads(json_text)
        
        validated_data = ValveAnalysisResponse(**response_data)
        return validated_data

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON. Please try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred during AI processing: {str(e)}")

# --- 6. ROOT ENDPOINT ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Valve Sizing API v1.1. Visit /docs for documentation."}