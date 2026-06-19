from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from typing import List
import models
import datetime
import math
from inference import predict_price
import os
from dotenv import load_dotenv
from jose import JWTError, jwt
import auth
from pydantic import BaseModel
import google.generativeai as genai

# Load .env
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model_ai = genai.GenerativeModel('gemini-flash-latest')

app = FastAPI(title="AgriMitra v2.0 API")

DATABASE_URL = "sqlite:///./agrimitra_v2.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

models.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class ChatRequest(BaseModel):
    message: str
    mandi_name: str
    commodity_name: str

@app.post("/api/v1/auth/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = auth.create_access_token(data={"sub": new_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/v1/auth/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = auth.create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

@app.get("/api/v1/auth/me")
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "latitude": current_user.latitude,
        "longitude": current_user.longitude
    }

@app.post("/api/v1/chat")
def chat_with_advisor(req: ChatRequest):
    prompt = f"""
    You are an expert agricultural advisor for the AgriMitra platform. 
    The farmer is currently looking at {req.commodity_name} in {req.mandi_name} market.
    Provide concise, practical, and helpful advice based on their question: "{req.message}"
    Keep your response under 3 sentences if possible. Use a friendly and professional tone.
    """
    try:
        print(f"DEBUG: Sending prompt to Gemini: {prompt[:50]}...")
        response = model_ai.generate_content(prompt)
        return {"response": response.text}
    except Exception as e:
        print(f"ERROR in chat_with_advisor: {str(e)}")
        return {"response": f"I'm having trouble connecting to my knowledge base right now. Error details: {str(e)[:100]}"}

@app.get("/api/v1/mandis")
def read_mandis(db: Session = Depends(get_db)):
    return db.query(models.Mandi).all()

@app.get("/api/v1/commodities")
def read_commodities(db: Session = Depends(get_db)):
    return db.query(models.Commodity).all()

@app.get("/api/v1/history")
def read_history(mandi_id: int, commodity_id: int, days: int = 30, db: Session = Depends(get_db)):
    start_date = datetime.date.today() - datetime.timedelta(days=days)
    return db.query(models.PriceHistory).filter(
        models.PriceHistory.mandi_id == mandi_id,
        models.PriceHistory.commodity_id == commodity_id,
        models.PriceHistory.date >= start_date
    ).order_by(models.PriceHistory.date.asc()).all()

@app.get("/api/v1/predict")
def get_prediction(mandi_id: int, commodity_id: int, date: str = None):
    if not date:
        target_date = datetime.datetime.now() + datetime.timedelta(days=7)
    else:
        target_date = datetime.datetime.strptime(date, "%Y-%m-%d")
    
    return predict_price(mandi_id, commodity_id, target_date)

@app.get("/api/v1/market-summary/{mandi_id}")
def get_market_summary(mandi_id: int, db: Session = Depends(get_db)):
    latest_date = db.query(models.PriceHistory.date).order_by(models.PriceHistory.date.desc()).first()
    if not latest_date:
        return []
    return db.query(models.PriceHistory).filter(
        models.PriceHistory.mandi_id == mandi_id,
        models.PriceHistory.date == latest_date[0]
    ).all()

@app.get("/api/v1/weather")
def read_weather(mandi_id: int, days: int = 30, db: Session = Depends(get_db)):
    start_date = datetime.date.today() - datetime.timedelta(days=days)
    return db.query(models.WeatherData).filter(
        models.WeatherData.mandi_id == mandi_id,
        models.WeatherData.date >= start_date
    ).order_by(models.WeatherData.date.asc()).all()

@app.get("/api/v1/ndvi")
def read_ndvi(mandi_id: int, days: int = 30, db: Session = Depends(get_db)):
    start_date = datetime.date.today() - datetime.timedelta(days=days)
    return db.query(models.NDVIIndex).filter(
        models.NDVIIndex.mandi_id == mandi_id,
        models.NDVIIndex.date >= start_date
    ).order_by(models.NDVIIndex.date.asc()).all()

def calculate_distance(lat1, lon1, lat2, lon2):
    # Haversine formula
    R = 6371 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

@app.get("/api/v1/recommend-mandi")
def recommend_mandi(commodity_id: int, lat: float, lon: float, db: Session = Depends(get_db)):
    mandis = db.query(models.Mandi).all()
    recommendations = []
    
    target_date = datetime.datetime.now() + datetime.timedelta(days=1)
    
    for mandi in mandis:
        prediction = predict_price(mandi.id, commodity_id, target_date)
        if prediction:
            dist = calculate_distance(lat, lon, mandi.latitude, mandi.longitude)
            # Rough transport cost: 2 Rs per km per quintal
            transport_cost = dist * 2.0
            net_price = prediction['predicted_price'] - transport_cost
            
            recommendations.append({
                "mandi_id": mandi.id,
                "mandi_name": mandi.name,
                "predicted_price": prediction['predicted_price'],
                "distance_km": round(dist, 2),
                "transport_cost": round(transport_cost, 2),
                "net_profit": round(net_price, 2)
            })
            
    recommendations.sort(key=lambda x: x['net_profit'], reverse=True)
    return recommendations

@app.get("/api/v1/alerts")
def read_alerts(db: Session = Depends(get_db)):
    return db.query(models.Alert).order_by(models.Alert.date.desc()).limit(10).all()

@app.get("/api/v1/irrigation-advice/{mandi_id}")
def get_irrigation_advice(mandi_id: int, db: Session = Depends(get_db)):
    # Get last 7 days of weather
    start_date = datetime.date.today() - datetime.timedelta(days=7)
    weather = db.query(models.WeatherData).filter(
        models.WeatherData.mandi_id == mandi_id,
        models.WeatherData.date >= start_date
    ).all()
    
    total_rainfall = sum([w.rainfall for w in weather])
    avg_temp = sum([w.temperature for w in weather]) / len(weather) if weather else 30
    
    # Get latest NDVI
    latest_ndvi = db.query(models.NDVIIndex).filter(
        models.NDVIIndex.mandi_id == mandi_id
    ).order_by(models.NDVIIndex.date.desc()).first()
    
    ndvi_val = latest_ndvi.ndvi if latest_ndvi else 0.5
    
    status = "Optimal"
    advice = "Soil moisture is adequate. No immediate watering required."
    icon = "💧"
    
    if total_rainfall < 2 and avg_temp > 35:
        status = "Critical"
        advice = "High evaporation and low rainfall. Immediate irrigation recommended."
        icon = "⚠️"
    elif total_rainfall < 10 and ndvi_val < 0.4:
        status = "Watering Needed"
        advice = "Vegetation density is low and recent rain was minimal. Consider watering soon."
        icon = "🚿"
    elif total_rainfall > 50:
        status = "Waterlogged"
        advice = "Heavy rainfall detected. Ensure proper drainage to prevent root rot."
        icon = "🌊"
        
    return {
        "status": status,
        "advice": advice,
        "icon": icon,
        "rainfall_7d": round(total_rainfall, 1),
        "avg_temp_7d": round(avg_temp, 1),
        "ndvi": round(ndvi_val, 2)
    }

@app.get("/api/v1/schemes")
def read_schemes(state: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Scheme)
    if state:
        query = query.filter((models.Scheme.state == state) | (models.Scheme.state == 'Central'))
    return query.all()

@app.get("/api/v1/storage")
def read_storage(mandi_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.ColdStorage)
    if mandi_id:
        query = query.filter(models.ColdStorage.mandi_id == mandi_id)
    return query.all()

class BookingRequest(BaseModel):
    storage_id: int
    commodity_id: int
    quantity_qtl: float
    duration_months: int = 1

@app.post("/api/v1/bookings")
def create_booking(req: BookingRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_booking = models.Booking(
        user_id=current_user.id,
        storage_id=req.storage_id,
        commodity_id=req.commodity_id,
        quantity_qtl=req.quantity_qtl,
        duration_months=req.duration_months
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return {"message": "Booking successful", "booking_id": new_booking.id}

@app.get("/api/v1/bookings/my")
def get_my_bookings(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    bookings = db.query(models.Booking).filter(models.Booking.user_id == current_user.id).all()
    results = []
    for b in bookings:
        results.append({
            "id": b.id,
            "storage_name": b.storage.name,
            "commodity_name": b.commodity.name,
            "quantity": b.quantity_qtl,
            "duration": b.duration_months,
            "date": b.booking_date,
            "status": b.status
        })
    return results
