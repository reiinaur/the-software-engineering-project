import os
from flask import Flask
from flask_cors import CORS
from api.backend.models import db
from dotenv import load_dotenv

from api.backend.routes.auth import auth
from api.backend.routes.stats import statsBP
from api.backend.routes.shop import shop
from api.backend.routes.vocab import vocab
from api.backend.routes.levels import levels 

load_dotenv()

app = Flask(__name__) # creates app instance
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

db.init_app(app)
app.register_blueprint(auth)
app.register_blueprint(statsBP)
app.register_blueprint(shop)
app.register_blueprint(vocab)
app.register_blueprint(levels)

with app.app_context():
    db.create_all()
    