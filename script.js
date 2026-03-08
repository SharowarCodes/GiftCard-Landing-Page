// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyByLv1PcLvC1TRPSoseg7rY-sqk6VlbZl0",
    authDomain: "gift-card-database-998b4.firebaseapp.com",
    projectId: "gift-card-database-998b4",
    storageBucket: "gift-card-database-998b4.firebasestorage.app",
    messagingSenderId: "820325235794",
    appId: "1:820325235794:web:e0f559e7466e097c33b38b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const popupOverlay = document.getElementById('popupOverlay');
const claimForm = document.getElementById('claimForm');

// Show popup function - make globally accessible
window.showPopup = function() {
    popupOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Hide popup function
function hidePopup() {
    popupOverlay.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Close popup when clicking outside
popupOverlay.addEventListener('click', function(e) {
    if (e.target === popupOverlay) {
        hidePopup();
    }
});

// Handle form submission
claimForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form values
    const email = document.getElementById('email').value.trim().toLowerCase();
    const formData = {
        fullName: document.getElementById('fullName').value.trim(),
        email: email,
        phone: document.getElementById('phone').value.trim(),
        country: document.getElementById('country').value,
        agreement: document.getElementById('agreement').checked,
        timestamp: serverTimestamp(),
        submittedAt: new Date().toISOString(),
        status: 'pending',
        giftCardType: 'Free Gift Card'
    };
    
    // Validate form
    if (!formData.fullName || !formData.email || !formData.phone || !formData.country || !formData.agreement) {
        showNotification('Please fill in all required fields and accept the terms and conditions.', 'error');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showNotification('Please enter a valid email address.', 'error');
        return;
    }
    
    // Phone validation (basic)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    const digitsOnly = formData.phone.replace(/\D/g, '');
    if (!phoneRegex.test(formData.phone) || digitsOnly.length < 10) {
        showNotification('Please enter a valid phone number.', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Checking...';
    submitBtn.disabled = true;
    
    try {
        // Check if email already exists in Firestore
        const q = query(collection(db, "contacts"), where("email", "==", formData.email));
        const querySnapshot = await getDocs(q);
        
        // If email already exists, show error message
        if (!querySnapshot.empty) {
            
            // Get existing submission time (if available)
            let existingTime = "";
            let existingDocId = "";
            querySnapshot.forEach(doc => {
                const data = doc.data();
                existingDocId = doc.id;
                if (data.submittedAt) {
                    const date = new Date(data.submittedAt);
                    existingTime = date.toLocaleString();
                }
            });
            
            // Create strong error message
            const errorMsg = existingTime 
                ? `🚫 DUPLICATE SUBMISSION DETECTED!\n\nEmail: ${formData.email}\nPreviously submitted: ${existingTime}\nDocument ID: ${existingDocId}\n\n⚠️ Each email can only claim ONCE!` 
                : `🚫 DUPLICATE SUBMISSION DETECTED!\n\nEmail: ${formData.email}\n\n⚠️ This email has already been used to claim a gift card.\nEach email can only claim ONCE!`;
            
            // Show prominent error notification
            showDuplicateError(errorMsg);
            
            // Highlight email field with strong red border
            const emailField = document.getElementById('email');
            emailField.style.border = '3px solid #dc2626';
            emailField.style.backgroundColor = '#fef2f2';
            emailField.focus();
            
            // Add shake animation to email field
            emailField.style.animation = 'shake 0.5s';
            setTimeout(() => {
                emailField.style.animation = '';
            }, 500);
            
            // Reset field styles after 5 seconds
            setTimeout(() => {
                emailField.style.border = '';
                emailField.style.backgroundColor = '';
            }, 5000);
            
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }
        
        // Email is unique, proceed with submission
        submitBtn.textContent = 'Submitting...';
        
        // Save to Firebase Firestore
        const docRef = await addDoc(collection(db, "contacts"), formData);
        
        // Success
        showNotification('🎉 Congratulations! Your free gift card claim has been submitted successfully!', 'success');
        claimForm.reset();
        hidePopup();
        
        // Show success message
        showSuccessMessage();
        
    } catch (error) {
        console.error("Error adding document: ", error);
        showNotification('Done ,Already Submitted', 'error');
        
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Show notification function
function showNotification(message, type = 'success') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Show duplicate error notification
function showDuplicateError(message) {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create prominent error notification
    const notification = document.createElement('div');
    notification.className = 'notification duplicate-error';
    notification.innerHTML = `
        <div class="notification-content">
            <div class="duplicate-icon">🚫</div>
            <div class="duplicate-message">${message.replace(/\n/g, '<br>')}</div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 8 seconds (longer for duplicate errors)
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, 300);
    }, 8000);
}

// Show success message
function showSuccessMessage() {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <div class="success-content">
            <h3>🎉 Success!</h3>
            <p>Your gift card claim has been submitted. Check your email for confirmation.</p>
        </div>
    `;
    
    document.body.appendChild(successDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        successDiv.style.animation = 'slideOutRight 0.5s ease';
        setTimeout(() => {
            if (document.body.contains(successDiv)) {
                successDiv.remove();
            }
        }, 500);
    }, 5000);
}

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.image-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        observer.observe(el);
    });
    
    // Show popup after a short delay
    setTimeout(() => {
        showPopup();
    }, 1000);
    
    // Add loading animation
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Form field animations
document.querySelectorAll('.form-group input, .form-group select').forEach(field => {
    field.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
        this.parentElement.style.transition = 'transform 0.2s ease';
    });
    
    field.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
});

// Add hover effect to cards
document.querySelectorAll('.image-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .success-message h3 {
        margin: 0 0 10px 0;
        font-size: 18px;
        font-weight: 700;
    }
    
    .success-message p {
        margin: 0;
        font-size: 14px;
        opacity: 0.9;
    }
`;
document.head.appendChild(style);

// Prevent form resubmission on page refresh
if (window.history.replaceState) {
    window.history.replaceState(null, null, window.location.href);
}

// Add keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !popupOverlay.classList.contains('hidden')) {
        hidePopup();
    }
});

// Button click effects
document.querySelectorAll('.main-btn, .card-btn').forEach(button => {
    button.addEventListener('click', function(e) {
        // Create ripple effect
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Add ripple effect CSS
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .main-btn, .card-btn {
        position: relative;
        overflow: hidden;
    }
`;
document.head.appendChild(rippleStyle);
