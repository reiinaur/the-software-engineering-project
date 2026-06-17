import datetime
import re
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import ForeignKey, String, Integer, Float, Boolean, DateTime, JSON
from sqlalchemy.orm import DeclarativeBase, mapped_column, validates

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# users table (used for auth)
class User(db.Model):
    __tablename__ = 'users'
    userId = mapped_column(String, primary_key=True, unique=True, nullable=False)
    name = mapped_column(String(50), nullable=False)
    userEmail = mapped_column(String, unique=True, nullable=False)
    userName = mapped_column(String, unique=True, nullable=False)
    userPass = mapped_column(String, nullable=False) 
    role = mapped_column(String, nullable=False, default="player") 
    authToken = mapped_column(String, unique=True, nullable=True, default=None) 
    createdAt = mapped_column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    @validates('userEmail')
    def validate_email(self, key, address):  
        if not re.match(r"^\S+@\S+\.\S+$", address):
            raise ValueError(f"Database write rejected: '{address}' is not a valid email format.")
        return address

    @validates('role')
    def validate_role(self, key, role_value):
        allowed_roles = ['player', 'admin']
        if role_value not in allowed_roles:
            raise ValueError(f"Database write rejected: Role must be one of {allowed_roles}.")
        return role_value

# playerStats table
class playerStats(db.Model):
    __tablename__ = 'playerStats'
    userId = mapped_column(String, ForeignKey('users.userId', ondelete='CASCADE'), primary_key=True, nullable=False)
    rankLevel = mapped_column(Integer, default=1, nullable=False) 
    xpTotal = mapped_column(Integer, default=0, nullable=False)
    coinBalance = mapped_column(Integer, default=0, nullable=False)
    finLevels = mapped_column(JSON, default=lambda: [], nullable=False)
    PBs = mapped_column(JSON, default=lambda: {}, nullable=False)
    
    @validates('rankLevel')
    def validate_rank(self, key, level):
        if not (1 <= level <= 5):
            raise ValueError(f"Database write rejected: rankLevel '{level}' must be between 1 and 5 inclusive.")
        return level

    @validates('xpTotal', 'coinBalance')
    def validate_positive_balances(self, key, amount):
        if amount < 0:
            raise ValueError(f"Database write rejected: '{key}' cannot be negative ({amount}).")
        return amount
    
    @validates('PBs')
    def validate_pbs_dictionary(self, key, pb_dict):
        if not isinstance(pb_dict, dict):
            raise ValueError("Database write rejected: PBs field must be an Object/Dictionary.")
        for level, wpm in pb_dict.items():
            if not str(level).isdigit():
                raise ValueError(f"Invalid PB Key: '{level}'. Level identifiers must be numeric strings.")
            if not isinstance(wpm, int) or wpm < 0:
                raise ValueError(f"Invalid PB Value for level {level}: '{wpm}'. WPM must be an integer >= 0.")
        return pb_dict

# scoreHistory table
class scoreHistory(db.Model):
    __tablename__ = 'scoreHistory'
    scoreId = mapped_column(String, primary_key=True, unique=True, nullable=False)
    userId = mapped_column(String, ForeignKey('users.userId', ondelete='CASCADE'), nullable=False)
    levelNumber = mapped_column(Integer, nullable=False)
    wpm = mapped_column(Integer, nullable=False)
    acc = mapped_column("acc%", Float, nullable=False)
    xpGain = mapped_column(Integer, nullable=False)
    deadlineMet = mapped_column(Boolean, nullable=False)
    isPB = mapped_column(Boolean, nullable=False)
    coinsEarned = mapped_column(Integer, nullable=False)
    sessionDate = mapped_column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    @validates('wpm', 'xpGain', 'coinsEarned', 'levelNumber')
    def validate_positive_game_metrics(self, key, val):
        if val < 0:
            raise ValueError(f"Database write rejected: Performance metric '{key}' cannot be negative ({val}).")
        return val

    @validates('acc')
    def validate_accuracy(self, key, percentage):
        if not (0.0 <= percentage <= 100.0):
            raise ValueError(f"Database write rejected: Accuracy percentage '{percentage}' must be between 0.00 and 100.00.")
        return percentage
    
# shopState table
class shopState(db.Model):
    __tablename__ = 'shopState'
    userId = mapped_column(String, ForeignKey('users.userId', ondelete='CASCADE'), primary_key=True, nullable=False)
    itemId = mapped_column(String, nullable=True) 
    itemCost = mapped_column(Integer, nullable=True, default=0) 
    accessories = mapped_column(JSON, default=lambda: [], nullable=False)
    screenTheme = mapped_column(JSON, default=lambda: [], nullable=False)
    equippedAccessories = mapped_column(String, nullable=True, default=None)
    equippedScreenTheme = mapped_column(String, nullable=True, default=None)

    @validates('equippedAccessories')
    def validate_accessory(self, key, value):
        if value is not None and value != "none" and value not in self.accessories:
            raise ValueError(f"Equip rejected: '{value}' is not inside your owned accessories array.")
        return value

    @validates('equippedScreenTheme')
    def validate_screen_theme(self, key, value):
        if value is not None and value != "default" and value not in self.screenTheme:
            raise ValueError(f"Equip rejected: '{value}' is not inside your owned screenTheme array.")
        return value
    
# vocabData table
class vocabData(db.Model):
    __tablename__ = 'vocabData'
    topicName = mapped_column(db.String(50), primary_key=True, unique=True, nullable=False)
    words = mapped_column(db.JSON, default=lambda: [], nullable=False)
    definitions = mapped_column(db.JSON, default=lambda: [], nullable=False)

    @validates('words', 'definitions')
    def check_arrays(self, key, array_val):
        if not isinstance(array_val, list):
            raise ValueError(f"Database write rejected: '{key}' must be a formal array format list.")
        return array_val

    def validate_vocab_lengths(self):
        if len(self.words) != len(self.definitions):
            raise ValueError(
                f"Sync failed: The words array length ({len(self.words)}) "
                f"must perfectly match definitions array length ({len(self.definitions)})."
            )