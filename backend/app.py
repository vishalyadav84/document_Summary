from flask import Flask, request, jsonify
from flask_cors import CORS
import pytesseract
from pdfminer.high_level import extract_text
import os
import logging

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

app = Flask(__name__)
CORS(app)  

UPLOAD_FOLDER = 'uploads/'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

MAX_FILE_SIZE = 5 * 1024 * 1024  
ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}

def allowed_file(filename):
    """
    Check if the file has a valid extension.
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload_file():
    logging.info("Upload request received.")

    if 'document' not in request.files:
        logging.error("No file part in request.")
        return jsonify({"error": "No file part in the request."}), 400

    file = request.files['document']
    if file.filename == '':
        logging.error("No file selected.")
        return jsonify({"error": "No file selected."}), 400

    file.filename = file.filename.replace(" ", "_")

    if not allowed_file(file.filename):
        logging.error(f"Unsupported file type: {file.filename}")
        return jsonify({"error": "Invalid file type. Only PDF and image files are supported."}), 400

    if file.content_length > MAX_FILE_SIZE:
        logging.error(f"File size exceeds limit: {file.content_length} bytes")
        return jsonify({"error": "File size exceeds 5MB. Please upload a smaller file."}), 400

    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    try:
        file.save(file_path)
        logging.info(f"File saved successfully at {file_path}")

        ext = file.filename.split('.')[-1].lower()
        if ext == 'pdf':
            text = extract_text(file_path)
            logging.info("PDF text extraction completed.")
        else:
            text = pytesseract.image_to_string(file_path)
            logging.info("Image text extraction completed.")

        if not text.strip():
            logging.warning("Extracted text is empty.")
            return jsonify({"error": "Unable to extract text from the file."}), 400
        summary = generate_summary(text)
        logging.info("Summary generation completed.")

        response = {
            "summary": summary,
            "type": "pdf" if ext == 'pdf' else "image"
        }
        logging.info("Response prepared successfully.")

    except Exception as e:
        logging.exception("An error occurred during file processing.")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
            logging.info(f"Temporary file deleted: {file_path}")

    return jsonify(response)

def generate_summary(text):
    """
    Generate a summary from the input text by splitting it into short, medium, and long summaries.
    """
    sentences = text.split('. ')
    return {
        "short": '. '.join(sentences[:2]).strip() + ('.' if len(sentences) >= 2 else ''),
        "medium": '. '.join(sentences[:10]).strip() + ('.' if len(sentences) >= 10 else ''),
        "long": '. '.join(sentences[:40]).strip() + ('.' if len(sentences) >= 40 else '')
    }

if __name__ == '__main__':
    app.run(debug=True)
