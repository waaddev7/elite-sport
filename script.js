/* =========================================
   1. وظائف عند تحميل الصفحة (Initialization)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    updateHeaderUI();    // تحديث الهيدر (Welcome)
    updateCartCount();   // تحديث عداد السلة
    initHeroAnimation(); // أنيميشن الهيرو
    setupFeedbackForm(); // تشغيل نظام الفيدباك (هاد اللي كان ناقص)
});

/* =========================================
   2. نظام الفيدباك (Feedback System)
   ========================================= */
function setupFeedbackForm() {
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackList = document.getElementById('feedback-list');

    if (feedbackForm) {
        feedbackForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const name = document.getElementById('user-name').value;
            const message = document.getElementById('user-message').value;
            const rating = parseInt(document.getElementById('user-rating').value); // تحويل النص لرقم

            // --- توليد 5 نجوم احترافية ---
            let starsHtml = "";
            for(let i = 1; i <= 5; i++) {
                if (i <= rating) {
                    // نجمة ملونة
                    starsHtml += `<span style="color: #ff6b35;">★</span>`;
                } else {
                    // نجمة باهتة (رمادية) لإكمال الـ 5
                    starsHtml += `<span style="color: #e0e0e0;">★</span>`;
                }
            }

            const card = document.createElement('div');
            card.className = 'wow-card';
            
            card.innerHTML = `
                <div class="card-quote">“</div>
                <div class="stars" style="font-size: 20px; margin-bottom: 15px;">${starsHtml}</div>
                <p style="color: #1d1d1f !important; font-weight: 600; margin-bottom: 20px;">${message}</p>
                <div class="user-meta" style="display: flex; align-items: center; gap: 15px; border-top: 1px solid #f0f0f0; padding-top: 15px;">
                    <img src="https://ui-avatars.com/api/?name=${name}&background=ff6b35&color=fff" style="width: 45px; height: 45px; border-radius: 50%;">
                    <div>
                        <h4 style="color: #000 !important; font-weight: 800; font-size: 15px;">${name}</h4>
                        <span style="color: #888 !important; font-size: 12px;">Verified Athlete</span>
                    </div>
                </div>
            `;

            feedbackList.prepend(card);
            this.reset();
            alert("Feedback added successfully! ⭐");
        });
    }
}

/* =========================================
   3. نظام الهوية والدخول (Welcome UI)
   ========================================= */
function updateHeaderUI() {
    const authArea = document.getElementById('user-auth-area');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userName = localStorage.getItem('userName');

    if (isLoggedIn === 'true' && userName && authArea) {
        authArea.innerHTML = `
            <a href="profile.html" class="user-link-item">
                <i class="fa-solid fa-circle-user" style="color:#ff6b35;"></i>
                <span>Welcome, <span style="color:#ff6b35;">${userName}</span></span>
            </a>
        `;
    }
}

/* =========================================
   4. عداد السلة (Cart Badge)
   ========================================= */
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const countBadge = document.getElementById('cart-count');
    if (countBadge) countBadge.innerText = cart.length;
}

/* =========================================
   5. تأثير السكرول (Scroll Effect)
   ========================================= */
window.addEventListener('scroll', function() {
    const header = document.getElementById('main-header');
    if (header) {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
});

function initHeroAnimation() {
    const content = document.querySelector('.hero-content');
    if (content) {
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
    }
}

// دالة تسجيل الخروج
function logout() {
    if (confirm("Logout?")) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const menuIcon = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (menuIcon) {
        menuIcon.addEventListener('click', () => {
            // تبديل ظهور القائمة
            navLinks.classList.toggle('active');
            
            // تغيير شكل الأيقونة من (bars) إلى (X)
            const icon = menuIcon.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-xmark');
        });
    }
});