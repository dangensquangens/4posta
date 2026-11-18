"""Run the static development server, including in the preview runner."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from functools import partial

parser = argparse.ArgumentParser()
parser.add_argument('--host', default='127.0.0.1')
parser.add_argument('--port', default=4173, type=int)
parser.add_argument('--strictPort', action='store_true', help=argparse.SUPPRESS)
args = parser.parse_args()

root = Path(__file__).resolve().parent.parent
handler = partial(SimpleHTTPRequestHandler, directory=str(root))
with ThreadingHTTPServer((args.host, args.port), handler) as server:
    print(f'http://{args.host}:{args.port}/', flush=True)
    server.serve_forever()
