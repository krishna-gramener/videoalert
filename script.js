// Configuration
const FRAME_CAPTURE_INTERVAL = 2000; // Capture frame every 2 seconds

// API Configuration from localStorage
let GEMINI_API_URL = localStorage.getItem('apiBaseUrl') || '';
let GEMINI_API_KEY = localStorage.getItem('apiKey') || '';

// DOM Elements - Pages
const landingPage = document.getElementById('landingPage');
const guidelinesPage = document.getElementById('guidelinesPage');
const contactPage = document.getElementById('contactPage');
const analysisPage = document.getElementById('analysisPage');

// DOM Elements - Configuration Modal
const configModal = document.getElementById('configModal');
const apiBaseUrlInput = document.getElementById('apiBaseUrl');
const apiKeyInput = document.getElementById('apiKey');
const saveConfigBtn = document.getElementById('saveConfigBtn');
const configError = document.getElementById('configError');

// DOM Elements - Navigation
const brandLink = document.getElementById('brandLink');
const overviewLink = document.getElementById('overviewLink');
const guidelinesLink = document.getElementById('guidelinesLink');
const contactLink = document.getElementById('contactLink');
const settingsBtn = document.getElementById('settingsBtn');
const startReviewBtn = document.getElementById('startReviewBtn');
const backToHomeBtn = document.getElementById('backToHomeBtn');

// DOM Elements - Views
const uploadView = document.getElementById('uploadView');
const processingView = document.getElementById('processingView');
const resultsView = document.getElementById('resultsView');

// DOM Elements - Upload
const videoInput = document.getElementById('videoInput');
const uploadZone = document.getElementById('uploadZone');

// DOM Elements - Processing
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const step4 = document.getElementById('step4');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const statusText = document.getElementById('statusText');

// DOM Elements - Results
const videoPlayer = document.getElementById('videoPlayer');
const frameCanvas = document.getElementById('frameCanvas');
const framesGridContainer = document.getElementById('framesGridContainer');
const frameCount = document.getElementById('frameCount');
const analysisOutput = document.getElementById('analysisOutput');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');

// Canvas setup
const ctx = frameCanvas.getContext('2d');
frameCanvas.width = 640;
frameCanvas.height = 360;

// Video processing variables
let capturedFrames = [];
let analysisResults = [];

// Initialize - Check for API configuration
let configModalInstance;
document.addEventListener('DOMContentLoaded', () => {
    configModalInstance = new bootstrap.Modal(configModal);
    checkApiConfiguration();
});

// Event Listener - Configuration Modal
if (saveConfigBtn) saveConfigBtn.addEventListener('click', saveConfiguration);
if (settingsBtn) settingsBtn.addEventListener('click', () => {
    // Pre-fill with current values
    if (apiBaseUrlInput) apiBaseUrlInput.value = GEMINI_API_URL;
    if (apiKeyInput) apiKeyInput.value = GEMINI_API_KEY;
    configModalInstance.show();
});

// Event Listeners - Navigation
if (brandLink) brandLink.addEventListener('click', (e) => { e.preventDefault(); showPage('overview'); });
if (overviewLink) overviewLink.addEventListener('click', (e) => { e.preventDefault(); showPage('overview'); });
if (guidelinesLink) guidelinesLink.addEventListener('click', (e) => { e.preventDefault(); showPage('guidelines'); });
if (contactLink) contactLink.addEventListener('click', (e) => { e.preventDefault(); showPage('contact'); });
if (startReviewBtn) startReviewBtn.addEventListener('click', showAnalysisPage);
if (backToHomeBtn) backToHomeBtn.addEventListener('click', () => showPage('overview'));

// Event Listeners - Analysis Page
if (uploadZone) uploadZone.addEventListener('click', () => videoInput.click());
if (videoInput) videoInput.addEventListener('change', handleVideoUpload);
if (exportBtn) exportBtn.addEventListener('click', exportAnalysis);
if (clearBtn) clearBtn.addEventListener('click', clearResults);

// API Configuration Functions
function checkApiConfiguration() {
    if (!GEMINI_API_URL || !GEMINI_API_KEY) {
        // Show modal if configuration is missing
        configModalInstance.show();
    } else {
        // Pre-fill the form with existing values
        if (apiBaseUrlInput) apiBaseUrlInput.value = GEMINI_API_URL;
        if (apiKeyInput) apiKeyInput.value = GEMINI_API_KEY;
    }
}

function saveConfiguration() {
    const baseUrl = apiBaseUrlInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    
    // Validate inputs
    if (!baseUrl || !apiKey) {
        configError.classList.remove('d-none');
        return;
    }
    
    // Hide error if shown
    configError.classList.add('d-none');
    
    // Save to localStorage
    localStorage.setItem('apiBaseUrl', baseUrl);
    localStorage.setItem('apiKey', apiKey);
    
    // Update global variables
    GEMINI_API_URL = baseUrl;
    GEMINI_API_KEY = apiKey;
    
    // Close modal
    configModalInstance.hide();
    
    // Show success message (optional)
    console.log('API configuration saved successfully');
}

// Page Navigation
function showPage(page) {
    // Hide all pages
    landingPage.classList.add('hidden');
    guidelinesPage.classList.add('hidden');
    contactPage.classList.add('hidden');
    analysisPage.style.display = 'none';
    
    // Update nav links
    overviewLink.classList.remove('active');
    guidelinesLink.classList.remove('active');
    contactLink.classList.remove('active');
    
    // Show selected page
    if (page === 'overview') {
        landingPage.classList.remove('hidden');
        overviewLink.classList.add('active');
    } else if (page === 'guidelines') {
        guidelinesPage.classList.remove('hidden');
        guidelinesLink.classList.add('active');
    } else if (page === 'contact') {
        contactPage.classList.remove('hidden');
        contactLink.classList.add('active');
    }
}

function showAnalysisPage() {
    landingPage.classList.add('hidden');
    guidelinesPage.classList.add('hidden');
    contactPage.classList.add('hidden');
    analysisPage.style.display = 'block';
    showView('upload');
}

// View Management
function showView(view) {
    uploadView.classList.add('hidden');
    processingView.classList.add('hidden');
    resultsView.classList.add('hidden');
    
    if (view === 'upload') {
        uploadView.classList.remove('hidden');
    } else if (view === 'processing') {
        processingView.classList.remove('hidden');
    } else if (view === 'results') {
        resultsView.classList.remove('hidden');
    }
}

// Step Management
function setStep(stepNumber, state) {
    const steps = [step1, step2, step3, step4];
    const step = steps[stepNumber - 1];
    
    step.classList.remove('active', 'completed');
    if (state === 'active') {
        step.classList.add('active');
    } else if (state === 'completed') {
        step.classList.add('completed');
    }
}

// Handle video upload
function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const videoURL = URL.createObjectURL(file);
        videoPlayer.src = videoURL;
        
        // Reset state
        analysisResults = [];
        capturedFrames = [];
        currentCarouselIndex = 0;
        
        // Show processing view
        showView('processing');
        setStep(1, 'active');
        updateProgress(0, 'Loading video...');
        
        videoPlayer.onloadedmetadata = function() {
            setStep(1, 'completed');
            setStep(2, 'active');
            // Once metadata is loaded, extract all frames immediately
            extractAllFrames();
        };
    }
}

// Update progress bar and status
function updateProgress(percentage, status) {
    progressBar.style.width = percentage + '%';
    progressText.textContent = Math.round(percentage) + '%';
    statusText.textContent = status;
}

// Extract all frames from video at 2-second intervals
async function extractAllFrames() {
    try {
        const duration = videoPlayer.duration;
        const interval = FRAME_CAPTURE_INTERVAL / 1000; // Convert to seconds
        
        console.log(`Video duration: ${duration}s, extracting frames every ${interval}s`);
        
        // Calculate total frames to extract
        const totalFrames = Math.floor(duration / interval) + 1;
        let framesExtracted = 0;
        
        updateProgress(10, `Extracting frames from video (0/${totalFrames})...`);
        
        // Extract frames at each interval
        for (let time = 0; time <= duration; time += interval) {
            await seekAndCaptureFrame(time);
            framesExtracted++;
            
            // Update progress (10% to 50%)
            const progress = 10 + (framesExtracted / totalFrames) * 40;
            updateProgress(progress, `Extracting frames... ${framesExtracted}/${totalFrames} captured`);
        }
        
        console.log(`Extraction complete: ${capturedFrames.length} frames captured`);
        setStep(2, 'completed');
        setStep(3, 'active');
        updateProgress(50, `Extracted ${capturedFrames.length} frames. Starting AI analysis...`);
        
        // Automatically analyze all frames
        await analyzeAllFrames();
        
    } catch (error) {
        console.error('Error extracting frames:', error);
        updateProgress(0, 'Error extracting frames. Please try again.');
    }
}

// Seek to specific time and capture frame
function seekAndCaptureFrame(timeInSeconds) {
    return new Promise((resolve) => {
        const onSeeked = () => {
            // Remove event listener immediately
            videoPlayer.removeEventListener('seeked', onSeeked);
            
            // Wait a bit for the frame to fully render
            setTimeout(() => {
                const timestamp = formatTime(timeInSeconds);
                
                // Clear canvas first
                ctx.clearRect(0, 0, frameCanvas.width, frameCanvas.height);
                
                // Draw current frame to canvas
                ctx.drawImage(videoPlayer, 0, 0, frameCanvas.width, frameCanvas.height);
                const frameData = frameCanvas.toDataURL('image/jpeg', 0.8);
                
                // Store frame with timestamp
                capturedFrames.push({
                    timestamp: timestamp,
                    timeInSeconds: timeInSeconds,
                    frameData: frameData
                });
                
                console.log(`Frame captured at ${timestamp} (${frameData.length} bytes, Total frames: ${capturedFrames.length})`);
                
                resolve();
            }, 100); // Wait 100ms for frame to render
        };
        
        // Add event listener for when seek completes
        videoPlayer.addEventListener('seeked', onSeeked, { once: true });
        
        // Seek to the time
        videoPlayer.currentTime = timeInSeconds;
    });
}

// Analyze all captured frames in batch
async function analyzeAllFrames() {
    try {
        console.log(`Starting batch analysis of ${capturedFrames.length} frames...`);
        
        updateProgress(60, 'Preparing frames for AI analysis...');
        
        // Prepare frames for LLM (convert to image_url format)
        const imageContent = capturedFrames.map(frame => ({
            type: 'image_url',
            image_url: {
                url: frame.frameData
            }
        }));
        
        const prompt = `You are analyzing ${capturedFrames.length} frames from warehouse CCTV surveillance footage captured at 2-second intervals.

Analyze ALL frames and provide a comprehensive summary report with the following structure:

## Overall Activity Summary
Describe the general activities observed across all frames

## Statistics
- **People Count**: Average and peak number of people visible with timestamp
- **Vehicle/Forklift Count**: Average and peak number of vehicles/forklifts visible with timestamp, also detect equipments like conveyer belt and on avg how many people were around the conveyer belt accross different timestamps. Provide with exact location and time of presence along with number.

## Safety Violations Detected
List any instances of:
- Workers not wearing safety equipment (helmets, vests, gloves)
- Unsafe lifting practices or working in restricted zones

## Security Concerns
Report any:
- Unauthorized access or suspicious behavior
- Unattended packages or potential theft

## Fire Hazards
Note any smoke, flames, blocked exits, or improper storage

## Operational Issues
Identify:
- Spills, fallen pallets, or blocked pathways
- Equipment misuse or unsafe forklift operation
- Congestion in loading/unloading areas
- Idle workers during active periods

For each issue detected, include the approximate timeframe when it occurred.

Use markdown formatting with headers (##), bullet points (-), and **bold** for emphasis.`;

        // Create message content with text prompt first, then all images
        const messageContent = [
            {
                type: 'text',
                text: prompt
            },
            ...imageContent
        ];
        
        updateProgress(70, 'Sending frames to AI for analysis...');
        
        const response = await analyzeFramesBatch(messageContent);
        console.log("Received batch analysis from LLM");
        
        updateProgress(90, 'Processing AI response...');
        
        setStep(3, 'completed');
        setStep(4, 'active');
        
        // Display the comprehensive analysis
        displayBatchAnalysis(response);
        
        // Display frames grid
        displayFramesGrid();
        
        updateProgress(100, 'Analysis complete!');
        
        // Wait a moment then show results
        setTimeout(() => {
            setStep(4, 'completed');
            showView('results');
        }, 1000);
        
    } catch (error) {
        updateProgress(0, 'Error during analysis. Please try again.');
        console.error('Error analyzing frames:', error);
    }
}

// Format time in MM:SS format
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Display batch analysis result with markdown parsing
function displayBatchAnalysis(analysis) {
    // Parse markdown to HTML using marked.js
    const htmlContent = marked.parse(analysis);
    
    analysisOutput.innerHTML = `
        <div class="mb-4">
            <div class="stat-card">
                <div class="stat-value">${capturedFrames.length}</div>
                <div class="stat-label">Frames Analyzed</div>
            </div>
        </div>
        
        <div class="analysis-markdown">
            ${htmlContent}
        </div>
        
        <div class="mt-3 p-3 bg-light rounded">
            <small class="text-muted">
                <i class="bi bi-info-circle me-2"></i>
                Analysis completed on ${new Date().toLocaleString()} | 
                ${capturedFrames.length} frames captured at 2-second intervals
            </small>
        </div>
    `;
    
    // Store result for export
    analysisResults.push({
        timestamp: new Date().toISOString(),
        analysis: analysis,
        frameCount: capturedFrames.length
    });
    
    // Update frame count badge
    frameCount.textContent = capturedFrames.length;
}

// Display frames in grid
function displayFramesGrid() {
    console.log(`Displaying ${capturedFrames.length} frames in grid`);
    framesGridContainer.innerHTML = '';
    
    if (capturedFrames.length === 0) {
        console.warn('No frames to display');
        framesGridContainer.innerHTML = '<div class="text-center p-5 text-muted">No frames captured</div>';
        return;
    }
    
    capturedFrames.forEach((frame, index) => {
        // Create frame card
        const frameCard = document.createElement('div');
        frameCard.className = 'frame-card';
        
        // Create image element
        const img = document.createElement('img');
        img.src = frame.frameData;
        img.alt = `Frame at ${frame.timestamp}`;
        img.className = 'frame-img';
        
        img.onerror = (e) => {
            console.error(`Failed to load frame ${index} at ${frame.timestamp}`, e);
            frameCard.innerHTML = '<div class="text-danger p-3">Failed to load</div>';
        };
        
        // Create timestamp label
        const timestamp = document.createElement('div');
        timestamp.className = 'frame-time';
        timestamp.textContent = frame.timestamp;
        
        // Append to card
        frameCard.appendChild(img);
        frameCard.appendChild(timestamp);
        framesGridContainer.appendChild(frameCard);
    });
    
    console.log('Frames grid displayed successfully');
}

// Export analysis results
function exportAnalysis() {
    if (analysisResults.length === 0) {
        alert('No analysis to export');
        return;
    }

    const result = analysisResults[0];
    const exportData = `WAREHOUSE VIDEO ANALYSIS REPORT
Generated: ${new Date(result.timestamp).toLocaleString()}
Frames Analyzed: ${result.frameCount}
Capture Interval: 2 seconds

========================================
ANALYSIS RESULTS
========================================

${result.analysis}

========================================
END OF REPORT
========================================`;

    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warehouse-analysis-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Clear results and reset
function clearResults() {
    analysisResults = [];
    capturedFrames = [];
    videoPlayer.src = '';
    videoInput.value = '';
    framesGridContainer.innerHTML = '';
    frameCount.textContent = '0';
    
    analysisOutput.innerHTML = '';
    
    // Reset steps
    setStep(1, '');
    setStep(2, '');
    setStep(3, '');
    setStep(4, '');
    
    updateProgress(0, 'Waiting to start...');
    
    // Show upload view
    showView('upload');
}

// Call Gemini API with batch of frames
async function analyzeFramesBatch(messageContent) {
    try {
        console.log("Preparing batch API request to Gemini...");
        console.log(`Sending ${capturedFrames.length} frames for analysis...`);
        
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GEMINI_API_KEY}:MonitorAI`
            },
            credentials: 'include',
            body: JSON.stringify({
                model: 'gemini-3-flash-preview',
                messages: [{
                    role: 'user',
                    content: messageContent
                }]
            })
        });

        console.log("API response status:", response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("API error response:", errorText);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log("API response received:", data);
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
            console.error("Unexpected API response format:", data);
            throw new Error("Invalid API response format");
        }
        
        return data.choices[0].message.content;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
