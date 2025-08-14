import http.server
import socketserver
import os
import sys
from pathlib import Path

class SPAHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler that serves index.html for SPA routes"""
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        # Get the requested path
        path = self.translate_path(self.path)
        
        # If the file exists, serve it normally
        if os.path.exists(path) and os.path.isfile(path):
            return super().do_GET()
        
        # If it's a directory with an index.html, serve that
        if os.path.isdir(path):
            index_path = os.path.join(path, 'index.html')
            if os.path.exists(index_path):
                return super().do_GET()
        
        # For SPA routes (non-existent files), serve index.html
        # But exclude API calls and static assets
        if not self.path.startswith('/api/') and not '.' in os.path.basename(self.path):
            self.path = '/index.html'
        
        return super().do_GET()

def serve_spa(port=5173, directory=None):
    """Serve SPA with proper routing"""
    if directory:
        os.chdir(directory)
    
    with socketserver.TCPServer(("", port), SPAHTTPRequestHandler) as httpd:
        print(f"Serving SPA at http://localhost:{port}")
        print(f"Directory: {os.getcwd()}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    directory = sys.argv[2] if len(sys.argv) > 2 else None
    serve_spa(port, directory)
