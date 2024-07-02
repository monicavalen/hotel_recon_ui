from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from bson import ObjectId
from flask import Flask, jsonify, request
from flask_cors import CORS
from config import MONGODB_CONNECTION_STRING, DATABASE_FUZZY, COLLECTION_FUZZY_OUTPUT, COLLECTION_GST_INPUT_2B, DATABASE_GST,AWS_ACCESS_KEY, AWS_SECRET_KEY, REGION_NAME, BUCKET_NAME, SELECTED_COLUMN
import json
from datetime import datetime
import boto3
from botocore.exceptions import NoCredentialsError

app = Flask(__name__)
CORS(app)

aws_access_key_id = AWS_ACCESS_KEY
aws_secret_access_key = AWS_SECRET_KEY
region_name = REGION_NAME
s3_client = boto3.client(
    's3',
    aws_access_key_id=aws_access_key_id,
    aws_secret_access_key=aws_secret_access_key,
    region_name=region_name
)
bucket_name = BUCKET_NAME

connection_string = MONGODB_CONNECTION_STRING
client = MongoClient(connection_string)
db_name = DATABASE_FUZZY
matches_collection_name = COLLECTION_FUZZY_OUTPUT
selected_column_collection_name = SELECTED_COLUMN

twoB_database_name = DATABASE_GST
twoB_collection_name = COLLECTION_GST_INPUT_2B

def default(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, float) and (obj != obj or obj == float('inf') or obj == float('-inf')):
        return None
    elif isinstance(obj, datetime):
        return obj.isoformat()  # Serialize datetime to ISO 8601 format
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

def convert_object_ids(data):
    if isinstance(data, list):
        return [convert_object_ids(item) for item in data]
    elif isinstance(data, dict):
        return {key: convert_object_ids(value) for key, value in data.items()}
    elif isinstance(data, ObjectId):
        return str(data)
    elif isinstance(data, float) and (data != data or data == float('inf') or data == float('-inf')):
        return None  # Convert NaN and Infinity to None
    elif isinstance(data, (int, str)):
        return data
    elif isinstance(data, datetime):
        return data.isoformat()  # Convert datetime to ISO 8601 format
    elif data is None:
        return None
    else:
        try:
            json.dumps(data, default=default)  # Try to serialize using json.dumps with custom default function
            return data
        except Exception as e:
            print(f"Failed to serialize: {data}, Error: {e}")
            return str(data)  # Return as string if serialization fails

@app.route('/matches', methods=['GET'])
def fetch_new_data():
    try:
        db = client[db_name]
        new_collection = db[matches_collection_name]
        print("MongoDB connection: Successful")
        new_data = list(new_collection.find())
        print(len(new_data))
        print(f"Data from second collection:")
        for i in new_data:
            print("--------------------------------------------------------------------------------------------------------------------",i['booking_data']['original_filename'])
            file_name = f"test/{i['booking_data']['original_filename']}"
            print(file_name)
            if not file_name:
                return jsonify({'error': 'File name is required'}), 400
            try:
                signed_url = s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': bucket_name, 'Key': file_name},
                    ExpiresIn=3600  # URL expiration time in seconds
                )
                print(f"im after creating signedurl:",signed_url)
                i['url'] = signed_url
            except NoCredentialsError:
                return jsonify({'error': 'Credentials not available'}), 500
            except Exception as e:
                return jsonify({'error': str(e)}), 500
        # print(new_data)
        return json.dumps(new_data, default=default), 200
    except ConnectionFailure:
        print("MongoDB connection: Failed")
        return "error"


@app.route('/2bData', methods=['GET'])
def fetch_2b_data():
    try:
        db = client[twoB_database_name]
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
