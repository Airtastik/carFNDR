import React, { useState, useRef, useEffect } from "react";
import "./App.css";

const App: React.FC = () => {
  // Media States
  const [mediaFile, setMediaFile] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);

  // Search States
  const [showSearch, setShowSearch] = useState<boolean>(true); // Default open for better UX
  const [searchMode, setSearchMode] = useState<"simple" | "advanced">("simple");
  const [advancedSearch, setAdvancedSearch] = useState<string>("");
  const [make, setMake] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [licensePlate, setLicensePlate] = useState<string>("");

  // Analysis States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string>("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [analysisSteps, setAnalysisSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stepsEndRef = useRef<HTMLDivElement>(null);

  const makes = ["Toyota", "Honda", "Ford", "Chevrolet", "BMW", "Mercedes", "Audi", "Tesla", "Nissan", "Hyundai", "Opel"];
  const models = ["Camry", "Accord", "F-150", "Silverado", "Model 3", "Civic", "Corolla", "Mustang", "CR-V", "RAV4", "A4", "Astra"];
  const colors = ["Black", "White", "Silver", "Gray", "Red", "Blue", "Green", "Yellow", "Orange", "Brown"];

  // Auto-scroll to latest step
  useEffect(() => {
    if (stepsEndRef.current && isLoading) {
      stepsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [analysisSteps, currentStep, isLoading]);

  // Simulate streaming analysis steps
  const simulateAnalysisSteps = () => {
    const steps = [
      "Initializing video analysis...",
      "Loading media file...",
      "Extracting frames...",
      "Running vehicle detection model...",
      "Identifying vehicle characteristics...",
      "Analyzing license plates...",
      "Processing color information...",
      "Matching against search criteria...",
      "Generating analysis report...",
      "Finalizing results...",
    ];

    setAnalysisSteps([]);
    setCurrentStep("");

    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        const step = steps[stepIndex];
        setAnalysisSteps((prev) => [...prev, step]);
        setCurrentStep(step);
        stepIndex++;
      } else {
        clearInterval(stepInterval);
        setCurrentStep("Analysis complete!");
      }
    }, 600); // Add a step every 600ms

    return stepInterval;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      setRawFile(file);
      const fileURL = URL.createObjectURL(file);
      setMediaFile(fileURL);

      if (file.type.startsWith("image/")) {
        setMediaType("image");
      } else if (file.type.startsWith("video/")) {
        setMediaType("video");
      }

      // Clear previous results when new file is selected
      setResult("");
      setScreenshot(null);
      setAnalysisSteps([]);
      setCurrentStep("");
    }
  };

  const handleInsertClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleSearch = async (): Promise<void> => {
    // Validation
    if (!rawFile) {
      alert("Please insert a media file first.");
      return;
    }

    setIsLoading(true);
    setResult("");
    setScreenshot(null);

    // Start simulated streaming steps
    const stepInterval = simulateAnalysisSteps();

    const formData = new FormData();
    formData.append("media", rawFile);
    formData.append("make", make);
    formData.append("model", model);
    formData.append("color", color);
    formData.append("licensePlate", licensePlate);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/search", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      // Clear interval once we get the response
      clearInterval(stepInterval);

      if (data.status === "success") {
        setCurrentStep("Analysis complete!");
        setTimeout(() => {
          setResult(data.analysis);
          setScreenshot(data.screenshot);
        }, 300);
      } else {
        setCurrentStep("Analysis failed");
        alert("Error: " + data.message);
      }
    } catch (error) {
      clearInterval(stepInterval);
      console.error("Error:", error);
      setCurrentStep("Connection failed");
      alert("Failed to connect to backend.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearResults = () => {
    setResult("");
    setScreenshot(null);
    setAnalysisSteps([]);
    setCurrentStep("");
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Media Search App</h1>
        <p>Upload and search vehicle footage</p>
      </header>

      <main className="App-main">
        <div className="search-container">
          <div className="search-header">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="btn-toggle-search">
              <span className="toggle-icon">{showSearch ? "▼" : "▶"}</span>
              <span>{showSearch ? "Hide Search Panel" : "Show Search Panel"}</span>
            </button>
          </div>

          {showSearch && (
            <div className="search-content">
              <div className="search-toggle">
                <button
                  className={`toggle-btn ${searchMode === "simple" ? "active" : ""}`}
                  onClick={() => setSearchMode("simple")}>
                  Simple
                </button>
                <button
                  className={`toggle-btn ${searchMode === "advanced" ? "active" : ""}`}
                  onClick={() => setSearchMode("advanced")}>
                  Advanced
                </button>
              </div>

              {searchMode === "simple" ? (
                <div className="simple-search">
                  <div className="search-field">
                    <label>Make</label>
                    <select
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      disabled={isLoading}>
                      <option value="">Select Make</option>
                      {makes.map((m) => (
                        <option
                          key={m}
                          value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="search-field">
                    <label>Model</label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      disabled={isLoading}>
                      <option value="">Select Model</option>
                      {models.map((m) => (
                        <option
                          key={m}
                          value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="search-field">
                    <label>Color</label>
                    <select
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      disabled={isLoading}>
                      <option value="">Select Color</option>
                      {colors.map((c) => (
                        <option
                          key={c}
                          value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="search-field">
                    <label>License Plate</label>
                    <input
                      type="text"
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value)}
                      placeholder="Enter license plate"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              ) : (
                <div className="advanced-search">
                  <div className="search-field">
                    <label>Advanced Search Query</label>
                    <textarea
                      value={advancedSearch}
                      onChange={(e) => setAdvancedSearch(e.target.value)}
                      placeholder="Enter advanced search query..."
                      rows={4}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              <div className="search-actions">
                <button
                  onClick={handleInsertClick}
                  className="btn-insert"
                  disabled={isLoading}>
                  <span className="btn-icon">📁</span>
                  <span>Insert File</span>
                </button>
                <button
                  onClick={handleSearch}
                  className="btn-execute-search"
                  disabled={isLoading || !rawFile}>
                  <span className="btn-icon">🔍</span>
                  <span>{isLoading ? "Analyzing..." : "Execute Search"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="media-container">
          {mediaFile ? (
            <>
              {mediaType === "image" ? (
                <img
                  src={mediaFile}
                  alt="Uploaded content"
                  className="media-display"
                />
              ) : (
                <video
                  src={mediaFile}
                  controls
                  className="media-display"
                />
              )}
              <div className="media-overlay">
                <span className="media-label">{mediaType === "image" ? "Image" : "Video"} loaded</span>
              </div>
            </>
          ) : (
            <div className="media-placeholder">
              <div className="placeholder-icon">📹</div>
              <p>No media loaded</p>
              <p className="placeholder-hint">Click "Insert File" to get started</p>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="analysis-progress">
            <div className="progress-header">
              <h3>Analysis in Progress</h3>
              <div className="progress-spinner"></div>
            </div>
            <div className="steps-container">
              {analysisSteps.map((step, index) => (
                <div
                  key={index}
                  className="step-item completed"
                  style={{ animationDelay: `${index * 0.1}s` }}>
                  <span className="step-check">✓</span>
                  <span className="step-text">{step}</span>
                </div>
              ))}
              {currentStep && currentStep !== "Analysis complete!" && (
                <div className="step-item current">
                  <span className="step-cursor">▶</span>
                  <span className="step-text">{currentStep}</span>
                  <span className="typing-cursor"></span>
                </div>
              )}
              <div ref={stepsEndRef} />
            </div>
          </div>
        )}

        {result && !isLoading && (
          <div className="result-container">
            <div className="result-header">
              <h2>Search Results</h2>
              <button
                onClick={handleClearResults}
                className="btn-clear">
                Clear Results
              </button>
            </div>

            <div className="result-box">
              <h3>AI Analysis:</h3>
              <p>{result}</p>
            </div>

            {screenshot ? (
              <div className="screenshot-box">
                <h3>Detection Snapshot:</h3>
                <img
                  src={screenshot}
                  alt="Car detection moment"
                  className="detection-image"
                  onError={(e) => {
                    console.error("Failed to load screenshot:", screenshot);
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.border = "2px solid var(--border)";
                    target.alt = "Failed to load image";
                  }}
                />
              </div>
            ) : (
              <div className="screenshot-box empty">
                <h3>Detection Snapshot:</h3>
                <p>No screenshot available for this search.</p>
              </div>
            )}
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,video/*"
          style={{ display: "none" }}
        />
      </main>
    </div>
  );
};

export default App;
