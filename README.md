# AttritionIQ – Employee Attrition Analysis & Prediction

> **Predict. Understand. Retain.**  
> An enterprise-grade, full-stack Machine Learning analytics platform that helps HR leaders, people analytics teams, and business executives understand why employees leave, benchmark 5 classification models, predict individual flight risk, and generate actionable retention plans.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Railway%20Production-00C7B7?style=for-the-badge&logo=railway&logoColor=white)](https://attritioniq-production.up.railway.app/)
[![Swagger Docs](https://img.shields.io/badge/API%20Docs-FastAPI%20Swagger-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://attritioniq-production.up.railway.app/docs)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://attritioniq-production.up.railway.app/)
[![React](https://img.shields.io/badge/React-19%20%2B%20Tailwind-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://attritioniq-production.up.railway.app/)

---

### 🌐 Live Production Links
- 🚀 **Live Web Application:** [https://attritioniq-production.up.railway.app/](https://attritioniq-production.up.railway.app/)
- 📖 **Interactive API Documentation (Swagger):** [https://attritioniq-production.up.railway.app/docs](https://attritioniq-production.up.railway.app/docs)
- 🩺 **Backend Health Endpoint:** [https://attritioniq-production.up.railway.app/health](https://attritioniq-production.up.railway.app/health)

---

## 🏗️ Architecture Overview (8–10 Lines)
1. **Frontend Layer:** Built with React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, and Axios. Features 6 specialized analytical views with zero client-side ML leakage.
2. **Backend Engine:** High-performance Python 3.10+ FastAPI server encapsulating all data science pipelines, statistical computations, and ML operations.
3. **Data Preprocessing:** Automated scikit-learn `ColumnTransformer` with median imputation for numerics, mode imputation for categoricals, `OneHotEncoder`, and `StandardScaler`.
4. **Imbalance-Aware Splitting:** Stratified 80/20 train-test split combined with `class_weight='balanced'` to prevent majority-class retention bias.
5. **5-Model Tournament:** Trains and benchmarks Logistic Regression, Decision Tree, Random Forest, Gradient Boosting, and K-Nearest Neighbors using 5-fold cross-validation.
6. **Champion Selection:** Automatically selects the best model prioritized on F1-score and ROC-AUC rather than misleading raw accuracy.
7. **Explainability & Attribution:** Pinpoints individual employee flight drivers by comparing feature values against organizational medians and model coefficients.
8. **Intervention Engine:** Delivers targeted, rule-based operational HR interventions matched directly to flagged workplace friction points.
9. **Executive AI Layer:** Integrates Google Gemini (`gemini-2.5-flash` / `gemini-3.8-flash`) to generate empathetic 14-day retention plans and manager talking points.
10. **Model Persistence:** Serializes and reloads trained pipelines using `joblib` for resilient, production-ready inference.

---

## 📁 Repository Structure
```
├── backend/
│   ├── main.py                     # FastAPI application with REST API routes & CORS
│   ├── requirements.txt            # Python dependencies (fastapi, scikit-learn, etc.)
│   ├── schemas.py                  # Pydantic v2 data models & validation schemas
│   ├── test_api.py                 # Automated end-to-end API test suite
│   ├── models_store/               # Serialized .joblib model pipelines & metadata
│   └── services/
│       ├── sample_data.py          # Realistic IBM HR 1,470-row synthetic dataset generator
│       ├── preprocessing.py        # sklearn ColumnTransformer & stratified splitting
│       ├── training.py             # 5-model training, 5-fold CV, ROC points & feature importance
│       ├── eda.py                  # Statistical segmentation, correlations & dynamic insights
│       ├── prediction.py           # Single/batch probability inference & risk factor attribution
│       └── advisor.py              # Gemini AI HR retention plan generator with fallback
├── src/                            # Frontend Single Source of Truth (React 19 + TypeScript)
│   ├── App.tsx                     # Master state controller & tab router
│   ├── types/index.ts              # TypeScript interfaces mirroring backend schemas
│   ├── services/api.ts             # Axios REST client with same-origin relative URLs
│   └── components/
│       ├── Header.tsx              # Real-time backend status badge & dark mode toggle
│       ├── HowItWorksModal.tsx     # Explanatory modal on ML lifecycle & metrics
│       ├── AIAdvisorModal.tsx      # Executive retention action plan modal
│       └── Tabs/
│           ├── DataOverviewTab.tsx       # KPI cards, CSV dropzone & preview table
│           ├── EDAInsightsTab.tsx         # 10+ interactive charts & key findings
│           ├── FeatureImportanceTab.tsx   # Top 15 factors with directional impacts
│           ├── ModelTrainingTab.tsx       # 5-model table, ROC curves & confusion matrix
│           ├── PredictRiskTab.tsx         # Individual simulator & batch CSV scoring
│           └── HRDashboardTab.tsx         # Executive risk overview & top 10 roster
├── package.json                    # Root React, Vite, Recharts, Axios dependencies
├── vite.config.ts                  # Vite configuration with API reverse proxy
├── index.html                      # HTML5 entry point with metadata
├── Dockerfile                      # Multi-stage production Dockerfile
├── .env.example                    # Environment variable template
└── README.md                       # Documentation & run instructions
```

---

## 🚀 Unified Single-Service Deployment (Docker)
Build and deploy both frontend and backend together as a single unified service:

```bash
# Build the multi-stage unified Docker image
docker build -t attritioniq:latest .

# Run the unified container (default port 8000)
docker run -p 8000:8000 attritioniq:latest
```
- Open `http://localhost:8000` in your browser.
- FastAPI automatically serves the built React SPA from `./static` at `/` while simultaneously handling all REST API routes at `/health`, `/dataset/summary`, `/eda`, `/train`, `/predict`, etc.
- Seamlessly deployable to Google Cloud Run, AWS App Runner, Render, or any container platform.

---

## 💻 Local Development Setup (Separate Terminals)

### Prerequisites
- **Python:** 3.10 or higher
- **Node.js:** 18 or higher (with npm)
- **Git** (optional)

---

### Mac / Linux Setup

#### 1. Start the Python Backend

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install required dependencies
pip install -r requirements.txt

# Start the FastAPI server on port 8000
uvicorn main:app --reload --port 8000
```
*The backend will be live at `http://localhost:8000`. You can inspect interactive Swagger API documentation at `http://localhost:8000/docs`.*

#### 2. Start the React Frontend
In a new terminal window at the project root:
```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*The web app will launch at `http://localhost:3000`.*

---

### Windows Setup (PowerShell or Command Prompt)

#### 1. Start the Python Backend
```powershell
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv
venv\Scripts\activate

# Install required dependencies
pip install -r requirements.txt

# Start the FastAPI server on port 8000
uvicorn main:app --reload --port 8000
```

#### 2. Start the React Frontend
In a second PowerShell window at the project root:
```powershell
# Install dependencies
npm install

# Start Vite development server
npm run dev
```

---

## 🧪 Automated Testing
Run the included Python verification test suite against a running server:
```bash
# Test against local server
cd backend
python test_api.py http://localhost:8000

# OR test directly against live Railway production deployment
python test_api.py https://attritioniq-production.up.railway.app
```
This tests all 9 core endpoints:
- `GET /health`
- `POST /sample-data`
- `GET /dataset/summary`
- `GET /eda`
- `POST /train`
- `GET /feature-importance`
- `POST /predict`
- `GET /dashboard`
- `POST /advisor`

---

## ⏱️ 3-Minute Hackathon Demo Script

### Minute 0:00 – 0:45: The Problem & Data Ingestion (Tab 1)
- **Speaker:** *"Judges, voluntary employee turnover costs US businesses over $1 trillion annually. When a key engineer or sales lead quits unexpectedly, replacement costs equal 50% to 200% of their annual salary. Welcome to AttritionIQ: an enterprise AI and ML retention platform."*
- **Action:** Point out the green **"Backend: Connected (FastAPI + Python ML)"** badge in the header.
- **Action:** Click **"Load Sample Dataset"**. Show the 1,470 rows of IBM HR Analytics data instantly populate. Highlight the Preprocessing Checklist: median imputation, StandardScaler, OneHotEncoding, and 80/20 stratified split.

### Minute 0:45 – 1:30: Statistical EDA & Feature Drivers (Tabs 2 & 3)
- **Speaker:** *"Next, let's explore Attrition Insights. Notice our automated Plain-English findings: staff working recurring Overtime depart at a 3x higher rate (31.5% vs 10.4%). Notice the commute distance friction and promotion stagnation curves."*
- **Action:** Switch to **"Factors Driving Attrition"**. Show the top 15 features combining Random Forest Gini Importance with Logistic Regression odds ratios. Show the red **Increases Risk** badges vs green **Protective Factor** badges.

### Minute 1:30 – 2:15: The 5-Model Tournament (Tab 4)
- **Speaker:** *"Instead of guessing which algorithm works best, AttritionIQ trains 5 distinct classifiers with 5-fold cross-validation: Logistic Regression, Decision Tree, Random Forest, Gradient Boosting, and KNN."*
- **Action:** Show the **Model Benchmark Table**. Point out that raw accuracy is misleading on imbalanced datasets, so our champion model is selected based on **F1-Score and ROC-AUC**. Hover over the multi-model **ROC Curves** and the interactive **Confusion Matrix**.

### Minute 2:15 – 3:00: Interactive Risk Simulation & AI HR Advisor (Tabs 5 & 6)
- **Speaker:** *"Now for the core magic: Predict Risk. Let's simulate a senior sales representative who is logging frequent overtime, commuting 18 miles, and has gone 4 years without a promotion."*
- **Action:** Click **"Compute Attrition Risk"**. The radial gauge computes a **78.4% HIGH RISK** probability.
- **Speaker:** *"Notice we don't just output a black-box probability. We attribute the exact root causes and provide targeted operational HR actions."*
- **Action:** Click **"Generate AI HR Retention Plan"**. Modal opens with the Gemini-powered 14-day action plan, workload review steps, and direct manager talking points.
- **Speaker:** *"Finally, the HR Dashboard provides enterprise leaders with a live roster of priority flight risks before they hand in their two weeks' notice. Thank you!"*

---

## 🔑 Environment Variables
| Variable | Description | Default |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key for executive retention plans | Injected via secrets / runtime |
| `VITE_API_URL` | Backend URL for frontend REST calls | `http://localhost:8000` (or `/api` proxy) |
| `PORT` | FastAPI server listening port | `8000` |
