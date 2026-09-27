(function () {
    const translations = {
        en: {
            nav: { home: 'Home', dashboard: 'Dashboard', ai: 'AI-Support', mental: 'Mental Health', appointment: 'Appointment', mood: 'Mood Tracker', resources: 'Resources' },
            hero: { title: 'Your Mental Wellbeing Matters', description: 'A safe, confidential space for students to access mental health resources, counseling services, and peer support - all in one place.', cta: 'Get Started' },
            about: { title: 'About MindfulSpace', heading: "Empowering Students' Mental Wellness", description: 'MindfulSpace is a comprehensive mental health platform dedicated to supporting students across India. We bridge the gap between students facing mental health challenges and professional support systems.', mission: 'Our mission is to create a stigma-free environment where every student can access quality mental health resources, counseling services, and peer support.' },
            services: { title: 'Our Services' },
            resources: { title: 'Explore Free Mental Health Resources', description: 'Find calming sounds, educational videos, awareness posters, and more to support your mental well-being.' },
            user: { profile: 'Profile', settings: 'Settings', faq: 'FAQ', about: 'About', logout: 'Logout' }
        },
        kn: {
            nav: { home: 'ಮುಖಪುಟ', dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', ai: 'AI ಸಹಾಯ', mental: 'ಮಾನಸಿಕ ಆರೋಗ್ಯ', appointment: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್', mood: 'ಮನಸ್ಥಿತಿ ಟ್ರ್ಯಾಕರ್', resources: 'ಸಂಪನ್ಮೂಲಗಳು' },
            hero: { title: 'ನಿಮ್ಮ ಮಾನಸಿಕ ಯೋಗಕ್ಷೇಮ ಮುಖ್ಯವಾಗಿದೆ', description: 'ವಿದ್ಯಾರ್ಥಿಗಳು ಮಾನಸಿಕ ಆರೋಗ್ಯ ಸಂಪನ್ಮೂಲಗಳು, ಸಮಾಲೋಚನಾ ಸೇವೆಗಳು ಮತ್ತು ಸಹಪಾಠಿಗಳ ಬೆಂಬಲವನ್ನು ಒಂದೇ ಸ್ಥಳದಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ಮತ್ತು ಗೌಪ್ಯವಾಗಿ ಪಡೆಯಲು ಸಹಾಯಕವಾಗುವ ಸ್ಥಳ.', cta: 'ಪ್ರಾರಂಭಿಸಿ' },
            about: { title: 'MindfulSpace ಬಗ್ಗೆ', heading: 'ವಿದ್ಯಾರ್ಥಿಗಳ ಮಾನಸಿಕ ಯೋಗಕ್ಷೇಮಕ್ಕೆ ಬೆಂಬಲ', description: 'MindfulSpace ಭಾರತದೆಲ್ಲೆಡೆ ವಿದ್ಯಾರ್ಥಿಗಳ ಮಾನಸಿಕ ಆರೋಗ್ಯಕ್ಕೆ ಬೆಂಬಲ ನೀಡುವ ಸಮಗ್ರ ವೇದಿಕೆಯಾಗಿದೆ.', mission: 'ಪ್ರತಿ ವಿದ್ಯಾರ್ಥಿಗೂ ಗುಣಮಟ್ಟದ ಮಾನಸಿಕ ಆರೋಗ್ಯ ಸಂಪನ್ಮೂಲಗಳು ಮತ್ತು ಬೆಂಬಲ ದೊರೆಯುವ ಕಳಂಕಮುಕ್ತ ವಾತಾವರಣವನ್ನು ಸೃಷ್ಟಿಸುವುದು ನಮ್ಮ ಉದ್ದೇಶ.' },
            services: { title: 'ನಮ್ಮ ಸೇವೆಗಳು' },
            resources: { title: 'ಉಚಿತ ಮಾನಸಿಕ ಆರೋಗ್ಯ ಸಂಪನ್ಮೂಲಗಳನ್ನು ಅನ್ವೇಷಿಸಿ', description: 'ನಿಮ್ಮ ಮಾನಸಿಕ ಯೋಗಕ್ಷೇಮಕ್ಕೆ ಸಹಾಯ ಮಾಡುವ ಶಾಂತಗೊಳಿಸುವ ಧ್ವನಿಗಳು, ಶೈಕ್ಷಣಿಕ ವೀಡಿಯೊಗಳು ಮತ್ತು ಇನ್ನಷ್ಟು ಸಂಪನ್ಮೂಲಗಳನ್ನು ಕಂಡುಕೊಳ್ಳಿ.' },
            user: { profile: 'ಪ್ರೊಫೈಲ್', settings: 'ಸೆಟ್ಟಿಂಗ್ಸ್', faq: 'FAQ', about: 'ನಮ್ಮ ಬಗ್ಗೆ', logout: 'ಲಾಗ್‌ಔಟ್' }
        },
        hi: {
            nav: { home: 'होम', dashboard: 'डैशबोर्ड', ai: 'AI सहायता', mental: 'मानसिक स्वास्थ्य', appointment: 'अपॉइंटमेंट', mood: 'मूड ट्रैकर', resources: 'संसाधन' },
            hero: { title: 'आपका मानसिक स्वास्थ्य महत्वपूर्ण है', description: 'छात्रों के लिए मानसिक स्वास्थ्य संसाधनों, परामर्श सेवाओं और सहकर्मी सहायता तक सुरक्षित और गोपनीय तरीके से एक ही स्थान पर पहुँचने के लिए एक सहायक स्थान।', cta: 'शुरू करें' },
            about: { title: 'MindfulSpace के बारे में', heading: 'छात्रों के मानसिक स्वास्थ्य को सशक्त बनाना', description: 'MindfulSpace भारत भर के छात्रों के मानसिक स्वास्थ्य का समर्थन करने वाला एक व्यापक मंच है।', mission: 'हमारा उद्देश्य ऐसा कलंक-मुक्त वातावरण बनाना है जहाँ हर छात्र को गुणवत्तापूर्ण मानसिक स्वास्थ्य संसाधन और सहायता मिल सके।' },
            services: { title: 'हमारी सेवाएँ' },
            resources: { title: 'निःशुल्क मानसिक स्वास्थ्य संसाधन खोजें', description: 'अपने मानसिक स्वास्थ्य के लिए शांत संगीत, शैक्षिक वीडियो और उपयोगी संसाधन खोजें।' },
            user: { profile: 'प्रोफ़ाइल', settings: 'सेटिंग्स', faq: 'FAQ', about: 'हमारे बारे में', logout: 'लॉगआउट' }
        }
    };

    function getValue(language, key) {
        return key.split('.').reduce((value, part) => value?.[part], translations[language]) || key;
    }

    function applyLanguage(language) {
        const selected = translations[language] ? language : 'en';
        document.documentElement.lang = selected === 'kn' ? 'kn' : selected;
        document.querySelectorAll('[data-i18n]').forEach(element => {
            element.textContent = getValue(selected, element.dataset.i18n);
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            element.placeholder = getValue(selected, element.dataset.i18nPlaceholder);
        });
        localStorage.setItem('mindfulspace_language', selected);
        const selector = document.getElementById('language-select');
        if (selector) selector.value = selected;
        window.dispatchEvent(new CustomEvent('mindfulspace-language-changed', { detail: selected }));
    }

    function setup() {
        const selector = document.getElementById('language-select');
        if (selector) selector.addEventListener('change', event => applyLanguage(event.target.value));
        applyLanguage(localStorage.getItem('mindfulspace_language') || 'en');
    }

    window.MindfulSpaceI18n = { translations, getLanguage: () => localStorage.getItem('mindfulspace_language') || 'en', applyLanguage };
    document.addEventListener('DOMContentLoaded', setup);
})();
