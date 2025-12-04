document.addEventListener('DOMContentLoaded', () => {
    const videoInput = document.getElementById('videoInput');
    const thumbnailInput = document.getElementById('thumbnailInput');
    const titleInput = document.getElementById('titleInput');
    const descriptionInput = document.getElementById('descriptionInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const videoDropZone = document.getElementById('videoDropZone');
    const thumbnailDropZone = document.getElementById('thumbnailDropZone');
    const videoFileName = document.getElementById('videoFileName');
    const thumbnailFileName = document.getElementById('thumbnailFileName');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const videoProgressBar = document.getElementById('videoProgressBar');
    const videoProgressFill = document.getElementById('videoProgressFill');
    const videoProgressText = document.getElementById('videoProgressText');

    // Helper to handle file selection
    const handleFileSelect = (input, displayElement) => {
        if (input.files && input.files[0]) {
            displayElement.textContent = input.files[0].name;
            displayElement.classList.remove('hidden');
        }
    };

    // Drag and Drop handlers
    const setupDragDrop = (dropZone, input, displayElement) => {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            input.files = files;
            handleFileSelect(input, displayElement);
        });
    };

    setupDragDrop(videoDropZone, videoInput, videoFileName);
    setupDragDrop(thumbnailDropZone, thumbnailInput, thumbnailFileName);

    videoInput.addEventListener('change', () => handleFileSelect(videoInput, videoFileName));
    thumbnailInput.addEventListener('change', () => handleFileSelect(thumbnailInput, thumbnailFileName));

    // Cancel button
    cancelBtn.addEventListener('click', () => {
        window.location.href = '../index.html'; // Or wherever you want to go
    });

    // Upload button
    uploadBtn.addEventListener('click', async () => {
        // Reset messages
        errorMessage.classList.add('hidden');
        successMessage.classList.add('hidden');
        errorMessage.textContent = '';
        successMessage.textContent = '';

        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const videoFile = videoInput.files[0];
        const thumbnailFile = thumbnailInput.files[0];

        // Validation
        if (!title || !description || !videoFile || !thumbnailFile) {
            errorMessage.textContent = 'Please fill in all fields and select both video and thumbnail files.';
            errorMessage.classList.remove('hidden');
            return;
        }

        // Prepare FormData
        const formData = new FormData();
        formData.append('file', videoFile); // Changed from 'video' to 'file' based on API spec
        formData.append('thumbnail', thumbnailFile);
        // Although the user showed query params, standard practice is FormData. 
        // We will append to URL as requested by the user's example, but also keep them in FormData just in case.
        // Actually, let's stick to the URL params for text as explicitly requested by the URL structure.
        
        const isPublic = true; // Defaulting to true as per example
        const queryParams = new URLSearchParams({
            title: title,
            description: description,
            is_public: isPublic
        }).toString();

        const url = `https://vstad-api.cheatdev.online/api/videos/upload?${queryParams}`;

        // Store Admin Token (Simulating Login)
        const ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzcyMzY1MjI0fQ.7992jyUJXZxQ9ya68GA2tNdo1KYeIJx9c1VPO_ed_lM";
        localStorage.setItem('accessToken', ADMIN_TOKEN);

        // UI Updates
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading...';
        videoProgressBar.classList.remove('hidden');
        videoProgressText.classList.remove('hidden');

        try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);

            // Auth token
            const token = localStorage.getItem('accessToken');
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }

            // Progress handler
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    videoProgressFill.style.width = percentComplete + '%';
                    videoProgressText.textContent = `Uploading: ${Math.round(percentComplete)}%`;
                }
            };

            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        successMessage.innerHTML = `Video "<strong>${response.title}</strong>" uploaded successfully! <br> <a href="${response.video_url}" target="_blank" class="underline">View Video</a>`;
                    } catch (e) {
                        successMessage.textContent = 'Video uploaded successfully!';
                    }
                    successMessage.classList.remove('hidden');
                    
                    // Reset form
                    titleInput.value = '';
                    descriptionInput.value = '';
                    videoInput.value = '';
                    thumbnailInput.value = '';
                    videoFileName.textContent = '';
                    thumbnailFileName.textContent = '';
                    videoProgressBar.classList.add('hidden');
                    videoProgressText.classList.add('hidden');
                    
                    // Optional: Redirect after a delay
                    setTimeout(() => {
                        window.location.href = '../pages/videos_management.html';
                    }, 3000);
                } else {
                    let errorMsg = 'Upload failed.';
                    try {
                        const response = JSON.parse(xhr.responseText);
                        errorMsg = response.message || errorMsg;
                    } catch (e) {
                        console.error('Error parsing response', e);
                    }
                    errorMessage.textContent = `Error: ${errorMsg}`;
                    errorMessage.classList.remove('hidden');
                }
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Upload';
            };

            xhr.onerror = function() {
                errorMessage.textContent = 'Network error occurred.';
                errorMessage.classList.remove('hidden');
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Upload';
            };

            xhr.send(formData);

        } catch (error) {
            console.error('Upload error:', error);
            errorMessage.textContent = 'An unexpected error occurred.';
            errorMessage.classList.remove('hidden');
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload';
        }
    });
});
