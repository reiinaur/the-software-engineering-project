import os
import click
from flask import Flask, jsonify
from flask_cors import CORS
from models import db

from routes.auth import auth
from routes.stats import stats
from routes.shop import shop
from routes.vocab import vocab

def create_app():
    app = Flask(__name__) # creates app instance
    app.config['SECRET_KEY'] = '2ad217c0eaca4d6d8a2634ac15eda526'
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)
    app.register_blueprint(auth)
    app.register_blueprint(stats)
    app.register_blueprint(shop)
    app.register_blueprint(vocab)
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)