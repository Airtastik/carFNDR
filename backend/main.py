from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import time
from twelvelabs import TwelveLabs
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Twelve Labs
client = TwelveLabs(api_key=os.getenv("TWELVE_KEY"))

@app.route('/api/search', methods=['POST'])
def search_media():
    # 1. Get Data from React
    search_mode = request.form.get('searchMode')
    file = request.files.get('media')
    
    # 2. Logic to determine the prompt (Advanced vs Simple)
    if search_mode == 'advanced':
        # If user typed in the textarea, use that exactly
        user_prompt = request.form.get('advancedQuery')
        search_query = user_prompt 
    else:
        # If simple, build the string from dropdowns
        make = request.form.get('make', 'unknown')
        model = request.form.get('model', 'unknown')
        color = request.form.get('color', 'unknown')
        user_prompt = f"Analyze the video completely. Is there a {color} {make} {model}?"
        search_query = f"a {color} {make} {model}"

    if not file:
        return jsonify({"status": "error", "message": "No file uploaded"}), 400

    # Save file temporarily
    temp_path = os.path.join(os.getcwd(), file.filename)
    file.save(temp_path)

    try:
        # 3. Create Index (Using BOTH Pegasus for text and Marengo for screenshots)
        index = client.indexes.create(
            index_name=f"index_{int(time.time())}",
            models=[
                {"model_name": "pegasus1.2", "model_options": ["visual", "audio"]},
                {"model_name": "marengo2.7", "model_options": ["visual", "audio"]}
            ]
        )

        # 4. Upload and Index (Your main.py logic)
        with open(temp_path, "rb") as video_file:
            asset = client.assets.create(method="direct", file=video_file)

        indexed_asset = client.indexes.indexed_assets.create(
            index_id=index.id,
            asset_id=asset.id
        )

        # 5. Wait for indexing (Poll status)
        print("Waiting for indexing to complete...")
        while True:
            indexed_asset = client.indexes.indexed_assets.retrieve(index.id, indexed_asset.id)
            print(f"  Status={indexed_asset.status}")
            if indexed_asset.status == "ready":
                break
            elif indexed_asset.status == "failed":
                raise Exception("Twelve Labs Indexing failed")
            time.sleep(5)

        # 6. Perform Analysis (Pegasus)
        print(f"Analyzing with prompt: {user_prompt}")
        text_stream = client.analyze_stream(
            video_id=indexed_asset.id,
            prompt=user_prompt
        )

        full_response = ""
        for text in text_stream:
            if text.event_type == "text_generation":
                full_response += text.text

        # 7. Get the Screenshot (Marengo Search)
        search_results = client.search.query(
            index_id=index.id,
            query_text=search_query,
            search_options=["visual"] 
        )

        screenshot_url = None
        # Use .data to access the results in the SyncPager
        if search_results.data and len(search_results.data) > 0:
            screenshot_url = search_results.data[0].thumbnail_url

        # Cleanup
        os.remove(temp_path)

        return jsonify({
            "status": "success",
            "analysis": full_response,
            "screenshot": screenshot_url 
        })

    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        print(f"Error: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=8000)