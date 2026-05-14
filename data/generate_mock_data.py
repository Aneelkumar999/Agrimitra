import pandas as pd
import numpy as np
import sqlite3
from datetime import datetime, timedelta
import random

def generate_mock_data():
    # 1. Setup Dates
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=730)
    date_range = pd.date_range(start=start_date, end=end_date)

    # 2. Commodities (Comprehensive list)
    commodities = [
        {"id": 1, "name": "Paddy", "variety": "Common", "category": "Cereals", "msp": 2369.0, "unit": "quintal"},
        {"id": 2, "name": "Maize", "variety": "Hybrid", "category": "Cereals", "msp": 2090.0, "unit": "quintal"},
        {"id": 3, "name": "Cotton", "variety": "Long Staple", "category": "Fiber", "msp": 7521.0, "unit": "quintal"},
        {"id": 4, "name": "Redgram", "variety": "Tur", "category": "Pulses", "msp": 7550.0, "unit": "quintal"},
        {"id": 5, "name": "Groundnut", "variety": "Pod", "category": "Oilseeds", "msp": 6783.0, "unit": "quintal"},
        {"id": 6, "name": "Rice", "variety": "Sona Masuri", "category": "Cereals", "msp": 3500.0, "unit": "quintal"},
        {"id": 7, "name": "Wheat", "variety": "Lokwan", "category": "Cereals", "msp": 2275.0, "unit": "quintal"},
        {"id": 8, "name": "Mango", "variety": "Banganapalli", "category": "Fruits", "msp": 0.0, "unit": "quintal"},
        {"id": 9, "name": "Tomato", "variety": "Local", "category": "Vegetables", "msp": 0.0, "unit": "quintal"},
        {"id": 10, "name": "Chilli", "variety": "Guntur Sannam", "category": "Spices", "msp": 0.0, "unit": "quintal"},
        {"id": 11, "name": "Turmeric", "variety": "Finger", "category": "Spices", "msp": 0.0, "unit": "quintal"},
        {"id": 12, "name": "Onion", "variety": "Red", "category": "Vegetables", "msp": 0.0, "unit": "quintal"},
        {"id": 13, "name": "Banana", "variety": "Robusta", "category": "Fruits", "msp": 0.0, "unit": "quintal"},
        {"id": 14, "name": "Sugarcane", "variety": "Common", "category": "Sugar", "msp": 315.0, "unit": "quintal"}
    ]
    df_comm = pd.DataFrame(commodities)

    # 3. Expanded Mandis (Covering major districts of TS & AP)
    mandis = [
        # Telangana
        {"id": 1, "name": "Warangal", "state": "Telangana", "district": "Warangal", "lat": 17.9689, "lon": 79.5941},
        {"id": 2, "name": "Nizamabad", "state": "Telangana", "district": "Nizamabad", "lat": 18.6725, "lon": 78.0941},
        {"id": 3, "name": "Khammam", "state": "Telangana", "district": "Khammam", "lat": 17.2473, "lon": 80.1514},
        {"id": 4, "name": "Karimnagar", "state": "Telangana", "district": "Karimnagar", "lat": 18.4386, "lon": 79.1288},
        {"id": 5, "name": "Mahbubnagar", "state": "Telangana", "district": "Mahbubnagar", "lat": 16.7367, "lon": 77.9810},
        {"id": 6, "name": "Suryapet", "state": "Telangana", "district": "Suryapet", "lat": 17.1500, "lon": 79.6200},
        {"id": 7, "name": "Nalgonda", "state": "Telangana", "district": "Nalgonda", "lat": 17.0500, "lon": 79.2700},
        {"id": 8, "name": "Adilabad", "state": "Telangana", "district": "Adilabad", "lat": 19.6667, "lon": 78.5333},
        {"id": 9, "name": "Siddipet", "state": "Telangana", "district": "Siddipet", "lat": 18.1019, "lon": 78.8520},
        {"id": 19, "name": "Kamareddy", "state": "Telangana", "district": "Kamareddy", "lat": 18.3181, "lon": 78.3353},
        {"id": 20, "name": "Jagityal", "state": "Telangana", "district": "Jagityal", "lat": 18.7907, "lon": 78.9135},
        {"id": 21, "name": "Medak", "state": "Telangana", "district": "Medak", "lat": 18.0494, "lon": 78.2616},
        {"id": 22, "name": "Gadwal", "state": "Telangana", "district": "Jogulamba Gadwal", "lat": 16.2307, "lon": 77.6083},
        
        # Andhra Pradesh
        {"id": 10, "name": "Guntur", "state": "Andhra Pradesh", "district": "Guntur", "lat": 16.3067, "lon": 80.4365},
        {"id": 11, "name": "Kurnool", "state": "Andhra Pradesh", "district": "Kurnool", "lat": 15.8281, "lon": 78.0373},
        {"id": 12, "name": "Vijayawada", "state": "Andhra Pradesh", "district": "NTR", "lat": 16.5062, "lon": 80.6480},
        {"id": 13, "name": "Visakhapatnam", "state": "Andhra Pradesh", "district": "Visakhapatnam", "lat": 17.6868, "lon": 83.2185},
        {"id": 14, "name": "Anantapur", "state": "Andhra Pradesh", "district": "Anantapur", "lat": 14.6819, "lon": 77.6006},
        {"id": 15, "name": "Nellore", "state": "Andhra Pradesh", "district": "Nellore", "lat": 14.4426, "lon": 79.9865},
        {"id": 16, "name": "Chittoor", "state": "Andhra Pradesh", "district": "Chittoor", "lat": 13.2172, "lon": 79.1003},
        {"id": 17, "name": "Eluru", "state": "Andhra Pradesh", "district": "Eluru", "lat": 16.7107, "lon": 81.1035},
        {"id": 18, "name": "Kadapa", "state": "Andhra Pradesh", "district": "Kadapa", "lat": 14.4673, "lon": 78.8242},
        {"id": 23, "name": "Ongole", "state": "Andhra Pradesh", "district": "Prakasam", "lat": 15.5057, "lon": 80.0499},
        {"id": 24, "name": "Kakinada", "state": "Andhra Pradesh", "district": "Kakinada", "lat": 16.9891, "lon": 82.2475},
        {"id": 25, "name": "Srikakulam", "state": "Andhra Pradesh", "district": "Srikakulam", "lat": 18.3019, "lon": 83.8918},
        {"id": 26, "name": "Tirupati", "state": "Andhra Pradesh", "district": "Tirupati", "lat": 13.6285, "lon": 79.4192}
    ]
    df_mandi = pd.DataFrame(mandis)

    conn = sqlite3.connect('backend/agrimitra_v2.db')
    
    # 4. History, Weather, NDVI
    price_records = []
    weather_records = []
    ndvi_records = []

    print("Generating history data for all mandis...")
    for mandi in mandis:
        mandi_bias = 0.85 + 0.3 * np.random.random()
        
        for date in date_range:
            # Weather
            rainfall = max(0, np.random.normal(5, 10)) if date.month in [6,7,8,9] else max(0, np.random.normal(0.5, 2))
            temp = np.random.normal(32, 5)
            weather_records.append({
                "date": date.date(),
                "mandi_id": mandi["id"],
                "rainfall": rainfall,
                "temperature": temp
            })

            # NDVI
            ndvi = 0.3 + 0.4 * np.sin((date.dayofyear / 365) * 2 * np.pi) + np.random.normal(0, 0.05)
            ndvi_records.append({
                "date": date.date(),
                "mandi_id": mandi["id"],
                "ndvi": max(0, min(1, ndvi))
            })

            # Prices
            for comm in commodities:
                base_price = comm["msp"] if comm["msp"] > 0 else 3500.0
                base_price = base_price * mandi_bias
                # Seasonality
                seasonality = 1.0 + 0.15 * np.cos((date.dayofyear / 365) * 2 * np.pi)
                # Trend
                trend = 1.0 + (date.toordinal() - start_date.toordinal()) / 2500
                
                price = base_price * seasonality * trend + np.random.normal(0, base_price * 0.05)
                arrivals = max(50, np.random.normal(800, 400))

                price_records.append({
                    "date": date.date(),
                    "mandi_id": mandi["id"],
                    "commodity_id": comm["id"],
                    "min_price": price * 0.85,
                    "modal_price": price,
                    "max_price": price * 1.15,
                    "arrivals": arrivals
                })

    # Saving with append
    df_comm.to_sql('commodities', conn, if_exists='append', index=False)
    df_mandi_db = df_mandi.rename(columns={'lat': 'latitude', 'lon': 'longitude'})
    df_mandi_db.to_sql('mandis', conn, if_exists='append', index=False)
    
    pd.DataFrame(price_records).to_sql('price_history', conn, if_exists='append', index=False)
    pd.DataFrame(weather_records).to_sql('weather_data', conn, if_exists='append', index=False)
    pd.DataFrame(ndvi_records).to_sql('ndvi_index', conn, if_exists='append', index=False)

    # 5. Alerts
    alerts = [
        {"title": "MSP Increase Announced", "content": "Central government announced 5% increase in Paddy MSP for current season.", "category": "policy", "severity": "info"},
        {"title": "Heavy Rainfall Alert", "content": "IMD predicts heavy rainfall in Telangana districts for next 48 hours.", "category": "weather", "severity": "warning"},
        {"title": "Market Surge: Cotton", "content": "Cotton prices hit 3-year high in Warangal mandi due to export demand.", "category": "market", "severity": "info"},
        {"title": "Pest Advisory: Maize", "content": "Reports of Fall Armyworm in Nizamabad. Farmers advised to use recommended bio-pesticides.", "category": "weather", "severity": "warning"},
        {"title": "New Warehouse Opening", "content": "Government opens 5000MT cold storage facility in Guntur.", "category": "market", "severity": "info"}
    ]
    df_alerts = pd.DataFrame(alerts)
    df_alerts['date'] = datetime.now().date()
    df_alerts.to_sql('alerts', conn, if_exists='append', index=False)

    # 6. Schemes
    schemes = [
        {"title": "PM-Kisan Samman Nidhi", "description": "Income support to all landholding farmer families.", "benefit_amount": "₹6,000 / year", "eligibility_criteria": "All landholding farmers", "state": "Central", "link": "https://pmkisan.gov.in/"},
        {"title": "Rythu Bandhu", "description": "Investment support for agriculture and horticulture crops.", "benefit_amount": "₹5,000 / acre / season", "eligibility_criteria": "Farmers in Telangana", "state": "Telangana", "link": "https://rythubandhu.telangana.gov.in/"},
        {"title": "YSR Rythu Bharosa", "description": "Financial assistance to farmers including tenant farmers.", "benefit_amount": "₹13,500 / year", "eligibility_criteria": "Farmers in Andhra Pradesh", "state": "Andhra Pradesh", "link": "https://ysrrythubharosa.ap.gov.in/"},
        {"title": "Pradhan Mantri Fasal Bima Yojana (PMFBY)", "description": "Crop insurance scheme for farmers against natural calamities.", "benefit_amount": "Yield-based compensation", "eligibility_criteria": "All farmers", "state": "Central", "link": "https://pmfby.gov.in/"}
    ]
    pd.DataFrame(schemes).to_sql('schemes', conn, if_exists='append', index=False)

    # 7. Cold Storage
    storage_types = ["Chill (0-4°C)", "Dry (Ambient)", "Frozen (-18°C)"]
    storage_facilities = []
    for mandi in mandis:
        for i in range(1, 3):
            storage_facilities.append({
                "name": f"{mandi['name']} Facility {i}",
                "mandi_id": mandi["id"],
                "storage_type": random.choice(storage_types),
                "capacity_mt": 1000,
                "available_mt": random.randint(100, 800),
                "price_per_qtl_month": random.randint(40, 60),
                "latitude": mandi["lat"] + random.uniform(-0.05, 0.05),
                "longitude": mandi["lon"] + random.uniform(-0.05, 0.05)
            })
    pd.DataFrame(storage_facilities).to_sql('cold_storage', conn, if_exists='append', index=False)

    conn.close()
    print(f"Success: Generated {len(mandis)} mandis and {len(commodities)} commodity types with full history.")

if __name__ == "__main__":
    generate_mock_data()
