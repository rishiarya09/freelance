from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient, ASCENDING, DESCENDING
import pandas as pd
import requests
from datetime import datetime
from bson.objectid import ObjectId
import io
from apscheduler.schedulers.background import BackgroundScheduler

app = Flask(__name__,static_folder='/course-management/dist/course-management/browser')
CORS(app)

# MongoDB setup
client = MongoClient('localhost', 27017)
db = client['mockaroo_db']
collection = db['data']

# Ensure the data expires in 10 minutes
collection.create_index([("createdAt", ASCENDING)], expireAfterSeconds=600)

# Function to fetch and normalize data
def fetch_and_normalize_data():
    url = 'https://api.mockaroo.com/api/501b2790?count=1000&key=8683a1c0'
    response = requests.get(url)
    data = response.text

    # Normalize data with pandas
    df = pd.read_csv(io.StringIO(data))
    normalized_data = df.to_dict('records')

    collection.delete_many({})

    # Insert data into MongoDB with timestamp
    timestamped_data = [{"createdAt": datetime.utcnow(), **item} for item in normalized_data]
    collection.insert_many(timestamped_data)
    return normalized_data

# Check if data has expired and fetch new data if necessary
def check_and_fetch_data():
    if collection.count_documents({}) == 0:
        return fetch_and_normalize_data()
    else:
        return list(collection.find({}, {'_id': False}))
    
# Schedule to run fetch_and_store_data every 10 minutes
scheduler = BackgroundScheduler()
scheduler.add_job(check_and_fetch_data, 'interval', minutes=10)
scheduler.start()

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/data', methods=['GET'])
def get_data():
    data = check_and_fetch_data()
    return jsonify(data)

@app.route('/courses', methods=['GET'])
def get_courses():
    query_params = request.args.to_dict()
    search_query = query_params.pop('search', '')
    search_filter = {}
    page = int(query_params.pop('page', 1))
    per_page = int(query_params.pop('per_page', 10))

    if search_query:
        search_filter = {
            "$or": [
                {key: {"$regex": search_query, "$options": "i"}} for key in collection.find_one().keys() if key not in ['_id', 'createdAt']
            ]
        }
    else:
        search_filter = {}

    total = collection.count_documents(search_filter)
    courses = list(collection.find(search_filter).sort('createdAt', DESCENDING).skip((page - 1) * per_page).limit(per_page))
    for course in courses:
        course['_id'] = str(course['_id'])

    return jsonify({
        'total': total,
        'page': page,
        'per_page': per_page,
        'courses': courses
    })

@app.route('/course/<course_id>', methods=['PUT'])
def update_course(course_id):
    try:
        update_data = request.json
        result = collection.update_one({'_id': ObjectId(course_id)}, {'$set': update_data})
        if result.matched_count == 0:
            return jsonify({'error': 'Course not found'}), 404
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/course/<course_id>', methods=['DELETE'])
def delete_course(course_id):
    try:
        result = collection.delete_one({'_id': ObjectId(course_id)})
        if result.deleted_count == 0:
            return jsonify({'error': 'Course not found'}), 404
        return jsonify({'message': 'Course has been succesfully deleted','success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/course', methods=['POST'])
def create_course():
    try:
        new_course = request.json
        new_course['createdAt'] = datetime.utcnow()
        result = collection.insert_one(new_course)
        return jsonify({'id': str(result.inserted_id)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/universities', methods=['GET'])
def get_universities():
    universities = collection.distinct('University')
    return jsonify(universities)

@app.route('/countries', methods=['GET'])
def get_countries():
    countries = collection.distinct('Country')
    return jsonify(countries)

@app.route('/cities', methods=['GET'])
def get_cities():
    cities = collection.distinct('City')
    return jsonify(cities)

@app.route('/currencies', methods=['GET'])
def get_currencies():
    currencies = collection.distinct('Currency')
    return jsonify(currencies)

if __name__ == '__main__':
    check_and_fetch_data()
    app.run(debug=True)