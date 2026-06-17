import re
import uuid
import bcrypt
import jwt
import datetime
from functools import wraps
from flask import Blueprint, request, jsonify, current_app, g
from models import db, User, playerStats, shopState

auth = Blueprint('auth', __name__)

def token_required(func):
    @wraps(func)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.replace('Bearer ', '') if auth_header.startswith('Bearer ') else ''
        if not token:
            return jsonify({'message': 'Token is missing!'}), 403
        try:
            payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            g.user_id = payload['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired. Please log in again.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token!'}), 403
        return func(*args, **kwargs)
    return decorated

def admin_required(func):
    @wraps(func)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.replace('Bearer ', '') if auth_header.startswith('Bearer ') else ''
 
        if not token:
            return jsonify({'message': 'Token is missing!'}), 403
 
        try:
            payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            g.user_id = payload['user_id']
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return jsonify({'message': 'Invalid or expired token!'}), 403
 
        # fetch the user to check their role
        user = User.query.filter_by(userId=g.user_id).first()
        if not user or user.role != 'admin':
            return jsonify({'message': 'Admin access required.'}), 403
 
        return func(*args, **kwargs)
 
    return decorated
 
@auth.route('/api/auth/signup', methods=['POST'])
def signUp():
    data = request.get_json()
    if not data:
        return jsonify({"message": "Missing request body"}), 400
 
    name        = data.get('name', '').strip()
    userName    = data.get('username', '').strip()
    userEmail   = data.get('email', '').strip()
    passInput   = data.get('password', '')
    confirmPass = data.get('confirmPass', '')
 
    # may remove in future as models have their own validation
    if not all([name, userName, userEmail, passInput, confirmPass]):
        return jsonify({"message": "All fields are required."}), 400
 
    if not re.match(r"^\S+@\S+\.\S+$", userEmail):
        return jsonify({"message": "Invalid email format"}), 400
 
    if passInput != confirmPass:
        return jsonify({"message": "Passwords do not match."}), 400
 
    # hash & salt password
    hashed_bytes = bcrypt.hashpw(passInput.encode('utf-8'), bcrypt.gensalt())
    userPass = hashed_bytes.decode('utf-8')   
 
    user_id = str(uuid.uuid4())   
 
    try:
        # create user
        new_user = User(
            userId=user_id,
            name=name,
            userName=userName,
            userEmail=userEmail,
            userPass=userPass,
            role='player',
        )
        db.session.add(new_user)
 
        # create associated playerStats and shopState rows with default values
        new_stats = playerStats(userId=user_id)
        new_shop  = shopState(userId=user_id)
        db.session.add(new_stats)
        db.session.add(new_shop)
 
        db.session.commit()
        return jsonify({"status": "success", "message": "Account created successfully!"}), 201
 
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Username or email already exists."}), 400
 
 
@auth.route('/api/auth/login', methods=['POST'])
def logIn():
    data = request.get_json()
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"message": "Missing credentials"}), 400
 
    user = User.query.filter_by(userName=data['username']).first()
 
    if not user:
        return jsonify({"message": "No account found for that username."}), 404
 
    # bcrypt.checkpw hashes the input with the stored salt and compares by byte
    if not bcrypt.checkpw(data['password'].encode('utf-8'), user.userPass.encode('utf-8')):
        return jsonify({"message": "Incorrect password."}), 401
 
    # generate a fresh JWT on each login with a 24-hour expiration
    token = jwt.encode({
        'user_id': user.userId,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, current_app.config['SECRET_KEY'], algorithm="HS256")
 
    # save token to DB so we can invalidate it on logout if needed
    user.authToken = token
    db.session.commit()
 
    # Also return playerStats so the frontend doesn't need a separate request
    stats = playerStats.query.filter_by(userId=user.userId).first()
    inventory = shopState.query.filter_by(userId=user.userId).first()
 
    return jsonify({
        'token': token,
        'status': 'success',
        'userId': user.userId,
        'name': user.name,
        'role': user.role,
        'playerStats': {
            'rankLevel':   stats.rankLevel,
            'xpTotal':     stats.xpTotal,
            'coinBalance': stats.coinBalance,
            'finLevels':   stats.finLevels,
            'PBs':         stats.PBs,
        },
        'shopState': { 
            'owned': {
                'accessories': inventory.accessories if inventory else [],
                'screenTheme': inventory.screenTheme if inventory else []
            },
            'equipped': {
                'accessories': inventory.equippedAccessories if inventory else None,
                'screenTheme': inventory.equippedScreenTheme if inventory else None
            }
        },
    }), 200