import os
import sys

# Add the 'backend' directory to the Python path so 'app' module can be found
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.insert(0, backend_dir)

from backend.main import app
