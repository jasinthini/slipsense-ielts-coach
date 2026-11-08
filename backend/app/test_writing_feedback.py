import json

from groq import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AuthenticationError,
    RateLimitError,
)

from app.services.writing_feedback import generate_writing_feedback


def main():
    print("1. Feedback test started.", flush=True)
    print("2. Sending request to Groq...", flush=True)

    try:
        feedback = generate_writing_feedback(
            question=(
                "Schools should teach practical life skills "
                "alongside academic subjects. "
                "To what extent do you agree or disagree?"
            ),
            answer=(
                "I agrees that schools should teach life skills. "
                "Students needs to learn how to manage money. "
                "This knowledge help them in daily life. "
                "However, academic subjects is also important."
            ),
            task="task2",
            category="opinion",
            include_tamil=True,
        )

        print("3. Feedback received!", flush=True)
        print(json.dumps(
            feedback,
            ensure_ascii=False,
            indent=2,
        ))

    except AuthenticationError:
        print("API key is invalid. Check GROQ_API_KEY in .env.")

    except RateLimitError:
        print("Groq usage limit reached. Wait and try again.")

    except APITimeoutError:
        print("The request timed out. Please try again.")

    except APIConnectionError:
        print("Cannot connect to Groq. Check your internet.")

    except APIStatusError as error:
        print(f"Groq API error: HTTP {error.status_code}")
        print("Check your model name and Groq account limits.")

    except (ValueError, RuntimeError) as error:
        print(str(error))

    except Exception as error:
        print(f"Test failed: {type(error).__name__}")


if __name__ == "__main__":
    main()