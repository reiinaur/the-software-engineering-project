import os
from flask import Flask
from flask_cors import CORS
from models import db
from dotenv import load_dotenv

from backend.routes.auth import auth
from backend.routes.stats import statsBP
from backend.routes.shop import shop
from backend.routes.vocab import vocab
from backend.routes.levels import levels 

load_dotenv()

def create_app():
    app = Flask(__name__) # creates app instance
    # pulls secret key from the environment so it's never hardcoded in source
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    # allow all origins on /api/* routes; credentials (auth headers) are supported
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # bind the db extension to this app instance
    db.init_app(app)

    # register each feature blueprint so its routes are available on the app
    app.register_blueprint(auth)
    app.register_blueprint(statsBP)
    app.register_blueprint(shop)
    app.register_blueprint(vocab)
    app.register_blueprint(levels)

    # create all tables on startup if they don't already exist
    with app.app_context():
        db.create_all()
    
    return app

app = create_app()

if __name__ == "__main__":
    app.run()