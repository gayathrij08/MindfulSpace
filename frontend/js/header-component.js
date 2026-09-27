(function () {
    const headerHtml = `
<header>
    <div class="container">
        <div class="logo">
            <i class="fas fa-brain"></i>
            <h1>MindfulSpace</h1>
        </div>
        <nav>
            <ul class="nav-links"></ul>
        </nav>
        <div style="display: flex; gap: 15px; align-items: center;">
            <button class="mood-tracker-btn" id="mood-tracker-btn" type="button" aria-label="Mood Tracker">
                <i class="fas fa-chart-line"></i> Mood Tracker
            </button>

            <label class="language-selector" for="language-select">
                <i class="fas fa-globe"></i>
                <select id="language-select" aria-label="Language">
                    <option value="en">🇬🇧 English</option>
                    <option value="kn">ಕನ್ನಡ Kannada</option>
                    <option value="hi">हिन्दी Hindi</option>
                </select>
            </label>

            <div class="auth-buttons-container" style="display: none;">
                <div class="auth-buttons">
                    <button class="btn-secondary" type="button">Login</button>
                    <button class="btn-primary" type="button">Register</button>
                </div>
            </div>

            <div class="user-profile-dropdown" style="display: none;">
                <div class="profile-trigger" id="profile-trigger">
                    <div class="avatar-circle" id="header-avatar">U</div>
                    <span id="header-username">User</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="dropdown-menu" id="profile-dropdown">
                    <a href="profile.html" class="dropdown-item"><i class="fas fa-user"></i> <span data-i18n="user.profile">Profile</span></a>
                    <a href="settings.html" class="dropdown-item"><i class="fas fa-cog"></i> <span data-i18n="user.settings">Settings</span></a>
                    <a href="faq.html" class="dropdown-item"><i class="fas fa-question-circle"></i> <span data-i18n="user.faq">FAQ</span></a>
                    <a href="about.html" class="dropdown-item"><i class="fas fa-info-circle"></i> <span data-i18n="user.about">About</span></a>
                   
                    <div class="dropdown-divider"></div>
                    <a href="#" id="logout-btn" class="dropdown-item"><i class="fas fa-sign-out-alt"></i> <span data-i18n="user.logout">Logout</span></a>
                </div>
            </div>
        </div>
        <div class="hamburger">
            <span></span>
            <span></span>
            <span></span>
        </div>
    </div>
</header>`;

    document.write(headerHtml);
})();
