import pandas as pd
import numpy as np
import sqlite3
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib
import os

def train_models():
    conn = sqlite3.connect('backend/agrimitra_v2.db')
    
    # Load data
    df_price = pd.read_sql("SELECT * FROM price_history", conn)
    df_weather = pd.read_sql("SELECT * FROM weather_data", conn)
    df_ndvi = pd.read_sql("SELECT * FROM ndvi_index", conn)
    
    # Convert dates
    df_price['date'] = pd.to_datetime(df_price['date'])
    df_weather['date'] = pd.to_datetime(df_weather['date'])
    df_ndvi['date'] = pd.to_datetime(df_ndvi['date'])
    
    # Merge
    df = df_price.merge(df_weather, on=['date', 'mandi_id'], how='left')
    df = df.merge(df_ndvi, on=['date', 'mandi_id'], how='left')
    
    # Feature Engineering
    df = df.sort_values(['mandi_id', 'commodity_id', 'date'])
    
    # Lags
    df['price_lag7'] = df.groupby(['mandi_id', 'commodity_id'])['modal_price'].shift(7)
    df['price_lag30'] = df.groupby(['mandi_id', 'commodity_id'])['modal_price'].shift(30)
    df['rainfall_lag7'] = df.groupby(['mandi_id', 'commodity_id'])['rainfall'].shift(7)
    
    # Time features
    df['month'] = df['date'].dt.month
    df['day_of_week'] = df['date'].dt.dayofweek
    
    df = df.dropna()
    
    os.makedirs('backend/ml_models', exist_ok=True)
    
    commodities = df['commodity_id'].unique()
    
    for comm_id in commodities:
        print(f"Training model for commodity {comm_id}...")
        df_comm = df[df['commodity_id'] == comm_id]
        
        X = df_comm[['mandi_id', 'month', 'day_of_week', 'price_lag7', 'price_lag30', 'rainfall_lag7', 'ndvi']]
        y = df_comm['modal_price']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=5)
        model.fit(X_train, y_train)
        
        preds = model.predict(X_test)
        mae = mean_absolute_error(y_test, preds)
        print(f"MAE for commodity {comm_id}: {mae:.2f}")
        
        joblib.dump(model, f'backend/ml_models/model_comm_{comm_id}.joblib')
        
    conn.close()
    print("All models trained and saved.")

if __name__ == "__main__":
    train_models()
