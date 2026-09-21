"""Prefixed, time-sortable primary keys — `usr_01JB7QK3M8ZC4X9V2N6T0RYHFA`.

The frontend fixtures already use this shape (`usr_01HQ8Z`, `prj_vision`), and
these ids end up in URLs and logs, so they are built to be read by a human:

- the prefix says what the row is, so a stray id in a log line is never a mystery
- the first 10 characters are the millisecond timestamp, so ids sort by age
- the last 16 are random, so they cannot be guessed or counted

This is a ULID, written out rather than pulled in as a dependency: 128 bits,
48 of time and 80 of randomness, in Crockford base32 (no I, L, O or U, so it
survives being read aloud or written down).
"""

import secrets
import time

_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"


def _encode(value: int, length: int) -> str:
    """Render `value` as `length` base32 characters, most significant first."""
    out = [""] * length
    for i in range(length - 1, -1, -1):
        out[i] = _ALPHABET[value & 0b11111]
        value >>= 5
    return "".join(out)


def new_id(prefix: str) -> str:
    timestamp_ms = int(time.time() * 1000)
    return f"{prefix}_{_encode(timestamp_ms, 10)}{_encode(secrets.randbits(80), 16)}"
