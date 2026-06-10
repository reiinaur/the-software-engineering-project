import os
import click
from flask import Flask, jsonify
from flask_cors import CORS
from models import db
from routes.auth import auth

def create_app():
    app = Flask(__name__) # creates app instance
    app.config['SECRET_KEY'] = '2ad217c0eaca4d6d8a2634ac15eda526'
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)
    app.register_blueprint(auth)
    @app.cli.add_command(click.Command('init-db', callback=lambda: db.create_all() or click.echo('Database created.')))

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

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)