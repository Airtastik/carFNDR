import time
from twelvelabs import TwelveLabs
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")


# 1. Initialize the client
client = TwelveLabs(api_key=os.getenv("TWELVE_KEY"))

# 2. Create an index
# An index is a container for organizing your video content
index_name = f"index_{int(time.time())}"  # This will create a unique name using the current timestamp

# 2. Create an index
index = client.indexes.create(
    index_name=index_name,
    models=[{"model_name": "pegasus1.2", "model_options": ["visual", "audio"]}]
)

if not index.id:
    raise RuntimeError("Failed to create an index.")
print(f"Created index: id={index.id}")

# 3. Upload file
asset = client.assets.create(
    method="direct",
    file=open("./videos/i.mp4", "rb") # Use direct links to raw media files. Video hosting platforms and cloud storage sharing links are not supported

    # Or use method="direct" and file=open("<PATH_TO_VIDEO_FILE>", "rb") to upload a file from the local file system
)
print(f"Created asset: id={asset.id}")

# 4. Add your asset to an index
indexed_asset = client.indexes.indexed_assets.create(
    index_id=index.id,
    asset_id=asset.id,
    # enable_video_stream=True
)
print(f"Created indexed asset: id={indexed_asset.id}")

# 5. Monitor the indexing process
print("Waiting for indexing to complete.")
while True:
    indexed_asset = client.indexes.indexed_assets.retrieve(
        index_id=index.id,
        indexed_asset_id=indexed_asset.id
    )
    print(f"  Status={indexed_asset.status}")

    if indexed_asset.status == "ready":
        print("Indexing complete!")
        break
    elif indexed_asset.status == "failed":
        raise RuntimeError("Indexing failed")

    time.sleep(5)

# 6. Perform open-ended analysis
make = "Audi"
model = "A5"
color = "gray"
text_stream = client.analyze_stream(
    video_id=indexed_asset.id,
    # prompt=f"Can you identify the vehicle in the video? Is it a {color} {make} {model}?"
    prompt=f"Analyze the video completely. Is there a {color} {make} {model}?"
    # temperature=0.2,
    # max_tokens=1024,
    # You can also use `response_format` to request structured JSON responses
)

# 7. Process the results
full_response = ""
for text in text_stream:
    if text.event_type == "text_generation":
        full_response += text.text   # Add a space to avoid jumbled words

print(f"Full Response: {full_response}")