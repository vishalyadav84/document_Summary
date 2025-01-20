import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState(null); 
  const [selectedSummary, setSelectedSummary] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) {
      setError("Please select a file.");
      return;
    }

    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Invalid file type. Please upload a PDF or an image (JPG/PNG).");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB. Please upload a smaller file.");
      return;
    }

    setFile(selectedFile);
    setError("");
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setLoading(true);
    setError("");
    setSummary(null);
    setSelectedSummary("");

    const formData = new FormData();
    formData.append("document", file); 

    try {
      const response = await axios.post("https://document-summary.vercel.app/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data && response.data.summary) {
        setSummary(response.data.summary); 
        setSelectedSummary(response.data.summary.short); 
      } else {
        setError("No summary generated. Please try again.");
      }
    } catch (err) {
      setError("Error processing file. Please try again.");
      console.error("Upload Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSummaryTypeChange = (event) => {
    const { value } = event.target;
    if (summary) {
      setSelectedSummary(summary[value]); 
    }
  };

  return (
    <div className="container">
      <h1>📄 Document Summary Assistant</h1>

      {/* File Input */}
      <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} disabled={loading} />

      {/* Buttons and Dropdown aligned side by side */}
      <div className="actions">
        {/* Upload Button */}
        <button onClick={handleUpload} disabled={loading || !file}>
          {loading ? "Processing..." : "Upload & Summarize"}
        </button>

        {/* Summary Type Dropdown */}
        <select onChange={handleSummaryTypeChange}>
          <option value="short">Choose Summary Type</option>
          <option value="short">Short</option>
          <option value="medium">Medium</option>
          <option value="long">Long</option>
        </select>
      </div>

      {/* Error Message */}
      {error && <p className="error">{error}</p>}

      {/* Display Selected Summary */}
      {selectedSummary && (
        <div className="summary-box">
          <h2>📝 Summary</h2>
          <p>{selectedSummary}</p>
        </div>
      )}
    </div>
  );
}

export default App;
