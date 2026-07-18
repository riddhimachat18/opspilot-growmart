"""
scripts/cli_test_client.py — a minimal terminal client to smoke-test the
backend WebSocket end-to-end before touching the frontend at all.

Connects to backend/main.py's /ws/chat endpoint, sends messages you type,
and prints streamed tokens and trace events as they arrive — so you can
verify the full pipeline (orchestrator -> agent -> tools -> streaming)
works before building any UI.

Run:
    1. In one terminal: uvicorn backend.main:app --reload --port 8000
    2. In another:       python scripts/cli_test_client.py

Requires:
    pip install websockets
"""

import asyncio
import json
import uuid
import websockets

WS_URL = "ws://localhost:8000/ws/chat"


async def run_cli():
    session_id = str(uuid.uuid4())
    user_id = "cli-tester"

    print(f"Connected session: {session_id}")
    print("Type a message and press Enter. Type 'exit' to quit.\n")

    async with websockets.connect(WS_URL) as ws:
        while True:
            user_input = input("You: ").strip()
            if user_input.lower() == "exit":
                break
            if not user_input:
                continue

            await ws.send(json.dumps({
                "message": user_input,
                "session_id": session_id,
                "user_id": user_id,
            }))

            print("\nAssistant: ", end="", flush=True)
            assistant_buffer = ""

            while True:
                raw = await ws.recv()
                data = json.loads(raw)
                msg_type = data.get("type")

                if msg_type == "token":
                    print(data["content"], end="", flush=True)
                    assistant_buffer += data["content"]

                elif msg_type == "trace":
                    # Print trace events on a separate line, clearly marked,
                    # so they don't get mixed into the streamed answer text.
                    print(f"\n  [TRACE] {json.dumps({k: v for k, v in data.items() if k != 'type'})}")

                elif msg_type == "error":
                    print(f"\n  [ERROR] {data.get('detail')}")

                elif msg_type == "message_complete":
                    print("\n")
                    break


if __name__ == "__main__":
    asyncio.run(run_cli())
