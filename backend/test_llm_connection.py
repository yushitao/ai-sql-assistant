from app.core.config import settings
from app.services.llm_client import get_llm_client


client = get_llm_client()

response =client.chat.completions.create(
    model=settings.llm_model,
    messages=[
        {
            "role": "user",
            "content": "只回复：连接成功",
        }
    ],
    temperature=0,
    max_tokens=200,
)
print(response.choices[0].message.content)


