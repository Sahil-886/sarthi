import requests
import os
from dotenv import load_dotenv

load_dotenv()
key = os.environ.get("OPENAI_API_KEY")

headers = {
    "Authorization": f"Bearer {key}",
}

print("Checking OpenAI API Key status...")
# We use the models endpoint because it is the cheapest/easiest raw test
response = requests.get("https://api.openai.com/v1/models", headers=headers)

print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    print("SUCCESS: The API key is valid and has active quotas.")
else:
    print("FAILED:", response.json())

