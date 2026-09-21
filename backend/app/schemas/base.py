"""The response-model base: snake_case in Python, camelCase on the wire.

`frontend/types/api.ts` says `avatarUrl` and `createdAt`; Python says
`avatar_url` and `created_at`. Rather than rename anything by hand, every
response schema inherits this and pydantic does the translation.
"""

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        # avatar_url -> avatarUrl on the way out
        alias_generator=to_camel,
        # ...but still accept snake_case when constructing in Python
        populate_by_name=True,
        # let model_validate() read attributes off a SQLAlchemy row
        from_attributes=True,
    )
