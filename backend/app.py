from flask import Flask, jsonify, request, make_response, render_template, session
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask_cors import CORS

app = Flask(__name__) # creates app instance
app.config['SECRET_KEY'] = '2ad217c0eaca4d6d8a2634ac15eda526'
cors = CORS(app, origins="*") # allows cross-origin requests to /api/*

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

# for public
@app.route('/public')
def public():
    return 'Anyone can view this!'

# authenticated
@app.route('/auth')
@token_required
def auth():
    return 'This is only available for people with valid tokens.'

#for login
@app.route('/login', methods=['POST'])
def login():
    if request.form['username'] == 'admin' and request.form['password'] == 'pass123':
        session['logged_in'] = True
        token = jwt.encode({
            'user': request.form['username'], 
            'exp': datetime.utcnow() + timedelta(seconds=120)
            }, 
            app.config['SECRET_KEY'])
        return jsonify({'token': token})
    else:
        return make_response('Unable to verify', 403, {'WWW-Authenticate': 'Basic realm:"Authentication failed!"'})


@app.route('/api/users', methods=['GET'])
def get_data():
    return jsonify(
        {
            "users": [
                "john doe",
                "yo gurt"
            ]
        }
    )

if __name__ == "__main__":
    app.run(debug=True, port=5000)