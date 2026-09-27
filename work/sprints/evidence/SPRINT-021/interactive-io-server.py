"""Serve unchanged production assets with an opt-in real-file scheduling fixture."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        route = self.path.split("?", 1)[0]
        if route in ("/", "/index.html"):
            body = (ROOT / "dist/index.html").read_text().replace(
                "<head>", '<head><script src="/interactive-io-scheduler.js"></script>', 1
            ).encode()
            kind = "text/html; charset=utf-8"
        elif route == "/interactive-io-scheduler.js":
            body = (HERE / "interactive-io-scheduler.js").read_bytes()
            kind = "text/javascript; charset=utf-8"
        else:
            return super().do_GET()
        self.send_response(200)
        self.send_header("Content-Type", kind)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    ThreadingHTTPServer(
        ("127.0.0.1", 4174), partial(Handler, directory=str(ROOT / "dist"))
    ).serve_forever()
