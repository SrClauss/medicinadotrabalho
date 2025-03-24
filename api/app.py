from app import create_app
from flask import jsonify, current_app, send_from_directory
from flask_cors import CORS
import os

app = create_app()
CORS(app, resources={r"/*": {"origins": "*"}}, automatic_options=True)
app.static_folder = 'static'

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

# Rota para arquivos estáticos específicos
@app.route('/<path:path>')
def serve_static(path):
    # Primeiro verifica se o arquivo existe
    file_path = os.path.join(app.static_folder, path)
    if os.path.isfile(file_path):
        return send_from_directory(app.static_folder, path)
    else:
        # Se não existir, retorna o index.html para o React Router lidar
        return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    # Captura qualquer erro 404 e redireciona para o React
    return send_from_directory(app.static_folder, 'index.html')

@app.route("/routes")
def list_routes():
    print(current_app.config['FRONTEND_URL'])
    routes = []
    for rule in current_app.url_map.iter_rules():
        routes.append({
            'route': rule.rule,
            'methods': list(rule.methods)
        })
    return jsonify(routes)

if __name__ == '__main__':
    app.run(debug=True)
