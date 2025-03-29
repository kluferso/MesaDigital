import os
import sys

# Add your project directory to the sys.path
project_home = '/home/yourusername/MesaDigital/server'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Import your application
from index import app as application  # This assumes your Express app is exported as 'app'

# This is the PythonAnywhere WSGI configuration
if __name__ == '__main__':
    application.run()
