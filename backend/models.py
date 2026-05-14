from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
import datetime

Base = declarative_base()

class Commodity(Base):
    __tablename__ = "commodities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    variety = Column(String)
    category = Column(String)
    msp = Column(Float)
    unit = Column(String, default="quintal")

class Mandi(Base):
    __tablename__ = "mandis"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    state = Column(String)
    district = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)

class PriceHistory(Base):
    __tablename__ = "price_history"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    mandi_id = Column(Integer, ForeignKey("mandis.id"))
    commodity_id = Column(Integer, ForeignKey("commodities.id"))
    min_price = Column(Float)
    modal_price = Column(Float)
    max_price = Column(Float)
    arrivals = Column(Float)

    mandi = relationship("Mandi")
    commodity = relationship("Commodity")

class WeatherData(Base):
    __tablename__ = "weather_data"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    mandi_id = Column(Integer, ForeignKey("mandis.id"))
    rainfall = Column(Float)
    temperature = Column(Float)

    mandi = relationship("Mandi")

class NDVIIndex(Base):
    __tablename__ = "ndvi_index"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    mandi_id = Column(Integer, ForeignKey("mandis.id"))
    ndvi = Column(Float)

    mandi = relationship("Mandi")

class Forecast(Base):
    __tablename__ = "forecasts"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    mandi_id = Column(Integer, ForeignKey("mandis.id"))
    commodity_id = Column(Integer, ForeignKey("commodities.id"))
    predicted_price = Column(Float)
    lower_ci = Column(Float)
    upper_ci = Column(Float)

    mandi = relationship("Mandi")
    commodity = relationship("Commodity")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

class Scheme(Base):
    __tablename__ = "schemes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    benefit_amount = Column(String)
    eligibility_criteria = Column(String)
    state = Column(String) # 'Telangana', 'Andhra Pradesh', or 'Central'
    link = Column(String)

class ColdStorage(Base):
    __tablename__ = "cold_storage"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    mandi_id = Column(Integer, ForeignKey("mandis.id"))
    storage_type = Column(String, default="Cold Storage") # 'Chill', 'Dry', 'Frozen'
    capacity_mt = Column(Float)
    available_mt = Column(Float)
    price_per_qtl_month = Column(Float)
    latitude = Column(Float)
    longitude = Column(Float)

    mandi = relationship("Mandi")

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    storage_id = Column(Integer, ForeignKey("cold_storage.id"))
    commodity_id = Column(Integer, ForeignKey("commodities.id"))
    quantity_qtl = Column(Float)
    duration_months = Column(Integer, default=1)
    booking_date = Column(Date, default=datetime.date.today)
    status = Column(String, default="Confirmed")

    user = relationship("User")
    storage = relationship("ColdStorage")
    commodity = relationship("Commodity")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True, default=datetime.date.today)
    title = Column(String)
    content = Column(String)
    category = Column(String) # 'market', 'weather', 'policy'
    severity = Column(String) # 'info', 'warning', 'critical'
