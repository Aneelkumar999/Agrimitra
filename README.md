
# AgriMitra v2.0 - Agricultural Advisor Platform

AgriMitra v2.0 is a comprehensive digital platform designed to empower farmers in Telangana and Andhra Pradesh with data-driven insights and AI-powered advice. It provides real-time market information, price predictions, irrigation guidance, and access to government schemes and storage facilities.

## Frontend:https://agrimitraseva.netlify.app/
## Backend:https://agrimitra-backend.onrender.com

## 🚀 Key Features

- **Market Insights:** Access historical and current modal prices for various commodities across major Mandis (markets) in Telangana and AP.
- **Price Prediction:** Machine learning models forecast future commodity prices to help farmers decide when to sell.
- **AI Advisor:** A Gemini-powered chat interface providing expert agricultural advice.
- **Smart Irrigation:** Tailored irrigation recommendations based on local weather data and NDVI (Normalized Difference Vegetation Index).
- **Mandi Recommendation:** Recommends the most profitable market based on predicted prices, distance, and transportation costs.
- **Schemes & Storage:** Discover relevant government schemes and book slots in nearby cold storage facilities.
- **Comprehensive Data:** Integrated weather and vegetation health monitoring for better farm management.

## 🛠️ Tech Stack

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database:** SQLite with [SQLAlchemy](https://www.sqlalchemy.org/) ORM
- **AI/ML:** 
  - [Google Gemini API](https://ai.google.dev/) (Generative AI for advice)
  - Scikit-learn, XGBoost, Pandas, Numpy (Price prediction models)
- **Authentication:** JWT-based security

### Frontend
- **Framework:** [React](https://reactjs.org/) (TypeScript)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Visualization:** [Recharts](https://recharts.org/)
- **Icons:** [Lucide React](https://lucide.dev/)

## 📂 Project Structure

```text
.
├── backend/            # FastAPI application, database models, and ML inference
├── frontend/           # React frontend application
├── data/               # Mock data generation and ML model training scripts
└── notebooks/          # Data exploration and analysis
```

## ⚙️ Setup and Installation

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend` directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
5. Initialize the database and generate mock data:
   ```bash
   python init_db.py
   python ../data/generate_mock_data.py
   ```
6. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📈 Machine Learning

The project uses historical price data to train regression models for each major commodity. These models consider seasonality and market trends to provide price forecasts. Training scripts can be found in the `data/` directory.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. (Note: Add a LICENSE file if needed)

---
Built with ❤️ for the farming community.
