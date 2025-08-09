from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import uuid
import datetime

app = Flask(__name__)
CORS(app)

# Configure SQLite DB
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///fishbones.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Model
class FishboneDiagram(db.Model):
    id = db.Column(db.String(36), primary_key=True)  # UUID string
    name = db.Column(db.String(100), nullable=False)
    json_data = db.Column(db.Text, nullable=False)   # Store JSON string
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'jsonData': self.json_data,
            'createdAt': self.created_at.isoformat()
        }

# Initialize DB (run once)
@app.before_request
def create_tables():
    db.create_all()

# Routes

@app.route('/api/fishbones', methods=['GET'])
def list_diagrams():
    diagrams = FishboneDiagram.query.all()
    result = [{'id': d.id, 'name': d.name} for d in diagrams]
    return jsonify(result), 200

@app.route('/api/fishbones/<diagram_id>', methods=['GET'])
def get_diagram(diagram_id):
    diagram = FishboneDiagram.query.get(diagram_id)
    if not diagram:
        return jsonify({'error': 'Diagram not found'}), 404
    return jsonify(diagram.to_dict()), 200

@app.route('/api/fishbones', methods=['POST'])
def create_diagram():
    data = request.get_json()
    if not data or 'name' not in data or 'jsonData' not in data:
        return jsonify({'error': 'Missing name or jsonData'}), 400

    new_id = str(uuid.uuid4())
    new_diagram = FishboneDiagram(
        id=new_id,
        name=data['name'],
        json_data=data['jsonData']
    )
    db.session.add(new_diagram)
    db.session.commit()

    return jsonify({'id': new_id}), 201

@app.route('/api/fishbones/<diagram_id>', methods=['PUT'])
def update_diagram(diagram_id):
    diagram = FishboneDiagram.query.get(diagram_id)
    if not diagram:
        return jsonify({'error': 'Diagram not found'}), 404

    data = request.get_json()
    if not data or 'jsonData' not in data:
        return jsonify({'error': 'Missing jsonData'}), 400

    diagram.json_data = data['jsonData']
    diagram.name = data.get('name', diagram.name)
    db.session.commit()

    return jsonify({'message': 'Diagram updated'}), 200

@app.route('/api/fishbones/<diagram_id>', methods=['DELETE'])
def delete_diagram(diagram_id):
    diagram = FishboneDiagram.query.get(diagram_id)
    if not diagram:
        return jsonify({'error': 'Diagram not found'}), 404

    db.session.delete(diagram)
    db.session.commit()

    return jsonify({'message': 'Diagram deleted'}), 200

if __name__ == '__main__':
    app.run(debug=True)
