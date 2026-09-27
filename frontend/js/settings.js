// Settings Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = 'index.html';
        return;
    }
    
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    // Set up authentication header for API requests
    const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
    };
    
    // API Configuration
    const apiConfig = window.ENV_CONFIG;
    
    // Initialize the page
    initializePage();
    
    // Function to initialize the page
    async function initializePage() {
        await loadAccountInfo();
        await loadTrustedContact();
        setupFormHandlers();
        setupModalHandlers();
    }
    
    // Function to load account information
    async function loadAccountInfo() {
        try {
            const apiUrl = `${apiConfig.backendApiUrl}/api/settings/account-info`;
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    populateAccountInfo(data.accountInfo);
                }
            } else {
                console.warn('Could not load account information');
                // Fallback to localStorage data
                populateBasicAccountInfo();
            }
        } catch (error) {
            console.error('Error loading account info:', error);
            populateBasicAccountInfo();
        }
    }
    
    // Function to populate account information
    function populateAccountInfo(accountInfo) {
        document.getElementById('current-email').textContent = accountInfo.email;
        document.getElementById('current-email-input').value = accountInfo.email;
        document.getElementById('account-created').textContent = formatDate(accountInfo.createdAt);
        document.getElementById('last-password-change').textContent = 
            accountInfo.lastPasswordChange ? formatDate(accountInfo.lastPasswordChange) : 'Never changed';
        
        // Update account status
        const statusElement = document.getElementById('account-status');
        if (accountInfo.isVerified) {
            statusElement.innerHTML = '<i class="fas fa-check-circle"></i> Verified';
            statusElement.className = 'status-badge verified';
        } else {
            statusElement.innerHTML = '<i class="fas fa-exclamation-circle"></i> Unverified';
            statusElement.className = 'status-badge unverified';
        }
    }
    
    // Function to populate basic account info from localStorage
    function populateBasicAccountInfo() {
        document.getElementById('current-email').textContent = userData.email || 'Not available';
        document.getElementById('current-email-input').value = userData.email || '';
        document.getElementById('account-created').textContent = 'Not available';
        document.getElementById('last-password-change').textContent = 'Not available';
    }
    
    // Function to setup form handlers
    function setupFormHandlers() {
        document.getElementById('trusted-contact-form').addEventListener('submit', handleTrustedContactSave);
        document.getElementById('add-trusted-contact').addEventListener('click', showTrustedContactForm);
        document.getElementById('edit-trusted-contact').addEventListener('click', showTrustedContactForm);
        document.getElementById('remove-trusted-contact-view').addEventListener('click', removeTrustedContact);
        document.getElementById('cancel-trusted-contact').addEventListener('click', showTrustedContactView);
        // Change email form
        document.getElementById('change-email-form').addEventListener('submit', handleEmailChange);
        
        // Change password form
        document.getElementById('change-password-form').addEventListener('submit', handlePasswordChange);
        
        // Delete account button
        document.getElementById('delete-account-btn').addEventListener('click', showDeleteModal);
        
        // Delete account form
        document.getElementById('delete-account-form').addEventListener('submit', handleAccountDeletion);
        
        // Email OTP form
        document.getElementById('email-otp-form').addEventListener('submit', handleEmailOTPVerification);
        
        // Resend email OTP
        document.getElementById('resend-email-otp').addEventListener('click', resendEmailOTP);
    }

    async function loadTrustedContact() {
        try {
            const response = await fetch(`${apiConfig.backendApiUrl}/api/trusted-contact`, { headers });
            const data = await response.json();
            if (data.success && data.trustedContact) {
                const contact = data.trustedContact;
                document.getElementById('trusted-contact-name').value = contact.name || '';
                document.getElementById('trusted-contact-relationship').value = contact.relationship || '';
                document.getElementById('trusted-contact-phone').value = contact.phone || '';
                document.getElementById('trusted-contact-email').value = contact.email || '';
                document.getElementById('trusted-contact-consent').checked = contact.emergencyAlertConsent === true;
                renderTrustedContact(contact);
            } else {
                showTrustedContactEmpty();
            }
        } catch (error) {
            if (error?.message) console.error('Error loading trusted contact:', error);
            showTrustedContactEmpty();
        }
    }

    function renderTrustedContact(contact) {
        document.getElementById('trusted-contact-empty').style.display = 'none';
        document.getElementById('add-trusted-contact').style.display = 'none';
        document.getElementById('trusted-contact-details').style.display = 'block';
        document.getElementById('view-trusted-contact-name').textContent = contact.name;
        document.getElementById('view-trusted-contact-relationship').textContent = contact.relationship;
        document.getElementById('view-trusted-contact-phone').textContent = contact.phone;
        document.getElementById('view-trusted-contact-email').textContent = contact.email;
        document.getElementById('view-trusted-contact-consent').textContent = contact.emergencyAlertConsent ? 'Enabled' : 'Disabled';
        setTrustedContactStatus(contact.emergencyAlertConsent ? 'Emergency alerts enabled.' : 'Emergency alerts disabled.');
    }

    function showTrustedContactEmpty() {
        document.getElementById('trusted-contact-empty').style.display = 'block';
        document.getElementById('add-trusted-contact').style.display = 'inline-flex';
        document.getElementById('trusted-contact-details').style.display = 'none';
    }

    function showTrustedContactForm() {
        document.getElementById('trusted-contact-view').style.display = 'none';
        document.getElementById('trusted-contact-form').style.display = 'block';
    }

    function showTrustedContactView() {
        document.getElementById('trusted-contact-view').style.display = 'block';
        document.getElementById('trusted-contact-form').style.display = 'none';
    }

    async function handleTrustedContactSave(event) {
        event.preventDefault();
        const contact = {
            name: document.getElementById('trusted-contact-name').value.trim(),
            relationship: document.getElementById('trusted-contact-relationship').value,
            phone: document.getElementById('trusted-contact-phone').value.trim(),
            email: document.getElementById('trusted-contact-email').value.trim(),
            emergencyAlertConsent: document.getElementById('trusted-contact-consent').checked
        };

        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        try {
            const response = await fetch(`${apiConfig.backendApiUrl}/api/trusted-contact`, {
                method: 'PUT', headers, body: JSON.stringify(contact)
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || 'Could not save trusted contact');
            showSuccess('Trusted contact saved successfully.');
            renderTrustedContact(data.trustedContact);
            showTrustedContactView();
        } catch (error) {
            console.error('Error saving trusted contact:', error);
            showError(error.message);
        } finally {
            submitButton.disabled = false;
        }
    }

    async function removeTrustedContact() {
        try {
            const response = await fetch(`${apiConfig.backendApiUrl}/api/trusted-contact`, { method: 'DELETE', headers });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || 'Could not remove trusted contact');
            document.getElementById('trusted-contact-form').reset();
            showSuccess('Trusted contact removed.');
            showTrustedContactEmpty();
            showTrustedContactView();
        } catch (error) {
            console.error('Error removing trusted contact:', error);
            showError(error.message);
        }
    }

    function setTrustedContactStatus(message) {
        const status = document.getElementById('trusted-contact-status');
        if (status) status.textContent = message;
    }
    
    // Function to setup modal handlers
    function setupModalHandlers() {
        // Setup OTP inputs for email verification
        setupOTPInputs();
    }
    
    // Function to handle email change
    async function handleEmailChange(event) {
        event.preventDefault();
        
        const newEmail = document.getElementById('new-email').value;
        const currentEmail = document.getElementById('current-email-input').value;
        
        if (!newEmail || newEmail === currentEmail) {
            showError('Please enter a valid new email address');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            showError('Please enter a valid email address');
            return;
        }
        
        const submitButton = event.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending OTP...';
        
        try {
            const apiUrl = `${apiConfig.backendApiUrl}/api/settings/change-email`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({ newEmail })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Store new email for OTP verification
                sessionStorage.setItem('newEmail', newEmail);
                showSuccess('Verification code sent to your new email address');
                showOTPModal();
                startEmailOTPTimer();
            } else {
                throw new Error(data.message || 'Failed to send verification code');
            }
        } catch (error) {
            console.error('Error changing email:', error);
            showError(error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    }
    
    // Function to handle password change
    async function handlePasswordChange(event) {
        event.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmNewPassword = document.getElementById('confirm-new-password').value;
        
        // Validation
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            showError('Please fill in all password fields');
            return;
        }
        
        if (newPassword !== confirmNewPassword) {
            showError('New passwords do not match');
            return;
        }
        
        if (newPassword.length < 6) {
            showError('New password must be at least 6 characters long');
            return;
        }
        
        if (newPassword === currentPassword) {
            showError('New password must be different from current password');
            return;
        }
        
        const submitButton = event.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        
        try {
            const apiUrl = `${apiConfig.backendApiUrl}/api/settings/change-password`;
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ currentPassword, newPassword })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                showSuccess('Password updated successfully');
                
                // Clear form
                document.getElementById('current-password').value = '';
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-new-password').value = '';
                
                // Reload account info to update last password change date
                await loadAccountInfo();
            } else {
                throw new Error(data.message || 'Failed to update password');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            showError(error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    }
    
    // Function to handle email OTP verification
    async function handleEmailOTPVerification(event) {
        event.preventDefault();
        
        const otpInputs = document.querySelectorAll('#email-otp-form .otp-input');
        let otp = '';
        
        otpInputs.forEach(input => {
            otp += input.value;
        });
        
        if (otp.length !== 6) {
            showError('Please enter the complete 6-digit code');
            return;
        }
        
        const newEmail = sessionStorage.getItem('newEmail');
        if (!newEmail) {
            showError('Session expired. Please try again');
            closeOTPModal();
            return;
        }
        
        const submitButton = event.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
        
        try {
            const apiUrl = `${apiConfig.backendApiUrl}/api/settings/verify-email-change`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({ newEmail, otp })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                showSuccess('Email address updated successfully');
                
                // Update localStorage with new email
                if (data.userData) {
                    const updatedUserData = { ...userData, ...data.userData };
                    localStorage.setItem('userData', JSON.stringify(updatedUserData));
                    updateProfileInfo(updatedUserData);
                }
                
                // Clear session storage
                sessionStorage.removeItem('newEmail');
                
                // Close modal and reload account info
                closeOTPModal();
                await loadAccountInfo();
                
                // Clear form
                document.getElementById('new-email').value = '';
            } else {
                throw new Error(data.message || 'Failed to verify email');
            }
        } catch (error) {
            console.error('Error verifying email:', error);
            showError(error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    }
    
    // Function to resend email OTP
    async function resendEmailOTP() {
        const newEmail = sessionStorage.getItem('newEmail');
        if (!newEmail) {
            showError('Session expired. Please try again');
            closeOTPModal();
            return;
        }
        
        const resendButton = document.getElementById('resend-email-otp');
        const originalText = resendButton.innerHTML;
        resendButton.disabled = true;
        resendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        
        try {
            const apiUrl = `${apiConfig.backendApiUrl}/api/settings/resend-email-otp`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({ newEmail })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                showSuccess('Verification code sent again');
                startEmailOTPTimer();
            } else {
                throw new Error(data.message || 'Failed to resend verification code');
            }
        } catch (error) {
            console.error('Error resending OTP:', error);
            showError(error.message);
        } finally {
            resendButton.disabled = false;
            resendButton.innerHTML = originalText;
        }
    }
    
    // Function to handle account deletion
    async function handleAccountDeletion(event) {
        event.preventDefault();
        
        const password = document.getElementById('delete-password').value;
        const confirmDelete = document.getElementById('confirm-delete').checked;
        
        if (!password) {
            showError('Please enter your password to confirm deletion');
            return;
        }
        
        if (!confirmDelete) {
            showError('Please confirm that you understand this action is permanent');
            return;
        }
        
        const submitButton = event.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        
        try {
            const apiUrl = `${apiConfig.backendApiUrl}/api/settings/delete-account`;
            const response = await fetch(apiUrl, {
                method: 'DELETE',
                headers,
                body: JSON.stringify({ password })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                showSuccess('Account deleted successfully. You will be redirected to the home page.');
                
                // Clear all data
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                sessionStorage.clear();
                
                // Close modal
                closeDeleteModal();
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                throw new Error(data.message || 'Failed to delete account');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            showError(error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    }
    
    // Modal functions
    function showOTPModal() {
        const modal = document.getElementById('otp-modal');
        modal.classList.add('active');
        
        // Clear OTP inputs
        const otpInputs = document.querySelectorAll('#email-otp-form .otp-input');
        otpInputs.forEach(input => input.value = '');
        
        // Focus first input
        if (otpInputs.length > 0) {
            otpInputs[0].focus();
        }
    }
    
    function closeOTPModal() {
        const modal = document.getElementById('otp-modal');
        modal.classList.remove('active');
        
        // Clear session data
        sessionStorage.removeItem('newEmail');
        
        // Reset timer
        clearOTPTimer();
    }
    
    function showDeleteModal() {
        const modal = document.getElementById('delete-confirmation-modal');
        modal.classList.add('active');
        
        // Clear form
        document.getElementById('delete-password').value = '';
        document.getElementById('confirm-delete').checked = false;
    }
    
    function closeDeleteModal() {
        const modal = document.getElementById('delete-confirmation-modal');
        modal.classList.remove('active');
    }
    
    // Global functions for modal controls
    window.closeOTPModal = closeOTPModal;
    window.closeDeleteModal = closeDeleteModal;
    
    // OTP Timer functions
    let otpTimerInterval;
    
    function startEmailOTPTimer() {
        let seconds = 60;
        const timerElement = document.getElementById('email-timer-countdown');
        const resendButton = document.getElementById('resend-email-otp');
        const timerContainer = document.getElementById('email-otp-timer');
        
        resendButton.style.display = 'none';
        timerContainer.style.display = 'block';
        
        otpTimerInterval = setInterval(() => {
            seconds--;
            timerElement.textContent = seconds;
            
            if (seconds <= 0) {
                clearInterval(otpTimerInterval);
                resendButton.style.display = 'flex';
                timerContainer.style.display = 'none';
            }
        }, 1000);
    }
    
    function clearOTPTimer() {
        if (otpTimerInterval) {
            clearInterval(otpTimerInterval);
            otpTimerInterval = null;
        }
        
        const resendButton = document.getElementById('resend-email-otp');
        const timerContainer = document.getElementById('email-otp-timer');
        
        if (resendButton) resendButton.style.display = 'flex';
        if (timerContainer) timerContainer.style.display = 'none';
    }
    
    // Setup OTP inputs
    function setupOTPInputs() {
        const otpInputs = document.querySelectorAll('.otp-input');
        
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', function(e) {
                // Only allow numbers
                this.value = this.value.replace(/[^0-9]/g, '');
                
                // Auto-focus next input
                if (this.value.length === 1 && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            });
            
            input.addEventListener('keydown', function(e) {
                // Handle backspace
                if (e.key === 'Backspace' && this.value === '' && index > 0) {
                    otpInputs[index - 1].focus();
                }
            });
            
            input.addEventListener('paste', function(e) {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text');
                const numbers = pastedData.replace(/[^0-9]/g, '');
                
                // Fill inputs with pasted numbers
                for (let i = 0; i < Math.min(numbers.length, otpInputs.length - index); i++) {
                    otpInputs[index + i].value = numbers[i];
                }
                
                // Focus next empty input or last input
                const nextIndex = Math.min(index + numbers.length, otpInputs.length - 1);
                otpInputs[nextIndex].focus();
            });
        });
    }
    
    // Utility functions
    function formatDate(dateString) {
        if (!dateString) return 'Not available';
        
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Close modals when clicking outside
    document.addEventListener('click', function(event) {
        const otpModal = document.getElementById('otp-modal');
        const deleteModal = document.getElementById('delete-confirmation-modal');
        
        if (event.target === otpModal) {
            closeOTPModal();
        }
        
        if (event.target === deleteModal) {
            closeDeleteModal();
        }
    });
});