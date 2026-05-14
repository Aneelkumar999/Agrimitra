import joblib
import pandas as pd
import numpy as np
import sqlite3
from datetime import datetime, timedelta
import os

def predict_price(mandi_id: int, commodity_id: int, target_date: datetime):
    db_path = os.path.join(os.path.dirname(__file__), 'agrimitra_v2.db')
    conn = sqlite3.connect(db_path)
    
    # Get the most recent data for lags
    # For a real app, we'd need features up to the day before target_date.
    # Since it's mock, we'll just grab the latest available from DB.
    
    query = f"""
    SELECT p.modal_price, w.rainfall, n.ndvi, p.date
    FROM price_history p
    JOIN weather_data w ON p.date = w.date AND p.mandi_id = w.mandi_id
    JOIN ndvi_index n ON p.date = n.date AND p.mandi_id = n.mandi_id
    WHERE p.mandi_id = {mandi_id} AND p.commodity_id = {commodity_id}
    ORDER BY p.date DESC
    LIMIT 31
    """
    df_recent = pd.read_sql(query, conn)
    conn.close()
    
    if len(df_recent) < 30:
        return None

    # Form features for target_date
    price_lag7 = df_recent.iloc[6]['modal_price']
    price_lag30 = df_recent.iloc[29]['modal_price']
    rainfall_lag7 = df_recent.iloc[6]['rainfall']
    ndvi = df_recent.iloc[0]['ndvi']
    
    features = pd.DataFrame([{
        'mandi_id': mandi_id,
        'month': target_date.month,
        'day_of_week': target_date.weekday(),
        'price_lag7': price_lag7,
        'price_lag30': price_lag30,
        'rainfall_lag7': rainfall_lag7,
        'ndvi': ndvi
    }])
    
    model_path = os.path.join(os.path.dirname(__file__), 'ml_models', f'model_comm_{commodity_id}.joblib')
    if not os.path.exists(model_path):
        return None
        
    model = joblib.load(model_path)
    prediction = model.predict(features)[0]
    
    # Simple uncertainty: 5% range
    return {
        "date": target_date.strftime("%Y-%m-%d"),
        "predicted_price": float(prediction),
        "lower_90_ci": float(prediction * 0.95),
        "upper_90_ci": float(prediction * 1.05)
    }
