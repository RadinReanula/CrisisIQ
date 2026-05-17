"""Generate public/favicon-32.png — static crimson globe snapshot."""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

SIZE = 32
CX, CY, R = 16, 15, 13
OUT = Path(__file__).resolve().parent.parent / "public" / "favicon-32.png"


def png_chunk(tag: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)


def main() -> None:
    rows = []
    for y in range(SIZE):
        row = bytearray([0])  # filter byte
        for x in range(SIZE):
            dx, dy = x - CX, y - CY
            dist = (dx * dx + dy * dy) ** 0.5
            if dist <= R:
                t = max(0.0, min(1.0, 1.0 - dist / R))
                row.extend(
                    [
                        int(139 + (255 - 139) * t * 0.35),
                        int(0 + 32 * t * 0.2),
                        int(0 + 32 * t * 0.2),
                        255,
                    ]
                )
            else:
                row.extend([0, 0, 0, 0])
        rows.append(bytes(row))

    raw = b"".join(rows)
    compressed = zlib.compress(raw, 9)

    ihdr = struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", ihdr)
        + png_chunk(b"IDAT", compressed)
        + png_chunk(b"IEND", b"")
    )
    OUT.write_bytes(png)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
