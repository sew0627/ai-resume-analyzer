# 🚀 AI Resume Analyzer

A sleek, modern, and highly analytical AI-powered Resume Analyzer. Built with a Flask backend and powered by Google's Gemini Pro LLM, this tool acts as an expert ATS (Applicant Tracking System) and Career Coach. It evaluates uploaded PDF resumes against 18 critical recruiting metrics and renders the feedback in a beautiful, minimalist monochrome dashboard.

![Dashboard Preview](https://via.placeholder.com/800x400?text=AI+Resume+Analyzer+Dashboard)

## ✨ Features
- **18-Point Expert Analysis:** Analyzes Structure, Experience, Skills, and Job Alignment using a highly structured Gemini AI prompt.
- **Data-Driven Dashboard:** Features interactive Chart.js Performance Radars, Keyword Match Donut charts, and sleek horizontal Section Score progress bars.
- **Premium Monochrome UI:** A stealthy, black-and-grey dark mode aesthetic inspired by high-end developer tools.
- **Intelligent Aggregation:** Condenses massive amounts of AI feedback into top 5 prioritized lists for actionable, clutter-free insights.
- **PDF Extraction:** Built-in PyPDF2 integration to read and process resumes instantly.

## 🛠️ Technology Stack
- **Backend:** Python, Flask, Gunicorn
- **AI Integration:** Google GenAI SDK (Gemini Pro)
- **Frontend:** Vanilla JS, HTML5, Vanilla CSS
- **Data Visualization:** Chart.js

## 🚀 Local Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-resume-analyzer.git
   cd ai-resume-analyzer
   ```

2. **Create a Virtual Environment (Optional but recommended)**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables**
   Create a `.env` file in the root directory and add your Google API key:
   ```env
   GOOGLE_API_KEY=your_gemini_api_key_here
   ```

5. **Run the Application**
   ```bash
   python app.py
   ```
   Open your browser and navigate to `http://localhost:5000`.

## 🔒 Security Note
The `.env` file containing your API keys is intentionally included in the `.gitignore` file and will not be tracked by Git. **Never commit your API keys to GitHub.**

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/ai-resume-analyzer/issues).

## 📝 License
This project is [MIT](https://choosealicense.com/licenses/mit/) licensed.
