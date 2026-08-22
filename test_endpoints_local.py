import urllib.request
import urllib.error

url = "http://localhost:8000/api/v1/products/"

try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    response = urllib.request.urlopen(req)
    print("STATUS:", response.status)
    print("BODY:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code)
    print("BODY:", e.read().decode('utf-8'))
except Exception as e:
    print("ERROR:", e)
