import os
from flask import Flask
from flask_cors import CORS
from models import db
from dotenv import load_dotenv

from routes.auth import auth
from routes.stats import statsBP
from routes.shop import shop
from routes.vocab import vocab
from routes.levels import levels 

load_dotenv()

def create_app():
    app = Flask(__name__) # creates app instance
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

    db.init_app(app)
    app.register_blueprint(auth)
    app.register_blueprint(statsBP)
    app.register_blueprint(shop)
    app.register_blueprint(vocab)
    app.register_blueprint(levels)

    with app.app_context():
        db.create_all()
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)