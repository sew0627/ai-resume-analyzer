import os
import json
import PyPDF2
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

# Initialize Gemini Client
api_key = os.getenv("GOOGLE_API_KEY")
client = None
if api_key and api_key != "your_api_key_here":
    client = genai.Client(api_key=api_key)

def read_resume(file):
    text = ""
    reader = PyPDF2.PdfReader(file)
    for page in reader.pages:
        if page.extract_text():
            text += page.extract_text() + "\n"
    return text

def analyze_resume(text, job_role=""):
    if not client:
        raise ValueError("Google API Key not configured. Please set GOOGLE_API_KEY in .env")
        
    role_context = f"specifically for the target role of '{job_role}'" if job_role else "against general industry standards"
        
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=f"""
You are an expert ATS Resume Analyzer, Recruiter, Career Coach, and HR Consultant.

Analyze the uploaded resume thoroughly {role_context}. Your analysis should be similar to modern ATS platforms such as Jobscan, Resume Worded, Enhancv, Teal, and Rezi.

Evaluate the resume based on these criteria:
1. ATS Compatibility, 2. Resume Structure, 3. Contact Information, 4. Professional Summary, 5. Technical Skills, 6. Soft Skills, 7. Work Experience, 8. Academic Projects, 9. Education, 10. Certifications, 11. Keyword Optimization, 12. Action Verbs, 13. Quantifiable Achievements, 14. Formatting Quality, 15. Job Readiness, 16. Industry Fit, 17. Missing Information, 18. Recommendations.

Resume:
{text}

Return ONLY valid JSON matching this exact schema:
{{
  "overall_score": 85,
  "overall_summary": "High level summary...",
  "keyword_match": {{ "matched": 80, "partial": 10, "missing": 10, "summary": "..." }},
  "sections": {{
    "ats_compatibility": {{ "score": 90, "strengths": [], "weaknesses": [], "recommendations": [] }},
    "resume_structure": {{ "score": 90, "strengths": [], "weaknesses": [], "recommendations": [] }},
    "contact_information": {{ "score": 90, "strengths": [], "weaknesses": [], "recommendations": [] }},
    "professional_summary": {{ "score": 90, "strengths": [], "weaknesses": [], "recommendations": [] }},
    "technical_skills": {{ "score": 90, "strengths": [], "weaknesses": [], "recommendations": [] }},
    "soft_skills": {{ "score": 90, "strengths": [], "weaknesses": [], "recommendations": [] }},
    "work_experience": {{ "score": 90, "strengths": [], "weaknesses": [], "recommendations": [] }},
    "academic_projects": {{ "score": 90, "strengths": [], "weaknesses": [], "recommendations": [] }},
    "education": {{ "score": 90, "strengths": [], "weaknesses": [], "recommendations": [] }},
    "certifications": {{ "score": 90, "strengths": [], "weaknesses": [], "recommendations": [] }},
    "keyword_optimization": {{ "score": 90, "strengths": [], "weaknesses": [], "recommendations": [] }},
    "action_verbs": {{ "score": 90, "strengths": [], "weaknesses": [], "recommendations": [] }},
    "quantifiable_achievements": {{ "score": 90, "strengths": [], "weaknesses": [], "recommendations": [] }},
    "formatting_quality": {{ "score": 90, "strengths": [], "weaknesses": [], "recommendations": [] }},
    "job_readiness": {{ "score": 90, "strengths": [], "weaknesses": [], "recommendations": [] }},
    "industry_fit": {{ "score": 90, "strengths": [], "weaknesses": [], "recommendations": [] }},
    "missing_information": {{ "score": 90, "strengths": [], "weaknesses": [], "recommendations": [] }},
    "general_recommendations": [] 
  }}
}}

Rules:
- Generate realistic scores between 0-100.
- Output ONLY JSON
- No extra text
"""
        )
        
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3].strip()
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:-3].strip()
            
        return json.loads(raw_text)
    except Exception as e:
        print(f"Error calling Gemini: {str(e)}")
        raise

@app.route('/')
def serve_index():
    return send_from_directory('static', 'index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
        
    file = request.files['file']
    job_role = request.form.get('job_role', '').strip()
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Only PDF files are supported"}), 400

    try:
        resume_text = read_resume(file)
        
        if not resume_text.strip():
            return jsonify({"error": "Could not extract text from the PDF. It might be an image-based PDF or empty."}), 400

        result = analyze_resume(resume_text, job_role)
        return jsonify(result)
        
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 500
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
