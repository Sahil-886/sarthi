import asyncio
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv

load_dotenv()

async def main():
    try:
        client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"), max_retries=1)
        print("Generating a test completion...")
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=10
        )
        print("Success! Response:", response.choices[0].message.content)
    except Exception as e:
        print(f"Generation Error: {type(e).__name__}: {str(e)}")

asyncio.run(main())
