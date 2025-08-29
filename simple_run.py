#!/usr/bin/env python3
"""
Simple script to run FastAPI, Express, and Next.js servers.
"""

import os
import sys
import subprocess
import signal
import time
from pathlib import Path

class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    NC = '\033[0m'

class SimpleRunner:
    def __init__(self):
        self.processes = []
        self.script_dir = Path(__file__).parent.absolute()
        
    def cleanup(self, signum=None, frame=None):
        """Stop all servers."""
        print(f"\n{Colors.YELLOW}Stopping servers...{Colors.NC}")
        for process in self.processes:
            if process and process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    process.kill()
        print(f"{Colors.GREEN}All servers stopped{Colors.NC}")
        sys.exit(0)
    
    def start_fastapi(self):
        """Start FastAPI on port 8000."""
        print(f"{Colors.GREEN}Starting FastAPI...{Colors.NC}")
        fastapi_dir = self.script_dir / "server" / "fastapi_service"
        
        process = subprocess.Popen(
            ["python", "run.py"],
            cwd=fastapi_dir,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        self.processes.append(process)
        return process
    
    def start_express(self):
        """Start Express on port 8080."""
        print(f"{Colors.GREEN}Starting Express...{Colors.NC}")
        express_dir = self.script_dir / "server" / "express_service"
        
        env = os.environ.copy()
        env["PORT"] = "8080"
        
        process = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=express_dir,
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        self.processes.append(process)
        return process
    
    def start_frontend(self):
        """Start Next.js on port 3000."""
        print(f"{Colors.GREEN}Starting Frontend...{Colors.NC}")
        client_dir = self.script_dir / "client"
        
        process = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=client_dir,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        self.processes.append(process)
        return process
    
    def run(self):
        """Start all services."""
        signal.signal(signal.SIGINT, self.cleanup)
        signal.signal(signal.SIGTERM, self.cleanup)
        
        print(f"{Colors.CYAN}🚀 Starting Development Servers{Colors.NC}")
        print()
        
        # Start services
        self.start_fastapi()
        time.sleep(3)
        
        self.start_express()
        time.sleep(3)
        
        self.start_frontend()
        time.sleep(5)
        
        print()
        print(f"{Colors.CYAN}{'='*50}{Colors.NC}")
        print(f"{Colors.GREEN}✅ All servers started!{Colors.NC}")
        print()
        print(f"{Colors.BLUE}Frontend:  http://localhost:3000{Colors.NC}")
        print(f"{Colors.BLUE}FastAPI:   http://localhost:8000{Colors.NC}")
        print(f"{Colors.BLUE}FastAPI Docs: http://localhost:8000/docs{Colors.NC}")
        print(f"{Colors.BLUE}Express:   http://localhost:8080{Colors.NC}")
        print()
        print(f"{Colors.YELLOW}Press Ctrl+C to stop all servers{Colors.NC}")
        print(f"{Colors.CYAN}{'='*50}{Colors.NC}")
        
        # Wait
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            self.cleanup()

if __name__ == "__main__":
    runner = SimpleRunner()
    runner.run()
