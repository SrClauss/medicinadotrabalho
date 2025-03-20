# filepath: d:\Source\projeto-dilmar-soares\api\app.py
from app import create_app
from flask_cors import CORS

app = create_app()
# Permite todas as origens para qualquer rota
CORS(app, resources={r"/*": {"origins": "*"}}, automatic_options=True)

if __name__ == '__main__':
    app.run(debug=True)


    