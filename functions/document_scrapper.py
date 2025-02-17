import requests
import pdfplumber
import firebase_admin
from firebase_admin import credentials, firestore
import sys

# Initialize Firebase Admin SDK
cred = credentials.Certificate("path/to/your/firebase-adminsdk.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def fetch_document(url):
    response = requests.get(url)
    with open("document.pdf", "wb") as file:
        file.write(response.content)

def parse_pdf(file_path):
    with pdfplumber.open(file_path) as pdf:
        text = ""
        for page in pdf.pages:
            text += page.extract_text()
    return text

def save_to_firestore(document_text):
    doc_ref = db.collection("documents").add({"content": document_text})
    return doc_ref

def main(url):
    fetch_document(url)
    document_text = parse_pdf("document.pdf")
    save_to_firestore(document_text)

if __name__ == "__main__":
    url = sys.argv[1]
    main(url)