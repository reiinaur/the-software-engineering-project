import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

# users table (used for auth)
db = SQLAlchemy(model_class=Base)
class User(db.Model):
    __tablename__ = 'users'
    userId = mapped_column(db.String, primary_key=True, unique=True, nullable=False)
    name = mapped_column(db.String(50), nullable=False)
    userEmail = mapped_column(db.String, unique=True, nullable=False)
    userName = mapped_column(db.String, unique=True, nullable=False)
    userPass = mapped_column(db.String, nullable=False)
    role = mapped_column(db.String, nullable=False)
    authToken = mapped_column(db.String, nullable=False)
    createdAt = mapped_column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)

# playerStats table
class playerStats(db.Model):
    __tablename__ = 'playerStats'
    rankLevel = mapped_column()
    xpTotal = mapped_column()
    coinBalance = mapped_column()
    finLevels = mapped_column()

