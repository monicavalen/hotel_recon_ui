from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from bson import ObjectId
from flask import Flask, jsonify, request
from flask_cors import CORS
# from config import MONGODB_CONNECTION_STRING, DATABASE_FUZZY, COLLECTION_FUZZY_OUTPUT, COLLECTION_GST_INPUT_2B, DATABASE_GST
import json

app = Flask(__name__)
CORS(app)

connection_string = "mongodb+srv://Monica_Valentina_M:Monica_Valentina_M@monica.p3vuhne.mongodb.net/?retryWrites=true&w=majority&appName=monica"
client = MongoClient(connection_string)
db_name = 'hotel_recon'
matches_collection_name = 'sap_june_2024'
selected_column_collection_name = "selectedColumn"

# twoB_database_name = DATABASE_GST
twoB_collection_name = '2b2'

def default(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

def convert_object_ids(data):
    if isinstance(data, list):
        return [convert_object_ids(item) for item in data]
    elif isinstance(data, dict):
        return {key: convert_object_ids(value) for key, value in data.items()}
    elif isinstance(data, ObjectId):
        return str(data)
    else:
        return data

@app.route('/matches', methods=['GET'])
def fetch_new_data():
    try:
        db = client[db_name]
        new_collection = db[matches_collection_name]
        print("MongoDB connection: Successful")
        new_data = list(new_collection.find())
        print("Data from matches collection:")
        converted_data = convert_object_ids(new_data)
        return jsonify(converted_data), 200
    except ConnectionFailure:
        print("MongoDB connection: Failed")
        return jsonify({"error": "MongoDB connection failed"}), 500
    except Exception as e:
        print("An error occurred:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/2bData', methods=['GET'])
def fetch_2b_data():
    try:
        db = client[db_name]
        new_collection = db[twoB_collection_name]
        print("MongoDB connection for two b: Successful")
        new_data = list(new_collection.find().limit(20))
        print("Data from 2B collection:")
        converted_data = convert_object_ids(new_data)
        return jsonify(converted_data), 200
    except ConnectionFailure:
        print("MongoDB connection: Failed")
        return jsonify({"error": "MongoDB connection failed"}), 500
    except Exception as e:
        print("An error occurred:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/saveSelectedColumn', methods=['POST'])
def save_selected_column():
    try:
        db = client[db_name]
        matches_collection = db[matches_collection_name]
        selected_data = request.json
        
        document_id = request.args.get('documentId')
        print(f"Received document_id: {document_id}")

        if not document_id:
            return jsonify({'error': 'Document ID is required'}), 400

        try:
            document_object_id = ObjectId(document_id)
        except Exception as e:
            return jsonify({'error': 'Invalid document ID format', 'details': str(e)}), 400

        print(f"Updating document with ID: {document_id}")
        result = matches_collection.update_one(
            {'_id': document_object_id},
            {'$set': {'selected': selected_data}}
        )

        if result.matched_count == 0:
            return jsonify({'error': 'Document not found'}), 404

        if result.modified_count == 0:
            return jsonify({'warning': 'Document found but no modification was made'}), 200

        print(f"Document updated successfully with selected data: {selected_data}")
        return jsonify({'message': 'Data saved successfully'}), 200
    except ConnectionFailure:
        print("MongoDB connection: Failed")
        return jsonify({'error': 'Failed to save data'}), 500
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/saveRemarks', methods=['POST'])
def save_remarks():
    try:
        db = client[db_name]
        matches_collection = db[matches_collection_name]
        remarks_data = str(request.json.get('remarks', ''))
        
        document_id = request.args.get('documentId')
        print(f"Received document_id: {document_id}")

        if not document_id:
            return jsonify({'error': 'Document ID is required'}), 400

        try:
            document_object_id = ObjectId(document_id)
        except Exception as e:
            return jsonify({'error': 'Invalid document ID format', 'details': str(e)}), 400

        print(f"Updating document with ID: {document_id}")
        result = matches_collection.update_one(
            {'_id': document_object_id},
            {'$set': {'remarks': remarks_data}}
        )

        if result.matched_count == 0:
            return jsonify({'error': 'Document not found'}), 404

        if result.modified_count == 0:
            return jsonify({'warning': 'Document found but no modification was made'}), 200

        print(f"Document updated successfully with remarks data: {remarks_data}")
        return jsonify({'message': 'Remarks saved successfully'}), 200
    except ConnectionFailure:
        print("MongoDB connection: Failed")
        return jsonify({'error': 'Failed to save remarks data'}), 500
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/selected', methods=['GET'])
def fetch_selected_data():
    try:
        db = client[db_name]
        new_collection = db[selected_column_collection_name]
        print("MongoDB connection: Successful")
        new_data = list(new_collection.find())
        # print("Data from selected collection:")
        converted_data = convert_object_ids(new_data)
        return jsonify(converted_data), 200
    except ConnectionFailure:
        print("MongoDB connection: Failed")
        return jsonify({"error": "MongoDB connection failed"}), 500
    except Exception as e:
        print("An error occurred:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)