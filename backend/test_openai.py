import asyncio
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv

load_dotenv()

async def main():
    try:
        client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"), max_retries=1)
        print("Connecting to OpenAI...")
        response = await client.models.list()
        print(f"Success! Found {len(response.data)} models.")
    except Exception as e:
        print(f"OpenAI Error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()

asyncio.run(main())
