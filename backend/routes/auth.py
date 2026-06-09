import re
import uuid
import bcrypt
import jwt
import datetime
from functools import wraps
from flask import Blueprint, request, jsonify, current_app
from models import db, User

auth = Blueprint('auth', __name__)

def token_required(func):
    @wraps(func)
    def decorated(*args, **kwargs):
        token = request.args.get('token')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 403
        try:
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        except:
            return jsonify({'message': 'Invalid token!'}), 403
    return decorated

@auth.route('/api/signup', methods=['POST'])
def signUp():
    data = request.get_json()
    if not data:
        return jsonify({"message": "Missing request body"}), 400

    name = data.get('name')
    userName = data.get("Username: ")
    userEmail = data.get("Email: ")
    passInput = data.get("Password: ")
    confirmPass = data.get("Confirm password: ")

    email_validate_pattern = r"^\S+@\S+\.\S+$"
    if not re.match(email_validate_pattern, userEmail):
        return jsonify({"message": "Invalid email format"}), 400

    if passInput != confirmPass:
            return jsonify({"message": "Passwords do not match."}), 400

    bytes = passInput.encode('utf-8')
    salt = bcrypt.gensalt()
    userPass = bcrypt.hashpw(bytes,salt)

    try:
        new_user = User(
            userId = uuid.uuid4()
            name=name
            userName=userName
            userEmail=userEmail
            userPass=userPass
        )
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"status": "success", "message": "User registered successfully!"}), 201
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Username or Email already exists."}), 400

@auth.route('/api/login', methods=['POST'])
def logIn():
    data = request.get_json()
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"message": "Missing credentials"}), 400

    user = User.query.filter_by(userName=data['username']).first()

    if user and bcrypt.checkpw(data['password'].encode('utf-8'), user.userPass):
        token = jwt.encode({
            'user_id': user.userId, 
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=2)
        }, current_app.config['SECRET_KEY'], algorithm="HS256")
        
        return jsonify({'token': token, 'status': 'success'})
    
    return jsonify({'message': 'Invalid credentials!'}), 401

@auth.route('/api/protected', methods=['GET'])
@token_required
def protected_route():
    return jsonify({'message': 'This data is protected. Your token is valid!'})