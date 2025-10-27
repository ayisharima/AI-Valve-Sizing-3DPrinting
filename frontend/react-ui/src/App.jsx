
import { useState } from 'react';
import './App.css';

// The predefined prompts remain the same
const promptOptions = {
  general: "Analyze the general geometry of the aortic root and visible coronary arteries. Estimate plausible dimensions for a 70-year-old patient and check for calcification.",
  pathology: "Examine the base of the valve and arterial walls for calcification evidence. Based on the findings, suggest a valve type and material stiffness.",
  complex: "Infer the required leaflet thickness and sinus width for this aortic root. Note the high definition of the coronary vasculature for the design."
};

const formatKey = (key) => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

function App() {
  // --- STATE CHANGES ---
  // We still track the dropdown's key
  const [promptKey, setPromptKey] = useState('general'); 
  // NEW: A separate state for the actual text in the text area.
  // We initialize it with the default prompt text.
  const [promptText, setPromptText] = useState(promptOptions.general);

  const [imageFile, setImageFile] = useState(null);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    setImageFile(event.target.files[0]);
  };

  // --- NEW HANDLER for the dropdown ---
  // When the dropdown changes, we update BOTH state variables.
  const handlePromptSelectionChange = (event) => {
    const newKey = event.target.value;
    setPromptKey(newKey); // Update which option is selected
    setPromptText(promptOptions[newKey]); // Fill the text area with the new template
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!imageFile || !promptText) {
      setError('Please provide both an image file and a text prompt.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResults(null);

    const formData = new FormData();
    
    formData.append('doctor_prompt', promptText); 
    formData.append('scan_image', imageFile);

    try {
      const response = await fetch('http://localhost:8000/api/analyze_scan', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderResults = () => {
    if (!results) return null;
    return (
      <div className="results-section">
        <h2>Analysis Results</h2>
        <table className="results-table">
          <tbody>
            {Object.entries(results).map(([key, value]) => {
              if (value === null || value === undefined) return null;
              let displayValue = value;
              if (typeof value === 'boolean') {
                displayValue = <span className={value ? 'boolean-true' : 'boolean-false'}>{value ? 'Yes' : 'No'}</span>;
              }
              return (<tr key={key}><th>{formatKey(key)}</th><td>{displayValue}</td></tr>);
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container">
      <header className="header"><h1>AI Heart Valve Analyst</h1><p>Instantly convert a scan into machine-ready fabrication data.</p></header>
      <form onSubmit={handleSubmit} className="form-section">
        <div className="form-group">
          <label htmlFor="prompt-select">Select a Prompt Template (Optional)</label>
          <select id="prompt-select" value={promptKey} onChange={handlePromptSelectionChange}>
            <option value="general">General Anatomical Analysis</option>
            <option value="pathology">Focus on Pathology & Material</option>
            <option value="complex">Complex Geometrical Reasoning</option>
          </select>
        </div>
        
        {/* --- UI CHANGE:*/}
        <div className="form-group">
            <label htmlFor="prompt-input">Doctor's Prompt / Request</label>
            <textarea
                id="prompt-input"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                rows="4"
            />
        </div>

        <div className="form-group">
          <label htmlFor="file-input">Upload Scan Image</label>
          <input id="file-input" type="file" accept="image/*" onChange={handleFileChange} />
        </div>
        <button type="submit" className="submit-btn" disabled={isLoading}>{isLoading ? 'Analyzing...' : 'Generate 3D Metrics'}</button>
      </form>
      {isLoading && <div className="status-message">AI is processing the scan... Please wait.</div>}
      {error && <div className="error-message">{error}</div>}
      {!isLoading && !error && !results && <div className="status-message">Select a prompt or write your own, then upload a scan to begin.</div>}
      {renderResults()}
    </div>
  );
}

export default App;