# filepath: d:\Source\projeto-dilmar-soares\api\app.py
from app import create_app
from flask import jsonify, current_app
from flask_cors import CORS

app = create_app()
# Permite todas as origens para qualquer rota
CORS(app, resources={r"/*": {"origins": "*"}}, automatic_options=True)

@app.route("/routes")
def list_routes():
    routes = []
    for rule in current_app.url_map.iter_rules():
        routes.append({
            'route': rule.rule,
            'methods': list(rule.methods)
        })
    return jsonify(routes)

if __name__ == '__main__':
    app.run(debug=True)


