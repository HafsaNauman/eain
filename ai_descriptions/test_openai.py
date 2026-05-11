import openai
import sys
try:
    openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "hello"}]
    )
except Exception as e:
    print(f"ERROR_STR: '{str(e)}'")
    print(f"ERROR_TYPE: {type(e).__name__}")
