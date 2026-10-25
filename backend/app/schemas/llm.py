from pydantic import BaseModel


class TokenUsage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

    def add(
        self,
        other: "TokenUsage",
    ) -> None:
        self.prompt_tokens += (
            other.prompt_tokens
        )

        self.completion_tokens += (
            other.completion_tokens
        )

        self.total_tokens += (
            other.total_tokens
        )

