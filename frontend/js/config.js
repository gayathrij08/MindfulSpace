// Configuration for API URLs
(function() {
    // Set environment configuration based on hostname
    const isLocalDevelopment = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1';

    const productionApiUrl = 'https://MindfulSpace-evbkexexh2azcgfc.centralindia-01.azurewebsites.net';
    
    if (isLocalDevelopment) {
        // Development environment
        window.ENV_API_URL = 'http://localhost:5001';
        console.log('Running in development mode');
    } else {
        // Production environment
        window.ENV_API_URL = productionApiUrl;
        console.log('Running in production mode');
    }
    
    console.log('API URL configured:', window.ENV_API_URL);
    
    // Set up global configuration object
    window.ENV_CONFIG = {
        // API URLs
        backendApiUrl: window.ENV_API_URL,
        mlServiceUrl: `${window.ENV_API_URL}/api/mood/analyze`
    };
})();
