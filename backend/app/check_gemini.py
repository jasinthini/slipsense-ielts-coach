import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import errors


def main():
    env_path = Path(__file__).resolve().parent.parent / ".env"
    load_dotenv(env_path)

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        print("GEMINI_API_KEY is missing from backend/.env")
        return

    try:
        with genai.Client(api_key=api_key) as client:
            print("Available text-generation models:")

            for model in client.models.list():
                actions = model.supported_actions or []

                if "generateContent" in actions:
                    print(model.name)

    except errors.APIError as error:
        print(f"Google API error code: {error.code}")
        print("Check your API key and project settings.")
    except Exception as error:
        print(f"Connection check failed: {type(error).__name__}")
        print("Check your internet connection and try again.")


if __name__ == "__main__":
    main()