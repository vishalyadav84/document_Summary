import React, { useState } from 'react';
import axios from 'axios';

const FileUpload = ({ onSummaryGenerated }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert('Please select a file.');

    setLoading(true);

    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onSummaryGenerated(response.data.summary);
    } catch (error) {
      alert('Error uploading the file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
        <button type="submit">Upload and Summarize</button>
      </form>
      {loading && <p>Loading...</p>}
    </div>
  );
};

export default FileUpload;
