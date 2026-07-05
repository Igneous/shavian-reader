#!/usr/bin/env python3
# dev server: python3 serve.py -> http://localhost:8000/
# ponytail: stdlib http.server; no-cache so you never chase a stale app.js
import http.server, functools

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

http.server.ThreadingHTTPServer(('', 8000), functools.partial(H, directory='public')).serve_forever()
