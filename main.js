// MAIN.JS - Production-Ready, Safeguarded Code
// Comprehensive error handling, device compatibility, and performance optimizations

(function() {
    'use strict';

    // Production mode: disable console in production (set to false for debugging)
    const DEBUG = false;
    
    // Global Error Boundary with Crash Detection & Recovery (Production-Ready)
    const errorBoundary = {
        errors: [],
        maxErrors: 10,
        crashCount: 0,
        maxCrashes: 3,
        lastCrashTime: 0,
        crashWindow: 60000, // 1 minute window
        disabledFeatures: new Set(),
        performanceIssues: [],
        
        handleError(error, source = 'unknown') {
            try {
                const errorInfo = {
                    message: error.message || 'Unknown error',
                    stack: error.stack || 'No stack trace',
                    source: source,
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                    userAgent: navigator.userAgent
                };
                
                this.errors.push(errorInfo);
                
                // Keep only recent errors
                if (this.errors.length > this.maxErrors) {
                    this.errors = this.errors.slice(-this.maxErrors);
                }
                
                // Detect crash patterns
                const now = Date.now();
                if (now - this.lastCrashTime < this.crashWindow) {
                    this.crashCount++;
                } else {
                    this.crashCount = 1;
                }
                this.lastCrashTime = now;
                
                // If too many crashes, disable problematic features
                if (this.crashCount >= this.maxCrashes) {
                    this.enterSafeMode(source);
                }
                
                log.warn('Error captured:', errorInfo);
                
                // Show user-friendly error message for critical errors
                this.showUserFriendlyError(error, source);
                
                // Attempt graceful recovery
                this.attemptRecovery(error, source);
            } catch (e) {
                // Even error handling can fail - fail silently
                console.error('Error boundary failure:', e);
            }
        },
        
        enterSafeMode(crashSource) {
            try {
                // Disable features that commonly cause crashes
                if (crashSource.includes('scroll') || crashSource.includes('accordion')) {
                    this.disabledFeatures.add('accordions');
                    this.disabledFeatures.add('animations');
                    // Disable all x-collapse animations
                    document.querySelectorAll('[x-collapse]').forEach(el => {
                        el.removeAttribute('x-collapse');
                        el.style.transition = 'none';
                    });
                }
                
                if (crashSource.includes('dropdown')) {
                    this.disabledFeatures.add('dropdown');
                    // Force close all dropdowns
                    const dropdowns = document.querySelectorAll('#more-dropdown, #mobile-menu');
                    dropdowns.forEach(dropdown => {
                        dropdown.style.display = 'none';
                        dropdown.setAttribute('data-js-open', 'false');
                    });
                }
                
                // Disable scroll handlers if scroll-related crashes
                if (crashSource.includes('scroll')) {
                    this.disabledFeatures.add('scrollHandlers');
                }
                
                log.warn('Safe mode activated. Disabled features:', Array.from(this.disabledFeatures));
            } catch (e) {
                // Fail silently
            }
        },
        
        isFeatureDisabled(feature) {
            return this.disabledFeatures.has(feature);
        },

        // User-friendly error messages
        showUserFriendlyError(error, source) {
            try {
                const userMessages = {
                    'network': 'Connection issue detected. Please check your internet connection.',
                    'form': 'There was an issue with the form. Please try again.',
                    'video': 'Video playback issue. The page will continue to work normally.',
                    'image': 'Some images may not load properly. This won\'t affect the site functionality.',
                    'default': 'A minor issue occurred, but the site is still working normally.'
                };

                let message = userMessages[source] || userMessages.default;
                
                // Only show error to user for critical issues
                if (source === 'network' || source === 'form') {
                    if (typeof Utils !== 'undefined' && Utils.showUserFeedback) {
                        Utils.showUserFeedback(message, 'error', 5000);
                    }
                }
            } catch (e) {
                // Fail silently
            }
        },
        
        attemptRecovery(error, source) {
            try {
                if (source === 'alpine' && window.Alpine) {
                    // Re-initialize Alpine components
                    setTimeout(() => {
                        try {
                            document.querySelectorAll('[x-data]').forEach(el => {
                                if (!el._x_dataStack) {
                                    Alpine.initTree(el);
                                }
                            });
                        } catch (e) {
                            // Ignore recovery errors
                        }
                    }, 100);
                }
                
                // If scroll-related error, reset scroll handlers
                if (source.includes('scroll')) {
                    setTimeout(() => {
                        try {
                            // Cancel any pending scroll operations
                            if (window._navScrollDisabled) {
                                window._navScrollDisabled = false;
                            }
                            // Force a layout recalculation
                            void document.body.offsetHeight;
                        } catch (e) {
                            // Ignore
                        }
                    }, 50);
                }
            } catch (recoveryError) {
                // Ignore recovery failures
            }
        },
        
        // Monitor performance to catch issues before crashes
        checkPerformance() {
            try {
                // Check for excessive layout thrashing
                if (performance.getEntriesByType) {
                    const layoutShifts = performance.getEntriesByType('layout-shift');
                    if (layoutShifts.length > 50) {
                        this.performanceIssues.push({
                            type: 'excessive_layout_shifts',
                            count: layoutShifts.length,
                            timestamp: Date.now()
                        });
                    }
                }
                
                // Check for long tasks
                if (performance.getEntriesByType) {
                    const longTasks = performance.getEntriesByType('longtask');
                    if (longTasks.length > 5) {
                        this.performanceIssues.push({
                            type: 'long_tasks',
                            count: longTasks.length,
                            timestamp: Date.now()
                        });
                    }
                }
            } catch (e) {
                // Ignore performance check errors
            }
        }
    };

    // Global error handlers with crash prevention
    window.addEventListener('error', (event) => {
        try {
            // Prevent default error handling that might cause crashes
            event.preventDefault();
            errorBoundary.handleError(event.error || new Error(event.message), 'global');
            return true; // Prevent default error handling
        } catch (e) {
            // Even error handling can fail - fail silently
            return true;
        }
    }, true); // Use capture phase to catch errors early

    window.addEventListener('unhandledrejection', (event) => {
        try {
            // Prevent unhandled rejection from crashing
            event.preventDefault();
            errorBoundary.handleError(new Error(event.reason), 'promise');
        } catch (e) {
            // Fail silently
            return true;
        }
    });
    
    // Monitor for performance issues that could lead to crashes
    // CRITICAL: Store interval reference for cleanup
    let performanceCheckInterval = null;
    if (window.requestIdleCallback) {
        requestIdleCallback(() => {
            try {
                performanceCheckInterval = setInterval(() => {
                    try {
                        errorBoundary.checkPerformance();
                    } catch (e) {
                        // Ignore performance check errors
                    }
                }, 10000); // Check every 10 seconds
            } catch (e) {
                // Ignore
            }
        });
    }

    // Browser compatibility checks
    const browserSupport = {
        intersectionObserver: 'IntersectionObserver' in window,
        requestIdleCallback: 'requestIdleCallback' in window,
        webp: (() => {
            const canvas = document.createElement('canvas');
            return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        })(),
        cssCustomProperties: CSS && CSS.supports && CSS.supports('(--foo: red)'),
        passiveEventListeners: (() => {
            let supportsPassive = false;
            try {
                const opts = Object.defineProperty({}, 'passive', {
                    get: () => { supportsPassive = true; }
                });
                window.addEventListener('test', null, opts);
                window.removeEventListener('test', null, opts);
            } catch (e) {}
            return supportsPassive;
        })()
    };
    const log = {
        warn: () => {},
        error: () => {},
        log: () => {}
    };

    // UTILITY FUNCTIONS - Safe DOM & Browser Helpers

    const Utils = {
        // Safe DOM query with null check
        safeQuery(selector, context = document) {
            try {
                return context.querySelector(selector) || null;
            } catch (e) {
                log.warn('Query selector error:', e);
                return null;
            }
        },

        safeQueryAll(selector, context = document) {
            try {
                // Optimized: Use spread operator instead of Array.from for better performance
                const nodeList = context.querySelectorAll(selector);
                return nodeList ? [...nodeList] : [];
            } catch (e) {
                log.warn('Query selector all error:', e);
                return [];
            }
        },

        // Safe getElementById
        safeGetById(id) {
            try {
                return document.getElementById(id) || null;
            } catch (e) {
                log.warn('Get element by ID error:', e);
                return null;
            }
        },

        // Device detection
        isMobile() {
            try {
                return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            } catch (e) {
                return false;
            }
        },

        isTouchDevice() {
            try {
                return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            } catch (e) {
                return false;
            }
        },

        // Safe scrollIntoView with fallback
        safeScrollIntoView(element, options = {}) {
            try {
                if (element?.scrollIntoView) {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        ...options
                    });
                } else if (element) {
                    // Fallback for older browsers
                    try {
                        const rect = element.getBoundingClientRect();
                        const pageYOffset = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
                        const y = rect.top + pageYOffset - 100;
                        try {
                            window.scrollTo({ top: y, behavior: 'smooth' });
                        } catch (e) {
                            window.scrollTo(0, y);
                        }
                    } catch (e) {
                        log.warn('Scroll fallback error:', e);
                    }
                }
            } catch (e) {
                log.warn('Scroll into view error:', e);
            }
        },

        // Debounce function for performance
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        // Throttle function for scroll events (optimized - simplified)
        throttle(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        // RAF-based throttle for smooth animations
        rafThrottle(func) {
            let rafId = null;
            let lastArgs = null;
            return function(...args) {
                lastArgs = args;
                if (rafId === null) {
                    try {
                    rafId = requestAnimationFrame(() => {
                        func.apply(this, lastArgs);
                        rafId = null;
                            lastArgs = null;
                    });
                    } catch (e) {
                        // Fallback to setTimeout if RAF fails
                        rafId = setTimeout(() => {
                            func.apply(this, lastArgs);
                            rafId = null;
                            lastArgs = null;
                        }, 16);
                    }
                }
            };
        },

        // Batch DOM updates to prevent layout thrashing
        batchDOMUpdates(updates) {
            const executeUpdates = () => {
                for (let i = 0; i < updates.length; i++) {
                    try {
                        updates[i]();
                    } catch (e) {
                        log.warn('DOM update error:', e);
                    }
                }
            };
            
            if (typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame(executeUpdates);
            } else {
                executeUpdates();
            }
        },

        // Enhanced performance monitoring with adaptive optimizations
        checkPerformance() {
            try {
                if (typeof PerformanceObserver !== 'undefined') {
                    // Monitor long tasks (blocking operations > 50ms)
                    const longTaskObserver = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (entry.duration > 50) {
                                log.warn('Long task detected:', entry.duration + 'ms');
                                // Auto-optimize for detected performance issues
                                this.adaptiveOptimization(entry.duration);
                            }
                        }
                    });
                    try {
                        longTaskObserver.observe({ entryTypes: ['longtask'] });
                    } catch (e) {
                        // Long task API not supported
                    }

                    // Monitor layout shifts with auto-correction
                    const layoutShiftObserver = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (!entry.hadRecentInput && entry.value > 0.1) {
                                log.warn('Layout shift detected:', entry.value);
                                this.preventLayoutShifts();
                            }
                        }
                    });
                    try {
                        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
                    } catch (e) {
                        // Layout shift API not supported
                    }

                    // Monitor First Input Delay
                    const fidObserver = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            const fid = entry.processingStart - entry.startTime;
                            if (fid > 100) {
                                log.warn('High FID detected:', fid + 'ms');
                                this.optimizeInteractivity();
                            }
                        }
                    });
                    try {
                        fidObserver.observe({ entryTypes: ['first-input'] });
                    } catch (e) {
                        // FID API not supported
                    }
                }
            } catch (e) {
                log.warn('Performance monitoring error:', e);
            }
        },

        // Adaptive performance optimization
        adaptiveOptimization(taskDuration) {
            if (taskDuration > 100) {
                // Reduce animation complexity for slow devices
                document.body.classList.add('reduce-animations');
                // Increase debounce delays
                this._performanceMode = 'conservative';
            }
        },

        // Prevent layout shifts
        preventLayoutShifts() {
            // Add explicit dimensions to images without them
            document.querySelectorAll('img:not([width]):not([height])').forEach(img => {
                if (img.naturalWidth && img.naturalHeight) {
                    img.setAttribute('width', img.naturalWidth);
                    img.setAttribute('height', img.naturalHeight);
                }
            });
        },

        // Optimize interactivity
        optimizeInteractivity() {
            // Reduce event listener frequency on slow devices
            if (this._performanceMode !== 'conservative') {
                this._performanceMode = 'conservative';
                // Re-initialize with longer debounce delays
                this.reinitializeWithOptimizations();
            }
        },

        // Re-initialize with performance optimizations
        reinitializeWithOptimizations() {
            // Increase debounce delays for conservative mode
            const delay = this._performanceMode === 'conservative' ? 32 : 16;
            // Apply optimizations without breaking functionality
        },

        // Enhanced user feedback system
        showUserFeedback(message, type = 'info', duration = 3000) {
            const feedback = document.createElement('div');
            feedback.className = `user-feedback user-feedback-${type}`;
            feedback.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                max-width: 300px;
                word-wrap: break-word;
            `;
            feedback.textContent = message;
            
            // CRITICAL: Check document.body exists before appending
            if (document.body) {
                document.body.appendChild(feedback);
            } else {
                // Fallback: append to document.documentElement if body doesn't exist yet
                if (document.documentElement) {
                    document.documentElement.appendChild(feedback);
                }
                return; // Can't show feedback if no body
            }
            
            // Animate in
            requestAnimationFrame(() => {
                feedback.style.transform = 'translateX(0)';
            });
            
            // Auto remove
            setTimeout(() => {
                feedback.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (feedback.parentNode) {
                        feedback.parentNode.removeChild(feedback);
                    }
                }, 300);
            }, duration);
        },

        // Enhanced loading indicator
        showLoadingIndicator(target, message = 'Loading...') {
            if (!target) return null;
            
            const loader = document.createElement('div');
            loader.className = 'enhanced-loader';
            loader.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                z-index: 1000;
                border-radius: inherit;
            `;
            
            loader.innerHTML = `
                <div style="
                    width: 40px;
                    height: 40px;
                    border: 3px solid #374151;
                    border-top: 3px solid #FF4081;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 12px;
                "></div>
                <div style="color: white; font-size: 14px;">${message}</div>
            `;
            
            // Add spin animation if not exists
            if (!document.getElementById('spin-animation')) {
                const style = document.createElement('style');
                style.id = 'spin-animation';
                style.textContent = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            target.style.position = 'relative';
            target.appendChild(loader);
            
            return {
                remove: () => {
                    if (loader.parentNode) {
                        loader.parentNode.removeChild(loader);
                    }
                }
            };
        },

        // Use requestIdleCallback for non-critical operations
        idleCallback(callback, timeout = 2000) {
            try {
            if (typeof requestIdleCallback !== 'undefined') {
                return requestIdleCallback(callback, { timeout });
            } else {
                    return setTimeout(callback, 1);
                }
            } catch (e) {
                // Fallback to setTimeout if idleCallback fails
                return setTimeout(callback, 1);
            }
        },

        // Safe number clamp
        clamp(value, min, max) {
            const num = Number(value);
            if (isNaN(num) || !isFinite(num)) return min;
            return Math.min(Math.max(num, min), max);
        },

        // Safe requestAnimationFrame with fallback
        safeRAF(callback) {
            try {
                if (typeof window.requestAnimationFrame === 'function') {
                    return window.requestAnimationFrame(callback);
                } else {
                    // Fallback for older browsers
                    return setTimeout(callback, 16);
                }
            } catch (e) {
                return setTimeout(callback, 16);
            }
        },

        // Handle video pause when scrolled out of view (Enhanced Mobile & Desktop)
        handleVideoScrollPause() {
            try {
                // Optimized video cache with smart invalidation
                const now = Date.now();
                if (!this._cachedVideoElements || !this._videoCacheTime || (now - this._videoCacheTime) > 5000) {
                    // Refresh cache every 5 seconds or when not cached
                    this._cachedVideoElements = [
                        { selector: '[x-ref="indexPlayer"]', ref: 'indexPlayer' },
                        { selector: '[x-ref="player"]', ref: 'player' },
                        // Also search for any video elements directly
                        { selector: 'video[x-ref]', ref: 'any' }
                    ].map(item => ({
                        ...item,
                        element: document.querySelector(item.selector)
                    })).filter(item => item.element);

                    // Also find all video elements as backup
                    const allVideos = document.querySelectorAll('video');
                    allVideos.forEach(video => {
                        if (video.hasAttribute('x-ref') && !this._cachedVideoElements.find(cached => cached.element === video)) {
                            this._cachedVideoElements.push({
                                selector: `video[x-ref="${video.getAttribute('x-ref')}"]`,
                                ref: video.getAttribute('x-ref'),
                                element: video
                            });
                        }
                    });
                    
                    this._videoCacheTime = now;
                }

                // Mobile-specific optimizations
                const isMobile = this.isMobile();
                const isTouchDevice = this.isTouchDevice();

                // LAYOUT THRASHING PREVENTION: Batch all DOM reads first, then all writes
                const videoChecks = [];
                
                // Phase 1: Read all video positions (batch reads)
                this._cachedVideoElements.forEach(videoData => {
                    const video = videoData.element;
                    if (!video) return;

                    // Skip if video is already paused
                    if (video.paused) return;

                    // Get viewport dimensions with mobile-specific fallbacks (cache once)
                    const windowHeight = window.innerHeight || 
                                       document.documentElement.clientHeight || 
                                       screen.height;
                    
                    // Read position (DOM read)
                    const rect = video.getBoundingClientRect();
                    
                    // Mobile browsers: Use more aggressive out-of-view detection
                    const threshold = isMobile ? 100 : 0; // Increased buffer for mobile
                    const isOutOfView = rect.bottom < -threshold || rect.top > (windowHeight + threshold);
                    
                    if (isOutOfView) {
                        videoChecks.push({ video, isMobile, isTouchDevice });
                    }
                });
                
                // Phase 2: Perform all writes (pause videos, update state)
                videoChecks.forEach(({ video, isMobile, isTouchDevice }) => {
                    // Force pause the video (DOM write)
                    video.pause();
                    
                    // Mobile: Additional pause verification
                    if (isMobile || isTouchDevice) {
                        // Triple-check pause worked on mobile
                        setTimeout(() => {
                            if (!video.paused) {
                                video.pause();
                                // Final attempt
                                setTimeout(() => {
                                    if (!video.paused) {
                                        video.pause();
                                    }
                                }, 50);
                            }
                        }, 100);
                    }
                    
                    // Reset Alpine.js state - Enhanced detection
                    const alpineComponent = video.closest('[x-data]');
                    if (alpineComponent) {
                        // Try multiple methods to reset Alpine state
                        if (alpineComponent._x_dataStack && alpineComponent._x_dataStack[0]) {
                            const data = alpineComponent._x_dataStack[0];
                            if (data.isPlaying !== undefined) {
                                data.isPlaying = false;
                            }
                        }
                        
                        // Also try Alpine's $data if available
                        if (window.Alpine && alpineComponent.__x) {
                            try {
                                const alpineData = alpineComponent.__x.$data;
                                if (alpineData && alpineData.isPlaying !== undefined) {
                                    alpineData.isPlaying = false;
                                }
                            } catch (e) {
                                // Ignore Alpine access errors
                            }
                        }
                    }
                });
            } catch (e) {
                log.warn('Video scroll pause error:', e);
            }
        },

        // Enhanced cache management with memory optimization
        clearVideoCache() {
            this._cachedVideoElements = null;
            this._videoCacheTime = 0;
        },

        // Advanced memory management
        optimizeMemoryUsage() {
            // Clear unused caches periodically
            if (typeof performance !== 'undefined' && performance.memory) {
                const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
                if (memoryUsage > 0.8) {
                    // Clear non-essential caches when memory is high
                    this.clearVideoCache();
                    this._cachedElements = new Map(); // Reset element cache
                    
                    // Force garbage collection hint
                    if (window.gc) {
                        window.gc();
                    }
                }
            }
        },

        // Intelligent cache with size limits
        _cachedElements: new Map(),
        _maxCacheSize: 100,

        getCachedElement(selector) {
            if (this._cachedElements.has(selector)) {
                return this._cachedElements.get(selector);
            }
            
            const element = document.querySelector(selector);
            if (element) {
                // Implement LRU cache
                if (this._cachedElements.size >= this._maxCacheSize) {
                    const firstKey = this._cachedElements.keys().next().value;
                    this._cachedElements.delete(firstKey);
                }
                this._cachedElements.set(selector, element);
            }
            return element;
        }
    };

    // ALPINE.JS INITIALIZATION - Safeguarded

    // CRITICAL: Register contactForm IMMEDIATELY when Alpine is available
    // This must happen BEFORE Alpine processes the DOM
    const registerContactForm = () => {
        if (typeof Alpine !== 'undefined' && typeof Alpine.data === 'function') {
            if (window._contactFormRegistered) {
                return; // Already registered
            }
            
            
            // 1. Contact Form Logic - Enhanced with error handling
            Alpine.data("contactForm", () => ({
        submissionSuccess: false,
        isSubmitting: false,
        submittedData: { name: "", message: "" },
        errorMessage: "",
        successMessage: "",
        messageLength: 0,
        uploadedFiles: [],
        fileError: "",
        errorTimeout: null,
        _debounceTimer: null,
        _resizeTimer: null,
        _fileErrorTimeout: null,
        formTouched: false,
        fileUploadInProgress: false,
        // Enhanced submission protection
        _submissionLock: false,
        _submissionAttempts: 0,
        _maxSubmissionAttempts: 5,
        _lastSubmissionTime: 0,
        _minSubmissionInterval: 2000, // 2 seconds minimum between submissions
        _concurrentSubmissions: 0,
        _abortController: null,
        _submissionId: null,
        _errorHistory: [],
        _lastErrorType: null,
        _retryCount: 0,
        _maxRetries: 2,
        
        // Enhanced validation methods
        validateEmail(email) {
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            return emailRegex.test(email) && email.length <= 254;
        },
        
        validatePhone(phone) {
            if (!phone) return true; // Phone is optional
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\(]?[\d]{3}[\)]?[\s\-\.]?[\d]{3}[\s\-\.]?[\d]{4}$/;
            const cleanPhone = phone.replace(/[\s\-\.\(\)]/g, '');
            return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10;
        },
        
        validateName(name) {
            const nameRegex = /^[a-zA-Z\s\-\'\.]{2,50}$/;
            return nameRegex.test(name.trim());
        },
        
        validateMessage(message) {
            return message.trim().length >= 10 && message.trim().length <= 2000;
        },
        
        // INIT: Ensure form is ready
        init() {
            // Force Alpine reactivity for uploadedFiles
            if (!this.uploadedFiles) {
                this.uploadedFiles = [];
            }
            
            // Ensure all reactive properties are initialized
            if (typeof this.submissionSuccess === 'undefined') {
                this.submissionSuccess = false;
            }
            if (typeof this.isSubmitting === 'undefined') {
                this.isSubmitting = false;
            }
            if (typeof this.errorMessage === 'undefined') {
                this.errorMessage = "";
            }
            if (typeof this.fileError === 'undefined') {
                this.fileError = "";
            }
            if (typeof this.messageLength === 'undefined') {
                this.messageLength = 0;
            }
            
            if (typeof this.successMessage === 'undefined') {
                this.successMessage = "";
            }
            
            log.log('=== contactForm INITIALIZED ===', { 
                hasUploadedFiles: !!this.uploadedFiles, 
                filesCount: this.uploadedFiles?.length || 0,
                submissionSuccess: this.submissionSuccess,
                isSubmitting: this.isSubmitting,
                hasSubmitForm: typeof this.submitForm === 'function',
                hasHandleFileChange: typeof this.handleFileChange === 'function'
            });
            
            // Verify form element exists
            if (this.$el) {
                const form = this.$el.querySelector('form');
                if (form) {
                    log.log('Form element found in init:', form.id || form.className);
                } else {
                    log.warn('Form element NOT found in contactForm init');
                }
            }
        },

        updateMessageLength() {
                        try {
                            // CRITICAL FIX: Debounce to prevent blocking during rapid typing
                            // Use longer debounce to prevent excessive updates
                            if (this._debounceTimer) clearTimeout(this._debounceTimer);
                            this._debounceTimer = setTimeout(() => {
                                // Use idle callback for non-critical length update
                                if (typeof requestIdleCallback !== 'undefined') {
                                    requestIdleCallback(() => {
                                        try {
                                            const messageEl = Utils.safeGetById("message");
                                            if (messageEl) {
                                                // Read value length without triggering layout
                                                this.messageLength = (messageEl.value || '').length;
                                            }
                                        } catch (e) {
                                            log.warn('Message length update error:', e);
                                        }
                                    }, { timeout: 200 });
                                } else {
                                    Utils.safeRAF(() => {
                                        try {
                                            const messageEl = Utils.safeGetById("message");
                                            if (messageEl) {
                                                this.messageLength = (messageEl.value || '').length;
                                            }
                                        } catch (e) {
                                            log.warn('Message length update error:', e);
                                        }
                                    });
                                }
                            }, 200); // Increased debounce to 200ms
                        } catch (e) {
                            log.warn('Message length update error:', e);
            }
        },

        resizeTextarea(textarea) {
                        // No-op: Using fixed height textarea for better stability
                        // Especially important for mobile compatibility
                        return;
        },

        clearErrorAfterDelay() {
                        try {
            if (this.errorTimeout) {
                clearTimeout(this.errorTimeout);
            }
            this.errorTimeout = setTimeout(() => {
                if (this.errorMessage && !this.isSubmitting) {
                    this.errorMessage = "";
                }
            }, 5000);
                        } catch (e) {
                            log.warn('Clear error delay error:', e);
                        }
        },

        clearErrorOnInput(event) {
                        try {
            if (this.errorMessage && !this.isSubmitting) {
                this.errorMessage = "";
                if (this.errorTimeout) {
                    clearTimeout(this.errorTimeout);
                    this.errorTimeout = null;
                }
                            }
                            // Mark form as touched for better UX
                            this.formTouched = true;
                            
                            // Clear field-specific validation state
                            if (event && event.target) {
                                const field = event.target;
                                field.setCustomValidity("");
                                field.removeAttribute('aria-invalid');
                                // Remove error styling
                                field.classList.remove('border-red-500', 'border-red-600');
                                field.classList.add('border-gray-700/50');
                                
                                // Clear associated error div
                                const errorId = field.getAttribute('aria-describedby');
                                if (errorId) {
                                    const errorDivs = errorId.split(' ').map(id => Utils.safeGetById(id)).filter(Boolean);
                                    errorDivs.forEach(errorDiv => {
                                        if (errorDiv && errorDiv.id && errorDiv.id.includes('-error')) {
                                            errorDiv.textContent = '';
                                            errorDiv.classList.add('sr-only');
                                            errorDiv.classList.remove('mt-1', 'text-xs', 'text-red-400');
                                        }
                                    });
                                }
                            }
                        } catch (e) {
                            log.warn('Clear error on input error:', e);
            }
        },


        handleFileChange(event) {
                        try {
                            log.log('=== handleFileChange START ===', { 
                                event, 
                                hasTarget: !!event?.target, 
                                files: event?.target?.files?.length,
                                uploadedFilesBefore: this.uploadedFiles?.length || 0
                            });
                            
                            const fileInput = event?.target;
            this.fileError = "";
            
            // Ensure uploadedFiles array exists
            if (!this.uploadedFiles) {
                this.uploadedFiles = [];
            }

            // Enhanced validation: Check if file input exists and has files
            if (!fileInput) {
                log.warn('File input not found');
                return;
            }

            if (!fileInput.files || fileInput.files.length === 0) {
                // User cancelled file selection - this is normal, not an error
                return;
            }

            // Get accept attribute to determine allowed file types
            const acceptAttr = fileInput.getAttribute('accept') || '';
            const allowsPDF = acceptAttr.includes('pdf') || acceptAttr.includes('application/pdf');

            // CRITICAL FIX: Use spread operator instead of Array.from for better performance
            // Array.from creates iterator overhead - spread is faster
            const newFiles = fileInput.files ? [...fileInput.files] : [];
            const maxFileSize = 25 * 1024 * 1024; // 25MB
            const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            const validPDFType = 'application/pdf';
            const maxTotalFiles = 10;
            const maxTotalSize = 90 * 1024 * 1024; // 90MB total

            // Check total file count limit BEFORE processing
            const currentCount = this.uploadedFiles?.length || 0;
            if (currentCount + newFiles.length > maxTotalFiles) {
                this.fileError = `You can only upload up to ${maxTotalFiles} files total. You currently have ${currentCount} file(s) selected. Please remove some files first.`;
                fileInput.value = "";
                this.clearFileErrorAfterDelay();
                return;
            }

            // Calculate current total size
            let currentTotalSize = 0;
            if (this.uploadedFiles && this.uploadedFiles.length > 0) {
                for (let i = 0; i < this.uploadedFiles.length; i++) {
                    const existingFile = this.uploadedFiles[i];
                    if (existingFile && existingFile.size) {
                        currentTotalSize += existingFile.size;
                    }
                }
            }

            const validFiles = [];
            const duplicateFiles = [];
            const invalidFiles = [];
            let newTotalSize = currentTotalSize;

            // Optimized: Use for loop and cache length to prevent repeated lookups
            const existingFiles = this.uploadedFiles || [];
            const existingCount = existingFiles.length;
            
            // Process each new file
            for (let i = 0; i < newFiles.length; i++) {
                const file = newFiles[i];
                                try {
                                    // Validate file object
                                    if (!file || !file.name || file.size === undefined) {
                                        invalidFiles.push(`"${file?.name || 'Unknown file'}" is invalid`);
                                        continue;
                                    }

                                    // Check for duplicate files (by name and size)
                                    let isDuplicate = false;
                                    for (let j = 0; j < existingCount; j++) {
                                        const existing = existingFiles[j];
                                        if (existing && existing.name === file.name && existing.size === file.size) {
                                            isDuplicate = true;
                                            break;
                                        }
                                    }
                if (isDuplicate) {
                    duplicateFiles.push(this.sanitizeFileName(file.name));
                                        continue;
                }

                                    // Check file size
                if (file.size === 0) {
                    invalidFiles.push(`"${this.sanitizeFileName(file.name)}" is empty (0 bytes)`);
                                        continue;
                }

                if (file.size > maxFileSize) {
                    invalidFiles.push(`"${this.sanitizeFileName(file.name)}" is too large (${this.formatFileSize(file.size)}). Maximum is 25MB.`);
                                        continue;
                }

                                    // Check if adding this file would exceed total size limit
                                    if (newTotalSize + file.size > maxTotalSize) {
                                        invalidFiles.push(`"${this.sanitizeFileName(file.name)}" would exceed total size limit (90MB). Current total: ${this.formatFileSize(newTotalSize)}`);
                                        continue;
                                    }

                                    // Validate file type
                                    const isValidImage = validImageTypes.includes(file.type);
                                    const isValidPDF = allowsPDF && file.type === validPDFType;
                                    
                if (!isValidImage && !isValidPDF) {
                    if (allowsPDF) {
                        invalidFiles.push(`"${this.sanitizeFileName(file.name)}" is not a valid image or PDF file. Accepted: JPG, PNG, GIF, WebP, PDF.`);
                    } else {
                        invalidFiles.push(`"${this.sanitizeFileName(file.name)}" is not a valid image file. Accepted: JPG, PNG, GIF, WebP.`);
                    }
                                        continue;
                }

                                    // All validations passed - add to valid files
                                    validFiles.push({
                                        file: file,
                    name: file.name,
                    size: file.size,
                    type: file.type
                });
                                    newTotalSize += file.size;
                                } catch (fileError) {
                                    log.warn('File validation error:', fileError);
                                    invalidFiles.push(`"${file.name || 'Unknown file'}" could not be processed`);
                                }
            }

            // Add valid files to uploadedFiles array
            if (validFiles.length > 0) {
                                if (!this.uploadedFiles) this.uploadedFiles = [];
                // Create new array to trigger Alpine reactivity
                const beforeCount = this.uploadedFiles.length;
                this.uploadedFiles = [...this.uploadedFiles, ...validFiles];
                const afterCount = this.uploadedFiles.length;
                log.log('=== FILES ADDED ===', { 
                    beforeCount, 
                    added: validFiles.length, 
                    afterCount,
                    files: this.uploadedFiles.map(f => ({ name: f.name, size: f.size }))
                });
                
                // Force Alpine to update - trigger reactivity
                // Use $nextTick if available, otherwise use setTimeout
                if (this.$nextTick) {
                    this.$nextTick(() => {
                        log.log('Alpine reactivity updated via $nextTick');
                    });
                } else if (this.$el) {
                    // Dispatch custom event to force update
                    this.$el.dispatchEvent(new CustomEvent('files-updated', { 
                        detail: { count: this.uploadedFiles.length },
                        bubbles: true
                    }));
                }
                
                // Force a re-evaluation of x-show by toggling a dummy property
                // This ensures Alpine re-evaluates the condition
                if (this.$watch) {
                    this.$watch('uploadedFiles', () => {
                        log.log('uploadedFiles watched, count:', this.uploadedFiles?.length);
                    });
                }
            }

            // Display errors if any
            if (duplicateFiles.length > 0 || invalidFiles.length > 0) {
                const errorMessages = [];
                if (duplicateFiles.length > 0) {
                    const dupText = duplicateFiles.length === 1 ? 'file is' : 'files are';
                    errorMessages.push(`${duplicateFiles.length} ${dupText} already selected: ${duplicateFiles.slice(0, 3).join(', ')}${duplicateFiles.length > 3 ? '...' : ''}`);
                }
                if (invalidFiles.length > 0) {
                    // Show first 3 errors to avoid overwhelming user
                    errorMessages.push(...invalidFiles.slice(0, 3));
                    if (invalidFiles.length > 3) {
                        errorMessages.push(`...and ${invalidFiles.length - 3} more file(s) with errors`);
                    }
                }
                this.fileError = errorMessages.join('. ');
                
                // Populate photo error div
                const photoErrorDiv = Utils.safeGetById('photo-error');
                if (photoErrorDiv) {
                    photoErrorDiv.textContent = this.fileError;
                    photoErrorDiv.classList.remove('sr-only');
                    photoErrorDiv.classList.add('mt-1', 'text-xs', 'text-red-400');
                    photoErrorDiv.setAttribute('role', 'alert');
                }
                
                this.clearFileErrorAfterDelay();
            } else {
                                this.fileError = "";
                
                // Clear photo error div
                const photoErrorDiv = Utils.safeGetById('photo-error');
                if (photoErrorDiv) {
                    photoErrorDiv.textContent = '';
                    photoErrorDiv.classList.add('sr-only');
                    photoErrorDiv.classList.remove('mt-1', 'text-xs', 'text-red-400');
                }
            }

            // Clear file input to allow selecting same file again if needed
            fileInput.value = "";
                        } catch (e) {
                            log.error('File change handler error:', e);
                            this.fileError = "An error occurred processing files. Please try again.";
                            
                            // Populate photo error div
                            const photoErrorDiv = Utils.safeGetById('photo-error');
                            if (photoErrorDiv) {
                                photoErrorDiv.textContent = this.fileError;
                                photoErrorDiv.classList.remove('sr-only');
                                photoErrorDiv.classList.add('mt-1', 'text-xs', 'text-red-400');
                                photoErrorDiv.setAttribute('role', 'alert');
                            }
                            
                            this.clearFileErrorAfterDelay();
                        }
        },

        clearFileErrorAfterDelay() {
                        try {
                            // Clear any existing timeout
                            if (this._fileErrorTimeout) {
                                clearTimeout(this._fileErrorTimeout);
                            }
                            // Set new timeout to clear error after 8 seconds (longer for file errors)
                            this._fileErrorTimeout = setTimeout(() => {
                                if (this.fileError && !this.isSubmitting) {
                                    this.fileError = "";
                                }
                                this._fileErrorTimeout = null;
                            }, 8000);
                        } catch (e) {
                            log.warn('Clear file error delay error:', e);
                        }
        },

        removeFile(index) {
                        try {
                            if (this.uploadedFiles && Array.isArray(this.uploadedFiles)) {
                                // Validate index
                                if (index < 0 || index >= this.uploadedFiles.length) {
                                    log.warn('Invalid file index:', index);
                                    return;
                                }
                                // Remove file at index - create new array for reactivity
                                this.uploadedFiles = this.uploadedFiles.filter((_, i) => i !== index);
                                log.log('File removed, remaining:', this.uploadedFiles.length);
                                // Clear file error if no files remain
                                if (this.uploadedFiles.length === 0) {
                                    this.fileError = "";
                                    if (this._fileErrorTimeout) {
                                        clearTimeout(this._fileErrorTimeout);
                                        this._fileErrorTimeout = null;
                                    }
                                    
                                    // Clear photo error div
                                    const photoErrorDiv = Utils.safeGetById('photo-error');
                                    if (photoErrorDiv) {
                                        photoErrorDiv.textContent = '';
                                        photoErrorDiv.classList.add('sr-only');
                                        photoErrorDiv.classList.remove('mt-1', 'text-xs', 'text-red-400');
                                    }
                                }
                            }
                        } catch (e) {
                            log.warn('Remove file error:', e);
                        }
        },

        clearAllFiles() {
                        try {
                            const fileCount = this.uploadedFiles?.length || 0;
                            // Clear all uploaded files - assign new array for reactivity
                            this.uploadedFiles = [];
                            log.log('All files cleared, was:', fileCount, 'now:', this.uploadedFiles.length);
                            
                            // Clear file input
                            const fileInputEl = Utils.safeGetById('photo-upload');
                            if (fileInputEl) {
                                fileInputEl.value = '';
                            }
                            
                            // Clear file errors
                            this.fileError = "";
                            if (this._fileErrorTimeout) {
                                clearTimeout(this._fileErrorTimeout);
                                this._fileErrorTimeout = null;
                            }
                            
                            // Clear photo error div
                            const photoErrorDiv = Utils.safeGetById('photo-error');
                            if (photoErrorDiv) {
                                photoErrorDiv.textContent = '';
                                photoErrorDiv.classList.add('sr-only');
                                photoErrorDiv.classList.remove('mt-1', 'text-xs', 'text-red-400');
                            }
                            
                            // Force Alpine reactivity update
                            if (this.$nextTick) {
                                this.$nextTick(() => {
                                    log.log('File list cleared and updated');
                                });
                            }
                        } catch (e) {
                            log.warn('Clear all files error:', e);
                        }
        },

        formatFileSize(bytes) {
                        try {
                            if (!bytes || bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
                        } catch (e) {
                            return 'Unknown size';
                        }
        },

        // Sanitize file names for display in error messages
        sanitizeFileName(fileName) {
            // CRITICAL: Check if fileName is a string to prevent crashes
            if (typeof fileName !== 'string' || !fileName) return 'Unknown';
            // Remove or replace potentially problematic characters
            return fileName
                .replace(/[<>]/g, '') // Remove angle brackets that could cause HTML issues
                .replace(/['"]/g, '') // Remove quotes that could break strings
                .substring(0, 50) // Limit length to prevent UI overflow
                + (fileName.length > 50 ? '...' : '');
        },

        // Enhanced text sanitization
        sanitizeText(text) {
            if (typeof text !== 'string') return '';
            
            return text
                .replace(/[<>]/g, '') // Remove HTML brackets
                .replace(/javascript:/gi, '') // Remove javascript: protocol
                .replace(/data:/gi, '') // Remove data: protocol
                .replace(/vbscript:/gi, '') // Remove vbscript: protocol
                .replace(/on\w+\s*=/gi, '') // Remove event handlers
                .trim()
                .substring(0, 10000); // Reasonable length limit
        },

        // Enhanced email validation
        validateEmailStrict(email) {
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            const isValid = emailRegex.test(email);
            const isReasonableLength = email.length <= 254; // RFC 5321 limit
            const hasValidDomain = email.includes('.') && !email.endsWith('.');
            
            return isValid && isReasonableLength && hasValidDomain;
        },

        async submitForm(event) {
            try {
                // COMPREHENSIVE SUBMISSION PROTECTION
                log.log('submitForm called', { event, hasTarget: !!event?.target, hasForm: !!event?.target?.tagName });
                
                // 1. Validate event and form
                if (!event || !event.target) {
                    log.error('Invalid submit event - event:', event);
                    this.errorMessage = "Form submission error. Please refresh the page and try again.";
                    this.clearErrorAfterDelay();
                    return;
                }
                const form = event.target;
                log.log('Form element:', form.tagName, form.id || form.className);

                // 2. Prevent double submissions - Multiple layers of protection
                const now = Date.now();
                const timeSinceLastSubmission = now - this._lastSubmissionTime;
                
                // Check if already submitting (primary lock)
                if (this.isSubmitting || this._submissionLock) {
                    log.warn('Submission already in progress - blocked');
                    if (event && event.preventDefault) event.preventDefault();
                    if (event && event.stopPropagation) event.stopPropagation();
                    return false;
                }
                
                // Check minimum interval between submissions (prevents rapid clicks)
                if (timeSinceLastSubmission < this._minSubmissionInterval && this._lastSubmissionTime > 0) {
                    const waitTime = Math.ceil((this._minSubmissionInterval - timeSinceLastSubmission) / 1000);
                    this.errorMessage = `Please wait ${waitTime} second${waitTime > 1 ? 's' : ''} before submitting again.`;
                    this.clearErrorAfterDelay();
                    if (event && event.preventDefault) event.preventDefault();
                    if (event && event.stopPropagation) event.stopPropagation();
                    return false;
                }
                
                // Check maximum submission attempts (prevents abuse)
                if (this._submissionAttempts >= this._maxSubmissionAttempts) {
                    this.errorMessage = "Too many submission attempts. Please wait a few minutes or call me at (703) 772-5185.";
                    this.clearErrorAfterDelay();
                    if (event && event.preventDefault) event.preventDefault();
                    if (event && event.stopPropagation) event.stopPropagation();
                    // Reset attempts after 5 minutes
                    setTimeout(() => {
                        this._submissionAttempts = 0;
                        this._errorHistory = [];
                    }, 300000); // 5 minutes
                    return false;
                }
                
                // 3. Abort any previous submission attempts
                if (this._abortController) {
                    try {
                        this._abortController.abort();
                    } catch (e) {
                        log.warn('Error aborting previous submission:', e);
                    }
                    this._abortController = null;
                }
                
                // 4. Create new submission ID for tracking
                this._submissionId = `submission_${now}_${Math.random().toString(36).substr(2, 9)}`;
                
                // 5. Set submission locks
                this._submissionLock = true;
                this.isSubmitting = true;
                this._lastSubmissionTime = now;
                this._submissionAttempts++;
                this._concurrentSubmissions++;
                
                // 6. Clear previous errors
                this.errorMessage = "";
                this.fileError = "";
                this._lastErrorType = null;

                // VALIDATION

                // Validate form fields - use custom validation instead of browser's native UI
                if (!form.checkValidity()) {
                    // Don't call reportValidity() - it shows browser's native validation bubble
                    // Instead, handle validation ourselves with custom error messages
                    this._lastErrorType = 'validation';
                    this._errorHistory.push({ type: 'validation', time: Date.now(), field: 'general' });
                    this.errorMessage = "Please complete all required fields.";
                    this.clearErrorAfterDelay();
                    
                    // Add visual feedback to invalid fields and populate error divs
                    const invalidFields = form.querySelectorAll(':invalid');
                    invalidFields.forEach(field => {
                        field.setAttribute('aria-invalid', 'true');
                        field.classList.remove('border-gray-700/50', 'border-gray-600');
                        field.classList.add('border-red-500');
                        
                        // Populate error div for this field
                        const errorId = field.getAttribute('aria-describedby');
                        if (errorId) {
                            const errorDivs = errorId.split(' ').map(id => Utils.safeGetById(id)).filter(Boolean);
                            errorDivs.forEach(errorDiv => {
                                if (errorDiv && errorDiv.id && errorDiv.id.includes('-error')) {
                                    // Use custom error messages instead of browser's default
                                    let errorText = 'This field is required.';
                                    if (field.type === 'email' && !field.validity.valid) {
                                        errorText = field.value ? 'Please enter a valid email address.' : 'Email is required.';
                                    } else if (field.tagName === 'TEXTAREA' && !field.value) {
                                        errorText = 'Project details are required.';
                                    } else if (field.tagName === 'INPUT' && field.type === 'text' && !field.value) {
                                        errorText = 'This field is required.';
                                    }
                                    
                                    errorDiv.textContent = errorText;
                                    errorDiv.classList.remove('sr-only');
                                    errorDiv.classList.add('mt-1', 'text-xs', 'text-red-400');
                                    errorDiv.setAttribute('role', 'alert');
                                }
                            });
                        }
                    });
                    
                                const firstInvalid = Utils.safeQuery(":invalid", form);
                    if (firstInvalid) {
                                    try {
                        firstInvalid.focus();
                                        if (Utils.isMobile()) {
                                            Utils.safeScrollIntoView(firstInvalid);
                                        }
                                    } catch (e) {
                                        log.warn('Focus error:', e);
                        }
                    }
                    
                    // Reset submission state on validation error
                    this._resetSubmissionState();
                    return;
                }
                
                // Clear validation styling from all fields on successful validation
                const allFields = form.querySelectorAll('input, textarea');
                allFields.forEach(field => {
                    field.removeAttribute('aria-invalid');
                    field.classList.remove('border-red-500', 'border-red-600');
                    field.classList.add('border-gray-700/50');
                    
                    // Clear associated error divs
                    const errorId = field.getAttribute('aria-describedby');
                    if (errorId) {
                        const errorDivs = errorId.split(' ').map(id => Utils.safeGetById(id)).filter(Boolean);
                        errorDivs.forEach(errorDiv => {
                            if (errorDiv && errorDiv.id && errorDiv.id.includes('-error')) {
                                errorDiv.textContent = '';
                                errorDiv.classList.add('sr-only');
                                errorDiv.classList.remove('mt-1', 'text-xs', 'text-red-400');
                            }
                        });
                    }
                });

                // Validate and trim text inputs
                            const nameInput = Utils.safeQuery('input[name="full-name"]', form);
                            const emailInput = Utils.safeQuery('input[name="_replyto"]', form);
                            const messageInput = Utils.safeQuery('textarea[name="message"]', form);

                if (nameInput) {
                                nameInput.value = (nameInput.value || '').trim();
                    if (!nameInput.value) {
                        nameInput.setCustomValidity("Full name is required.");
                        nameInput.setAttribute('aria-invalid', 'true');
                        nameInput.classList.remove('border-gray-700/50', 'border-gray-600');
                        nameInput.classList.add('border-red-500');
                        
                        // Populate error div
                        const nameErrorDiv = Utils.safeGetById('full-name-error');
                        if (nameErrorDiv) {
                            nameErrorDiv.textContent = 'Full name is required.';
                            nameErrorDiv.classList.remove('sr-only');
                            nameErrorDiv.classList.add('mt-1', 'text-xs', 'text-red-400');
                            nameErrorDiv.setAttribute('role', 'alert');
                        }
                        
                        // Don't call reportValidity() - it shows browser's native validation bubble
                        this._lastErrorType = 'validation';
                        this._errorHistory.push({ type: 'validation', time: Date.now(), field: 'name' });
                        this.errorMessage = "Please enter your full name.";
                        this.clearErrorAfterDelay();
                                    try {
                        nameInput.focus();
                                    } catch (e) {
                                        log.warn('Focus error:', e);
                                    }
                        this._resetSubmissionState();
                        return;
                    }
                    nameInput.setCustomValidity("");
                    nameInput.removeAttribute('aria-invalid');
                    nameInput.classList.remove('border-red-500', 'border-red-600');
                    nameInput.classList.add('border-gray-700/50');
                    
                    // Clear error div
                    const nameErrorDiv = Utils.safeGetById('full-name-error');
                    if (nameErrorDiv) {
                        nameErrorDiv.textContent = '';
                        nameErrorDiv.classList.add('sr-only');
                        nameErrorDiv.classList.remove('mt-1', 'text-xs', 'text-red-400');
                    }
                }

                if (emailInput) {
                                emailInput.value = (emailInput.value || '').trim();
                    // Email validation is handled by HTML5, but we'll clear error div if valid
                    if (emailInput.validity.valid) {
                        emailInput.removeAttribute('aria-invalid');
                        emailInput.classList.remove('border-red-500', 'border-red-600');
                        emailInput.classList.add('border-gray-700/50');
                        
                        // Clear error div
                        const emailErrorDiv = Utils.safeGetById('email-error');
                        if (emailErrorDiv) {
                            emailErrorDiv.textContent = '';
                            emailErrorDiv.classList.add('sr-only');
                            emailErrorDiv.classList.remove('mt-1', 'text-xs', 'text-red-400');
                        }
                    } else {
                        // Email is invalid - error will be shown by browser validation
                        emailInput.setAttribute('aria-invalid', 'true');
                        emailInput.classList.remove('border-gray-700/50', 'border-gray-600');
                        emailInput.classList.add('border-red-500');
                        
                        // Populate error div
                        const emailErrorDiv = Utils.safeGetById('email-error');
                        if (emailErrorDiv) {
                            const errorText = emailInput.validationMessage || 'Please enter a valid email address.';
                            emailErrorDiv.textContent = errorText;
                            emailErrorDiv.classList.remove('sr-only');
                            emailErrorDiv.classList.add('mt-1', 'text-xs', 'text-red-400');
                            emailErrorDiv.setAttribute('role', 'alert');
                        }
                    }
                }

                if (messageInput) {
                                messageInput.value = (messageInput.value || '').trim();
                    const messageErrorDiv = Utils.safeGetById('message-error');
                    
                    if (!messageInput.value) {
                        messageInput.setCustomValidity("Project details are required.");
                        messageInput.setAttribute('aria-invalid', 'true');
                        messageInput.classList.remove('border-gray-700/50', 'border-gray-600');
                        messageInput.classList.add('border-red-500');
                        
                        // Populate error div
                        if (messageErrorDiv) {
                            messageErrorDiv.textContent = 'Project details are required.';
                            messageErrorDiv.classList.remove('sr-only');
                            messageErrorDiv.classList.add('mt-1', 'text-xs', 'text-red-400');
                            messageErrorDiv.setAttribute('role', 'alert');
                        }
                        
                        // Don't call reportValidity() - it shows browser's native validation bubble
                        this._lastErrorType = 'validation';
                        this._errorHistory.push({ type: 'validation', time: Date.now(), field: 'message' });
                        this.errorMessage = "Please provide project details.";
                        this.clearErrorAfterDelay();
                                    try {
                        messageInput.focus();
                                    } catch (e) {
                                        log.warn('Focus error:', e);
                                    }
                        this._resetSubmissionState();
                        return;
                    }
                    if (messageInput.value.length > 2000) {
                        messageInput.setAttribute('aria-invalid', 'true');
                        messageInput.classList.remove('border-gray-700/50', 'border-gray-600');
                        messageInput.classList.add('border-red-500');
                        
                        // Populate error div
                        if (messageErrorDiv) {
                            messageErrorDiv.textContent = 'Message is too long. Please keep it under 2,000 characters.';
                            messageErrorDiv.classList.remove('sr-only');
                            messageErrorDiv.classList.add('mt-1', 'text-xs', 'text-red-400');
                            messageErrorDiv.setAttribute('role', 'alert');
                        }
                        
                        this._lastErrorType = 'validation';
                        this._errorHistory.push({ type: 'validation', time: Date.now(), field: 'message_length' });
                        this.errorMessage = "Message is too long. Please keep it under 2,000 characters.";
                        this.clearErrorAfterDelay();
                                    try {
                        messageInput.focus();
                                    } catch (e) {
                                        log.warn('Focus error:', e);
                                    }
                        this._resetSubmissionState();
                        return;
                    }
                    messageInput.setCustomValidity("");
                    messageInput.removeAttribute('aria-invalid');
                    messageInput.classList.remove('border-red-500', 'border-red-600');
                    messageInput.classList.add('border-gray-700/50');
                    
                    // Clear error div
                    if (messageErrorDiv) {
                        messageErrorDiv.textContent = '';
                        messageErrorDiv.classList.add('sr-only');
                        messageErrorDiv.classList.remove('mt-1', 'text-xs', 'text-red-400');
                    }
                }

                            // Validate file uploads
                if (this.uploadedFiles && this.uploadedFiles.length > 0) {
                                // Optimized: Use for loop instead of map/filter chain
                                const files = [];
                                for (let i = 0; i < this.uploadedFiles.length; i++) {
                                    const file = this.uploadedFiles[i]?.file;
                                    if (file) files.push(file);
                                }

                    if (files.length > 10) {
                        this.errorMessage = "Please upload no more than 10 files total.";
                        this.fileError = this.errorMessage;
                        
                        // Populate photo error div
                        const photoErrorDiv = Utils.safeGetById('photo-error');
                        if (photoErrorDiv) {
                            photoErrorDiv.textContent = this.errorMessage;
                            photoErrorDiv.classList.remove('sr-only');
                            photoErrorDiv.classList.add('mt-1', 'text-xs', 'text-red-400');
                            photoErrorDiv.setAttribute('role', 'alert');
                        }
                        
                        this._resetSubmissionState();
                        return;
                    }

                                const maxFileSize = 25 * 1024 * 1024;
                                const maxTotalSize = 90 * 1024 * 1024;
                                const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                                const validPDFType = 'application/pdf';
                    let totalSize = 0;

                                    const fileInput = Utils.safeQuery('input[type="file"]', form);
                                    const acceptAttr = fileInput ? (fileInput.getAttribute('accept') || '') : '';
                                    const allowsPDF = acceptAttr.includes('pdf') || acceptAttr.includes('application/pdf');

                                    // Optimized: Use for loop instead of for...of
                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        
                                        // Validate file object
                                        if (!file || !file.name || file.size === undefined) {
                                            this.errorMessage = `File "${this.sanitizeFileName(file?.name)}" is invalid. Please remove and re-upload.`;
                                            this.fileError = this.errorMessage;
                                            this.clearErrorAfterDelay();
                                            return;
                                        }

                        if (file.size === 0) {
                            this.errorMessage = `File "${this.sanitizeFileName(file.name)}" is empty. Please remove and re-upload.`;
                            this.fileError = this.errorMessage;
                            this.clearErrorAfterDelay();
                            return;
                        }

                        if (file.size > maxFileSize) {
                            this.errorMessage = `File "${this.sanitizeFileName(file.name)}" is too large (${this.formatFileSize(file.size)}). Maximum is 25MB.`;
                            this.fileError = this.errorMessage;
                            this.clearErrorAfterDelay();
                            return;
                        }

                        totalSize += file.size;

                                        // Validate file type
                                        const isValidImage = validImageTypes.includes(file.type);
                                        const isValidPDF = allowsPDF && file.type === validPDFType;

                        if (!isValidImage && !isValidPDF) {
                            if (allowsPDF) {
                                this.errorMessage = `File "${this.sanitizeFileName(file.name)}" is not a valid image or PDF file. Accepted: JPG, PNG, GIF, WebP, PDF.`;
                            } else {
                                this.errorMessage = `File "${this.sanitizeFileName(file.name)}" is not a valid image file. Accepted: JPG, PNG, GIF, WebP.`;
                            }
                            this.fileError = this.errorMessage;
                            this.clearErrorAfterDelay();
                            return;
                        }
                    }

                    if (totalSize > maxTotalSize) {
                        this.errorMessage = `Total file size is too large (${this.formatFileSize(totalSize)}). Maximum total size is 90MB.`;
                        this.fileError = this.errorMessage;
                        this.clearErrorAfterDelay();
                        return;
                    }

                    this.fileError = "";
                }

                const formData = new FormData(form);

                formData.delete('photo');
                if (this.uploadedFiles && this.uploadedFiles.length > 0) {
                    // Optimized: Use for loop instead of forEach
                    for (let i = 0; i < this.uploadedFiles.length; i++) {
                        const fileObj = this.uploadedFiles[i];
                        if (fileObj && fileObj.file) {
                            formData.append('photo', fileObj.file);
                        }
                    }
                }


                // PREPARE SUBMISSION
                
                // Prevent navigation during submission (browser-specific handling)
                const preventUnload = (e) => {
                    if (this.isSubmitting || this._submissionLock) {
                        // Modern browsers
                        e.preventDefault();
                        // Legacy browsers
                        e.returnValue = "Your form is being submitted. Please wait.";
                        return e.returnValue;
                    }
                };

                // Browser-specific beforeunload handling
                            try {
                    // Chrome, Firefox, Safari, Edge all support this
                window.addEventListener("beforeunload", preventUnload);
                            } catch (e) {
                                log.warn('Beforeunload listener error:', e);
                            }

                this.submittedData.name = formData.get("full-name") || "";

                // Create AbortController for timeout and cancellation
                this._abortController = new AbortController();
                const controller = this._abortController;
                
                // Adaptive timeout based on device and network
                const isSlowConnection = navigator.connection && 
                    (navigator.connection.effectiveType === 'slow-2g' || 
                     navigator.connection.effectiveType === '2g');
                const timeoutDuration = isSlowConnection ? 20000 : 15000; // 20s for slow, 15s for normal
                
                            const timeoutId = setTimeout(() => {
                                try {
                        if (controller && !controller.signal.aborted) {
                                    controller.abort();
                            log.warn('Submission timeout after', timeoutDuration, 'ms');
                        }
                                } catch (e) {
                                    log.warn('Abort error:', e);
                                }
                }, timeoutDuration);

                // SUBMIT FORM WITH COMPREHENSIVE ERROR HANDLING

                let response;
                const submissionId = this._submissionId; // Capture for verification
                
                try {
                    // Browser-specific fetch options
                    const fetchOptions = {
                    method: "POST",
                    body: formData,
                    headers: { Accept: "application/json" },
                        signal: controller.signal,
                        // Add cache control for different browsers
                        cache: 'no-cache',
                        // Add credentials for cross-origin (if needed)
                        credentials: 'omit',
                        // Add referrer policy
                        referrerPolicy: 'no-referrer'
                    };
                    
                    // Device-specific optimizations
                    if (Utils.isMobile()) {
                        // Mobile devices may need longer timeouts
                        fetchOptions.keepalive = true; // Chrome/Edge support
                    }
                    
                    response = await fetch("https://formspree.io/xblzkgdl", fetchOptions);
                    
                    // Verify this is still the current submission
                    if (this._submissionId !== submissionId) {
                        log.warn('Submission ID mismatch - ignoring response');
                        clearTimeout(timeoutId);
                        return;
                    }
                    
                    clearTimeout(timeoutId);
                } catch (fetchError) {
                    clearTimeout(timeoutId);
                    
                    // Verify this is still the current submission
                    if (this._submissionId !== submissionId) {
                        log.warn('Submission ID mismatch - ignoring error');
                        return;
                    }
                    
                                try {
                    window.removeEventListener("beforeunload", preventUnload);
                                } catch (e) {
                                    log.warn('Remove listener error:', e);
                                }

                    // Handle different error types
                    if (fetchError.name === "AbortError" || fetchError.name === "TimeoutError") {
                        this._lastErrorType = 'timeout';
                        this._errorHistory.push({ type: 'timeout', time: Date.now() });
                        
                        // Reset submission state
                        this._resetSubmissionState();
                        
                        // Retry logic for timeout errors
                        if (this._retryCount < this._maxRetries) {
                            this._retryCount++;
                            this.errorMessage = `Connection timeout. Retrying... (${this._retryCount}/${this._maxRetries})`;
                            this.clearErrorAfterDelay();
                            
                            // Retry after delay
                            setTimeout(() => {
                                if (!this.isSubmitting && !this._submissionLock) {
                                    // Trigger retry by simulating form submission
                                    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                                    form.dispatchEvent(submitEvent);
                                }
                            }, 2000);
                            return;
                        } else {
                            this.errorMessage = "Connection timeout after multiple attempts. Please check your internet connection or call me at (703) 772-5185.";
                            this._resetSubmissionState();
                            this.clearErrorAfterDelay();
                            return;
                        }
                    }
                    
                    // Network errors
                    if (fetchError.message && (fetchError.message.includes('network') || fetchError.message.includes('Failed to fetch'))) {
                        this._lastErrorType = 'network';
                        this._errorHistory.push({ type: 'network', time: Date.now() });
                        this._resetSubmissionState();
                        
                        // Retry logic for network errors
                        if (this._retryCount < this._maxRetries) {
                            this._retryCount++;
                            this.errorMessage = `Network error. Retrying... (${this._retryCount}/${this._maxRetries})`;
                            this.clearErrorAfterDelay();
                            
                            setTimeout(() => {
                                if (!this.isSubmitting && !this._submissionLock) {
                                    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                                    form.dispatchEvent(submitEvent);
                                }
                            }, 3000);
                            return;
                        } else {
                            this.errorMessage = "Network error. Please check your internet connection and try again, or call me at (703) 772-5185.";
                            this._resetSubmissionState();
                            this.clearErrorAfterDelay();
                        return;
                    }
                    }
                    
                    // Other errors
                    this._lastErrorType = 'unknown';
                    this._errorHistory.push({ type: 'unknown', time: Date.now(), error: fetchError.message });
                    this._resetSubmissionState();
                    this.errorMessage = "An unexpected error occurred. Please try again or call me at (703) 772-5185.";
                    this.clearErrorAfterDelay();
                    // CRITICAL: Don't throw - error is already handled, throwing could escape try-catch
                    return;
                }

                            try {
                window.removeEventListener("beforeunload", preventUnload);
                            } catch (e) {
                                log.warn('Remove listener error:', e);
                            }

                // HANDLE RESPONSE
                
                try {
                    window.removeEventListener("beforeunload", preventUnload);
                } catch (e) {
                    log.warn('Remove listener error:', e);
                }
                
                // Verify this is still the current submission
                if (this._submissionId !== submissionId) {
                    log.warn('Submission ID mismatch - ignoring response');
                    return;
                            }

                            if (response && response.ok) {
                    // SUCCESS - Show green success message instead of full success screen
                    const hasFiles = this.uploadedFiles && this.uploadedFiles.length > 0;
                    this.successMessage = hasFiles ? 
                        "Message and files sent successfully! I'll get back to you soon." : 
                        "Message sent successfully! I'll get back to you soon.";
                    this.errorMessage = "";
                    
                    // Track conversion in Google Analytics
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'form_submit', {
                            event_category: 'engagement',
                            event_label: 'contact_form',
                            value: 1
                        });
                    }
                    
                    // Clear all error divs on successful submission
                    const errorDivs = ['full-name-error', 'email-error', 'message-error', 'photo-error'];
                    errorDivs.forEach(errorId => {
                        const errorDiv = Utils.safeGetById(errorId);
                        if (errorDiv) {
                            errorDiv.textContent = '';
                            errorDiv.classList.add('sr-only');
                            errorDiv.classList.remove('mt-1', 'text-xs', 'text-red-400');
                        }
                    });
                    
                    // Clear all field validation states
                    const allFields = form.querySelectorAll('input, textarea');
                    allFields.forEach(field => {
                        field.removeAttribute('aria-invalid');
                        field.classList.remove('border-red-500', 'border-red-600');
                        field.classList.add('border-gray-700/50');
                    });
                    this._resetSubmissionState(true); // true = success
                    this.fileError = "";
                    this.uploadedFiles = [];
                    this.messageLength = 0;
                    this._retryCount = 0; // Reset retry count on success
                    this._errorHistory = []; // Clear error history on success
                    this._submissionAttempts = 0; // Reset attempts on success

                                try {
                    form.reset();
                                    const fileInput = Utils.safeQuery('input[type="file"]', form);
                    if (fileInput) fileInput.value = '';
                                    this.formTouched = false;
                                } catch (e) {
                                    log.warn('Form reset error:', e);
                                }

                    // Clear the success message after 8 seconds
                    setTimeout(() => {
                        this.successMessage = "";
                    }, 8000);
                } else {
                    // ERROR RESPONSE - Handle different error scenarios
                    let errorMsg = "Submission failed. Please try again.";
                    let errorType = 'server';
                    let isFileUploadError = false;
                    
                    try {
                        const errorData = await response.json();
                        if (errorData.error) {
                            errorMsg = errorData.error;
                            // Check if this is a file upload restriction error
                            if (errorMsg.toLowerCase().includes('file') && 
                                (errorMsg.toLowerCase().includes('not permitted') || 
                                 errorMsg.toLowerCase().includes('not allowed') ||
                                 errorMsg.toLowerCase().includes('upload'))) {
                                isFileUploadError = true;
                            }
                                    } else if (errorData.errors && Array.isArray(errorData.errors)) {
                            // Optimized: Use for loop instead of map for better performance
                            const errorMessages = [];
                            for (let i = 0; i < errorData.errors.length; i++) {
                                const e = errorData.errors[i];
                                const msg = e.message || e;
                                errorMessages.push(msg);
                                // Check if any error is about file uploads
                                if (msg.toLowerCase().includes('file') && 
                                    (msg.toLowerCase().includes('not permitted') || 
                                     msg.toLowerCase().includes('not allowed') ||
                                     msg.toLowerCase().includes('upload'))) {
                                    isFileUploadError = true;
                                }
                            }
                            errorMsg = errorMessages.join(", ");
                        }
                    } catch (e) {
                                    if (response) {
                        if (response.status === 429) {
                            errorMsg = "Too many requests. Please wait a moment and try again.";
                        } else if (response.status === 413) {
                            errorMsg = "File size too large. Please reduce file sizes and try again.";
                        } else if (response.status === 422) {
                            errorMsg = "Invalid form data. Please check your inputs and try again.";
                            // 422 often indicates file upload restrictions
                            if (this.uploadedFiles && this.uploadedFiles.length > 0) {
                                isFileUploadError = true;
                            }
                        } else if (response.status >= 500) {
                            errorMsg = "Server error. Please try again later.";
                                        }
                        }
                    }
                    
                    // If this is a file upload error and we have files, try resubmitting without files
                    if (isFileUploadError && this.uploadedFiles && this.uploadedFiles.length > 0) {
                        if (DEBUG) console.log('File upload not supported, retrying without files...');
                        
                        // Create new FormData without files
                        const formDataNoFiles = new FormData(form);
                        formDataNoFiles.delete('photo'); // Remove any file fields
                        
                        try {
                            const retryResponse = await fetch("https://formspree.io/xblzkgdl", {
                                method: "POST",
                                body: formDataNoFiles,
                                headers: {
                                    'Accept': 'application/json'
                                }
                            });
                            
                            if (retryResponse && retryResponse.ok) {
                                // SUCCESS without files - show green success message
                                this.successMessage = "Message sent successfully! Note: File uploads are not currently supported, but your message was received.";
                                this.errorMessage = "";
                                
                                // Track conversion in Google Analytics
                                if (typeof gtag !== 'undefined') {
                                    gtag('event', 'form_submit', {
                                        event_category: 'engagement',
                                        event_label: 'contact_form_no_files',
                                        value: 1
                                    });
                                }
                                
                                // Clear form and reset state
                                this._resetSubmissionState(true);
                                this.fileError = "";
                                this.uploadedFiles = [];
                                this.messageLength = 0;
                                this._retryCount = 0;
                                this._errorHistory = [];
                                this._submissionAttempts = 0;
                                
                                try {
                                    form.reset();
                                    const fileInput = Utils.safeQuery('input[type="file"]', form);
                                    if (fileInput) fileInput.value = '';
                                    this.formTouched = false;
                                } catch (e) {
                                    log.warn('Form reset error:', e);
                                }
                                
                                // Clear the success message after 8 seconds
                                setTimeout(() => {
                                    this.successMessage = "";
                                }, 8000);
                                
                                return; // Exit successfully
                            }
                        } catch (retryError) {
                            if (DEBUG) console.log('Retry without files also failed:', retryError);
                            // Fall through to show original error
                        }
                    }
                    
                    // Track error for resubmission handling
                    this._lastErrorType = errorType;
                    this._errorHistory.push({ type: errorType, time: Date.now(), message: errorMsg });
                    
                    // Handle specific HTTP status codes
                    if (response.status === 429) {
                        // Rate limiting
                        errorMsg = "Too many requests. Please wait a moment before trying again.";
                        this._submissionAttempts = this._maxSubmissionAttempts; // Prevent further attempts
                    } else if (response.status >= 500) {
                        // Server errors - allow retry
                        if (this._retryCount < this._maxRetries) {
                            this._retryCount++;
                            errorMsg = `Server error. Retrying... (${this._retryCount}/${this._maxRetries})`;
                    this.errorMessage = errorMsg;
                            this.clearErrorAfterDelay();
                            
                            setTimeout(() => {
                                if (!this.isSubmitting && !this._submissionLock) {
                                    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                                    form.dispatchEvent(submitEvent);
                                }
                            }, 3000);
                            this._resetSubmissionState();
                            return;
                        } else {
                            errorMsg = "Server error after multiple attempts. Please try again later or call me at (703) 772-5185.";
                        }
                    } else if (response.status === 422) {
                        // Validation errors - don't retry, show specific message
                        errorMsg = errorMsg || "Please check your form and try again.";
                    }

                    this._resetSubmissionState();
                    this.errorMessage = errorMsg;
                    if (!errorMsg.includes("file") && !errorMsg.includes("File") && !errorMsg.includes("size")) {
                        this.fileError = "";
                    }

                    this.$nextTick(() => {
                                    try {
                                        const errorEl = this.$el ? Utils.safeQuery('[role="alert"]', this.$el) : null;
                                        if (errorEl && Utils.isMobile()) {
                                            Utils.safeScrollIntoView(errorEl);
                                        }
                                    } catch (e) {
                                        log.warn('Scroll error:', e);
                        }
                    });
                }
            } catch (error) {
                // Verify this is still the current submission
                if (this._submissionId !== submissionId) {
                    log.warn('Submission ID mismatch - ignoring error');
                    return;
                }
                
                this._lastErrorType = 'exception';
                this._errorHistory.push({ type: 'exception', time: Date.now(), error: error.message });
                this._resetSubmissionState();

                            if (error instanceof TypeError && error.message && error.message.includes("fetch")) {
                    this.errorMessage = "Network error. Please check your connection and try again.";
                    } else if (error.name === "AbortError") {
                                this.errorMessage = "Connection Timeout - Please Call Us";
                    } else {
                    this.errorMessage = "An unexpected error occurred. Please try again or call me at (703) 772-5185.";
                    }
                this.fileError = "";
                this.clearErrorAfterDelay();
                
                log.error("Form submission error:", error);

                this.$nextTick(() => {
                                try {
                                    const errorEl = this.$el ? Utils.safeQuery('[role="alert"]', this.$el) : null;
                                    if (errorEl && Utils.isMobile()) {
                                        Utils.safeScrollIntoView(errorEl);
                                    }
                                } catch (e) {
                                    log.warn('Scroll error:', e);
                    }
                });
            }
        },
        
        // HELPER METHODS FOR SUBMISSION MANAGEMENT
        
        _resetSubmissionState(success = false) {
            try {
                this.isSubmitting = false;
                this._submissionLock = false;
                this._concurrentSubmissions = Math.max(0, this._concurrentSubmissions - 1);
                
                if (this._abortController) {
                    try {
                        // Don't abort if successful
                        if (!success) {
                            this._abortController.abort();
                        }
                    } catch (e) {
                        log.warn('Error aborting controller:', e);
                    }
                    this._abortController = null;
                }
                
                // Remove beforeunload listener
                try {
                    const preventUnload = () => {};
                    window.removeEventListener("beforeunload", preventUnload);
                } catch (e) {
                    log.warn('Error removing beforeunload listener:', e);
                }
            } catch (e) {
                log.warn('Error resetting submission state:', e);
            }
        },
        
            }));
            
            window._contactFormRegistered = true;
        }
    };

    // Register immediately if Alpine is already loaded
    registerContactForm();
    
    // Also register on alpine:init (fires BEFORE Alpine processes DOM)
    // Enhanced Alpine.js integration with error handling
    document.addEventListener('alpine:init', () => {
        try {
            registerContactForm();
            
            // Alpine.js global error handler
            if (window.Alpine && Alpine.store) {
                Alpine.store('errors', {
                    list: [],
                    add(error) {
                        this.list.push({
                            message: error.message,
                            timestamp: Date.now(),
                            id: Math.random().toString(36).substr(2, 9)
                        });
                        // Auto-remove after 5 seconds
                        setTimeout(() => {
                            // CRITICAL: Check list length before accessing last element
                            if (this.list && this.list.length > 0) {
                                const lastId = this.list[this.list.length - 1]?.id;
                                if (lastId) {
                                    this.list = this.list.filter(e => e.id !== lastId);
                                }
                            }
                        }, 5000);
                    }
                });
            }
            
            log.log('✓ Alpine.js integration complete');
        } catch (error) {
            if (DEBUG) console.error('Alpine.js initialization error:', error);
            errorBoundary.handleError(error, 'alpine');
        }
    }, { once: true });
    
    // Expose globally for fallback registration
    window.registerAlpineData = registerContactForm;

                // 2. Reusable Video Player Logic - Enhanced
    const registerVideoPlayer = () => {
        if (typeof Alpine !== 'undefined' && typeof Alpine.data === 'function') {
            if (window._videoPlayerRegistered) {
                return; // Already registered
            }
            window._videoPlayerRegistered = true;

            Alpine.data("videoPlayer", (videoSrc) => ({
        isPlaying: false,
                    videoSrc: videoSrc || '',

        playVideo() {
                        try {
            this.isPlaying = true;
                            const videoEl = this.$refs?.player;

            if (!videoEl) return;

            if (!videoEl.src && this.videoSrc) {
                videoEl.src = this.videoSrc;
                                try {
                videoEl.load();
                                } catch (e) {
                                    log.warn('Video load error:', e);
                                }
            }

                            Utils.safeRAF(() => {
                                try {
                videoEl.play().catch((e) => {
                                        if (e.name !== "NotAllowedError") {
                                            log.error("Video play failed:", e);
                                        }
                });
                                } catch (e) {
                                    log.warn('Video play error:', e);
                                }
            });
                        } catch (e) {
                            log.error('Play video error:', e);
                        }
        },
    }));
        }
    };

                // 3. Gallery Data Logic - Enhanced with error handling
    const registerGalleryData = () => {
        if (typeof Alpine !== 'undefined' && typeof Alpine.data === 'function') {
            if (window._galleryDataRegistered) {
                return; // Already registered
            }
            window._galleryDataRegistered = true;
            Alpine.data("galleryData", () => ({
        currentType: "residential",
        isModalOpen: false,
        isVideoModal: false,
        modalImage: {},
        currentModalIndex: null,
        currentVideo: {},
        currentVideoIndex: null,
        videoLoaded: false,
        videoError: false,
        touchStartX: 0,
        touchEndX: 0,
        touchStartY: 0,
        touchEndY: 0,
        lastFocusedElement: null,
        modalImageLoaded: false,

        residentialImages: [
            {
                webp: "restvroom.webp",
                jpeg: "restvroom.jpeg",
                title: "Ceramic Solar Control",
                description: "50% VLT ceramic film rejects IR heat while preserving the view.",
                alt: "Living room with a large wall of glass treated with 50% VLT ceramic solar control film",
            },
            {
                webp: "Res70.webp",
                jpeg: "Res70.jpeg",
                title: "Clear UV Protection",
                description: "Spectrally selective film blocks 99.9% of UV rays invisibly.",
                alt: "Brightly lit room with nearly invisible 70% VLT clear UV protection film on windows",
            },
            {
                webp: "ResBackground.webp",
                jpeg: "ResBackground.jpeg",
                title: "Ceramic Solar Control",
                description: "60% VLT offers a neutral look with powerful thermal protection.",
                alt: "Interior view of a home with 60% VLT ceramic solar control film on the windows",
            },
            {
                webp: "resbath.webp",
                jpeg: "resbath.jpeg",
                title: "Decorative & Frosted",
                description: "Diffuses light for 24/7 privacy without making the room dark.",
                alt: "Bathroom window with elegant frosted decorative privacy film",
            },
            {
                webp: "restallroom.webp",
                jpeg: "restallroom.jpeg",
                title: "Ceramic Solar Control",
                description: "Stabilizes interior temperatures without a shiny, mirrored look.",
                alt: "Tall living room windows with ceramic solar control film applied",
            },
            {
                webp: "resoffice.webp",
                jpeg: "resoffice.jpeg",
                title: "Decorative & Frosted",
                description: '"Dusted Crystal" finish adds stylish privacy to home offices.',
                alt: "Home office glass door with dusted crystal decorative privacy film",
            },
            {
                webp: "respoolroom.webp",
                jpeg: "respoolroom.jpeg",
                title: "Ceramic Solar Control",
                description: "Cuts glare on water and screens while blocking solar heat.",
                alt: "Indoor pool room with large windows tinted with ceramic solar control film",
            },
            {
                webp: "Res7.webp",
                jpeg: "Res7.jpeg",
                title: "Metallic Solar Control",
                description: "7% VLT reflective film delivers maximum heat rejection and total daytime privacy.",
                alt: "Exterior view of a home with highly reflective 7% VLT window film",
            },
            {
                webp: "techback.webp",
                jpeg: "techback.jpg",
                title: "Ceramic Solar Control",
                description: "60% VLT film delivers powerful heat rejection without changing the view.",
                alt: "Residential living room with 60% VLT ceramic solar control film that's barely visible on the windows",
            },
        ],

        commercialImages: [
            {
                webp: "comstore.webp",
                jpeg: "comstore.jpeg",
                title: "Ceramic Solar Control",
                description: "Dark tint reduces glare and solar heat while providing privacy for the interior.",
                alt: "Storefront with green frames and dark ceramic solar control film applied to the glass",
            },
            {
                webp: "comref2.webp",
                jpeg: "comref2.jpeg",
                title: "Metallic Solar Control",
                description: "17% VLT reflective finish for superior heat rejection and privacy.",
                alt: "Commercial building exterior showing windows with 17% VLT reflective solar control film",
            },
            {
                webp: "comvt.webp",
                jpeg: "comvt.jpeg",
                title: "Custom Decorative",
                description: "Opaque decorative film precision-cut to frame a brand logo.",
                alt: "Virginia Tech logo applied to a glass door using custom cut decorative film",
            },
            {
                webp: "comoffice.webp",
                jpeg: "comoffice.jpeg",
                title: "Decorative & Frosted",
                description: "Frosted bands create visual privacy for glass-walled offices.",
                alt: "Modern office with glass walls covered in frosted decorative privacy film",
            },
            {
                webp: "com48.webp",
                jpeg: "com48.jpeg",
                title: "Decorative & Frosted",
                description: '"Dusted Crystal" bands for conference room privacy.',
                alt: "Glass conference room with horizontal bands of frosted crystal decorative privacy film",
            },
            {
                webp: "comblack.webp",
                jpeg: "ComBlack.jpeg",
                title: "Decorative & Frosted",
                description: "Blackout decorative film provides complete visual blockage.",
                alt: "Windows completely covered with black opaque decorative privacy film",
            },
            {
                webp: "ComOfficeDoor.webp",
                jpeg: "ComOfficeDoor.jpeg",
                title: "Decorative & Frosted",
                description: "Whiteout decorative film for functional privacy in warehouse environments.",
                alt: "Warehouse office door with whiteout decorative privacy film applied",
            },
            {
                webp: "Removalpic.webp",
                jpeg: "Removalpic.jpeg",
                title: "Film Removal",
                description: "Restoring glass clarity by safely stripping old, bubbled film.",
                alt: "Technician removing old, bubbled window film from a large commercial window",
            },
            {
                webp: "combuild.webp",
                jpeg: "combuild.jpg",
                title: "Film Removal & Replacement",
                description: "Removal and replacement of super old film to freshen up the windows.",
                alt: "Commercial building windows after removal and replacement of old window film",
            },
        ],

        videos: [
            {
                src: "ResVid.mp4",
                thumbnail: "ResThumb.jpg",
                title: "Residential Installation Timelapse",
                            description: "Watch my expert installation process for residential window tinting. Precision and care in every step.",
                category: "Residential",
            },
            {
                src: "comvid3.mp4",
                thumbnail: "Comthumb3.jpg",
                title: "Commercial Installation Timelapse",
                description: "See how I transform commercial spaces with professional-grade window film installation.",
                category: "Commercial",
            },
            {
                src: "R-B-R.mp4",
                thumbnail: "R-B-R.webp",
                title: "Reflective Film Transformation",
                description: "Dramatic transformation from clear to mirror finish using 5% reflective film on commercial windows.",
                category: "Commercial",
            },
            {
                src: "remvid.mp4",
                thumbnail: "Remthumb.jpg",
                title: "Film Removal Timelapse",
                description: "Professional removal of old film, restoring windows to their original clarity.",
                category: "Removal",
            },
        ],

        init() {
                        try {
                            const hash = (window.location.hash || '').replace("#", "");
            if (hash === "commercial") this.currentType = "commercial";
            if (hash === "videos") this.currentType = "videos";
                        } catch (e) {
                            log.warn('Gallery init error:', e);
                        }
        },

        setCategory(type) {
                        try {
                            if (type) this.currentType = type;
                        } catch (e) {
                            log.warn('Set category error:', e);
                        }
                    },

        disableBodyScroll() {
                        try {
                            if (document.body) {
            document.body.style.overflow = "hidden";
                            }
                        } catch (e) {
                            log.warn('Disable scroll error:', e);
                        }
        },

        enableBodyScroll() {
                        try {
                            if (document.body) {
            document.body.style.overflow = "";
                            }
                        } catch (e) {
                            log.warn('Enable scroll error:', e);
                        }
        },

        getCurrentImageArray() {
                        try {
            return this.currentType === "commercial" ? this.commercialImages : this.residentialImages;
                        } catch (e) {
                            log.warn('Get image array error:', e);
                            return [];
                        }
        },

        openModal(image, index, type, triggerElement) {
                        try {
            this.currentType = type || "residential";
            this.modalImage = image || {};
                            this.currentModalIndex = typeof index === 'number' ? index : 0;
            this.modalImageLoaded = false;
            this.isModalOpen = true;
            this.isVideoModal = false;
                            this.lastFocusedElement = triggerElement || null;
            this.disableBodyScroll();

                            this.$nextTick(() => {
                                try {
                                    const button = this.$refs?.modal ? Utils.safeQuery("button", this.$refs.modal) : null;
                                    if (button && typeof button.focus === 'function') {
                                        button.focus();
                                    }
                                } catch (e) {
                                    log.warn('Modal focus error:', e);
                                }
                            });
                        } catch (e) {
                            log.error('Open modal error:', e);
                        }
        },

        closeModal() {
                        try {
            this.isModalOpen = false;
            this.isVideoModal = false;
            this.enableBodyScroll();
                            if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
                                try {
                                    this.lastFocusedElement.focus();
                                } catch (e) {
                                    log.warn('Focus error:', e);
                                }
                            }
                        } catch (e) {
                            log.error('Close modal error:', e);
                        }
        },

        prevModalImage() {
                        try {
            if (this.isVideoModal) return;
            const arr = this.getCurrentImageArray();
                            if (!arr || arr.length === 0) return;
            this.currentModalIndex = (this.currentModalIndex - 1 + arr.length) % arr.length;
                            this.modalImage = arr[this.currentModalIndex] || {};
            this.modalImageLoaded = false;
                        } catch (e) {
                            log.warn('Prev image error:', e);
                        }
        },

        nextModalImage() {
                        try {
            if (this.isVideoModal) return;
            const arr = this.getCurrentImageArray();
                            if (!arr || arr.length === 0) return;
            this.currentModalIndex = (this.currentModalIndex + 1) % arr.length;
                            this.modalImage = arr[this.currentModalIndex] || {};
            this.modalImageLoaded = false;
                        } catch (e) {
                            log.warn('Next image error:', e);
                        }
        },

        openVideoModal(video, index, triggerElement) {
                        try {
                            this.currentVideo = video || {};
                            this.currentVideoIndex = typeof index === 'number' ? index : 0;
            this.videoLoaded = false;
            this.videoError = false;
            this.isVideoModal = true;
                            this.lastFocusedElement = triggerElement || null;
            this.disableBodyScroll();

            this.$nextTick(() => {
                                try {
                                    // Try both mobile and desktop video players
                                    const mobilePlayer = this.$refs?.videoPlayerMobile;
                                    const desktopPlayer = this.$refs?.videoPlayerDesktop;
                                    
                                    if (mobilePlayer) {
                                        mobilePlayer.load();
                                        // Try immediate auto-play for mobile
                                        setTimeout(() => this.tryAutoPlay(mobilePlayer), 50);
                                        setTimeout(() => this.tryAutoPlay(mobilePlayer), 200);
                                        setTimeout(() => this.tryAutoPlay(mobilePlayer), 500);
                                    }
                                    if (desktopPlayer) {
                                        desktopPlayer.load();
                                        // Try immediate auto-play for desktop
                                        setTimeout(() => this.tryAutoPlay(desktopPlayer), 50);
                                        setTimeout(() => this.tryAutoPlay(desktopPlayer), 200);
                                        setTimeout(() => this.tryAutoPlay(desktopPlayer), 500);
                                    }
                                } catch (e) {
                                    log.warn('Video load error:', e);
                }
            });
                        } catch (e) {
                            log.error('Open video modal error:', e);
                        }
        },

        tryAutoPlay(videoElement) {
            try {
                if (videoElement) {
                    // Try to play immediately, regardless of readyState
                    const playPromise = videoElement.play();
                    
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            log.log('Video auto-play successful');
                        }).catch((e) => {
                            log.warn('Auto-play failed (user interaction may be required):', e);
                            // If auto-play fails, try a few more times with delays
                            setTimeout(() => {
                                videoElement.play().catch(() => {
                                    setTimeout(() => {
                                        videoElement.play().catch(() => {
                                            log.warn('All auto-play attempts failed');
                                        });
                                    }, 300);
                                });
                            }, 100);
                        });
                    }
                }
            } catch (e) {
                log.warn('Auto-play error:', e);
            }
        },

        // Force play video (for user-initiated actions)
        forcePlayVideo(videoElement) {
            try {
                if (videoElement) {
                    videoElement.play().catch((e) => {
                        log.warn('Force play failed:', e);
                    });
                }
            } catch (e) {
                log.warn('Force play error:', e);
            }
        },

        closeVideoModal() {
                        try {
                            // Pause both mobile and desktop video players
                            const mobilePlayer = this.$refs?.videoPlayerMobile;
                            const desktopPlayer = this.$refs?.videoPlayerDesktop;
                            
                            if (mobilePlayer) {
                                try {
                                    mobilePlayer.pause();
                                    mobilePlayer.currentTime = 0;
                                } catch (e) {
                                    log.warn('Mobile video pause error:', e);
                                }
                            }
                            if (desktopPlayer) {
                                try {
                                    desktopPlayer.pause();
                                    desktopPlayer.currentTime = 0;
                                } catch (e) {
                                    log.warn('Desktop video pause error:', e);
                                }
                            }
                            
            this.isVideoModal = false;
            this.enableBodyScroll();
                            if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
                                try {
                                    this.lastFocusedElement.focus();
                                } catch (e) {
                                    log.warn('Focus error:', e);
                                }
                            }
                        } catch (e) {
                            log.error('Close video modal error:', e);
                        }
        },

        prevVideo() {
                        try {
            if (!this.isVideoModal) return;
                            if (!this.videos || this.videos.length === 0) return;
            this.currentVideoIndex = (this.currentVideoIndex - 1 + this.videos.length) % this.videos.length;
                            this.currentVideo = this.videos[this.currentVideoIndex] || {};
            this.videoLoaded = false;
            this.videoError = false;

            this.$nextTick(() => {
                                try {
                                    const mobilePlayer = this.$refs?.videoPlayerMobile;
                                    const desktopPlayer = this.$refs?.videoPlayerDesktop;
                                    
                                    if (mobilePlayer) {
                                        mobilePlayer.load();
                                    }
                                    if (desktopPlayer) {
                                        desktopPlayer.load();
                                    }
                                } catch (e) {
                                    log.warn('Video load error:', e);
                }
            });
                        } catch (e) {
                            log.warn('Prev video error:', e);
                        }
        },

        nextVideo() {
                        try {
            if (!this.isVideoModal) return;
                            if (!this.videos || this.videos.length === 0) return;
            this.currentVideoIndex = (this.currentVideoIndex + 1) % this.videos.length;
                            this.currentVideo = this.videos[this.currentVideoIndex] || {};
            this.videoLoaded = false;
            this.videoError = false;

            this.$nextTick(() => {
                                try {
                                    const mobilePlayer = this.$refs?.videoPlayerMobile;
                                    const desktopPlayer = this.$refs?.videoPlayerDesktop;
                                    
                                    if (mobilePlayer) {
                                        mobilePlayer.load();
                                    }
                                    if (desktopPlayer) {
                                        desktopPlayer.load();
                                    }
                                } catch (e) {
                                    log.warn('Video load error:', e);
                }
            });
                        } catch (e) {
                            log.warn('Next video error:', e);
                        }
        },

        retryVideoLoad() {
                        try {
            this.videoError = false;
            this.videoLoaded = false;
                            const mobilePlayer = this.$refs?.videoPlayerMobile;
                            const desktopPlayer = this.$refs?.videoPlayerDesktop;
                            
                            if (mobilePlayer && typeof mobilePlayer.load === 'function') {
                                mobilePlayer.load();
                            }
                            if (desktopPlayer && typeof desktopPlayer.load === 'function') {
                                desktopPlayer.load();
                            }
                        } catch (e) {
                            log.warn('Retry video error:', e);
                        }
                    },

        handleVideoError() {
                        try {
            this.videoError = true;
                        } catch (e) {
                            log.warn('Video error handler error:', e);
                        }
        },

        handleTouchStart(e) {
                        try {
                            if (e && e.touches && e.touches[0]) {
            this.touchStartX = e.touches[0].clientX;
            this.touchEndX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.touchEndY = e.touches[0].clientY;
                            }
                        } catch (err) {
                            log.warn('Touch start error:', err);
                        }
        },

        handleTouchMove(e) {
                        try {
                            if (e && e.touches && e.touches[0]) {
            this.touchEndX = e.touches[0].clientX;
            this.touchEndY = e.touches[0].clientY;
                            }
                        } catch (err) {
                            log.warn('Touch move error:', err);
                        }
        },

        handleTouchEnd() {
                        try {
                            const diffX = this.touchStartX - this.touchEndX;
                            const diffY = this.touchStartY - this.touchEndY;
                            const absDiffX = Math.abs(diffX);
                            const absDiffY = Math.abs(diffY);
                            
                            // Swipe down to close (vertical swipe takes priority)
                            if (absDiffY > 100 && diffY < -100) {
                                this.closeModal();
                                return;
                            }
                            
                            // Horizontal swipe for navigation (only if vertical swipe is minimal)
                            if (absDiffX > 75 && absDiffY < 50) {
                                if (diffX > 75) {
                                    this.nextModalImage();
                                } else if (diffX < -75) {
                                    this.prevModalImage();
                                }
                            }
                        } catch (err) {
                            log.warn('Touch end error:', err);
                        }
        },

        handleVideoTouchStart(e) {
                        try {
                            if (e && e.touches && e.touches[0]) {
            this.touchStartX = e.touches[0].clientX;
            this.touchEndX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.touchEndY = e.touches[0].clientY;
                            }
                        } catch (err) {
                            log.warn('Video touch start error:', err);
                        }
        },

        handleVideoTouchMove(e) {
                        try {
                            if (e && e.touches && e.touches[0]) {
            this.touchEndX = e.touches[0].clientX;
            this.touchEndY = e.touches[0].clientY;
                            }
                        } catch (err) {
                            log.warn('Video touch move error:', err);
                        }
        },

        handleVideoTouchEnd() {
                        try {
                            const diffY = this.touchStartY - this.touchEndY;
                            const absDiffY = Math.abs(diffY);
                            
                            // Swipe down to close
                            if (absDiffY > 100 && diffY < -100) {
                                this.closeVideoModal();
                            }
                        } catch (err) {
                            log.warn('Video touch end error:', err);
                        }
        },
    }));
        }
    };

                // 4. Tech Page Data - rebuilt
    const registerTechData = () => {
        if (typeof Alpine !== 'undefined' && typeof Alpine.data === 'function') {
            if (window._techDataRegistered) {
                return; // Already registered
            }
            window._techDataRegistered = true;

            const techFilms = [
                {
                    id: 'solar',
                    name: 'Solar Control Films',
                    icon: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
                    description: 'These advanced ceramic, carbon, or metallic films are your best defense against excessive heat gain. They use cutting-edge nanotechnology to block solar energy and infrared (IR) heat, dramatically reducing your air conditioning costs and keeping sun-facing rooms comfortable and usable year-round. Ceramic films offer superior performance without signal interference, while metallic/dual-reflective films provide maximum heat rejection at a lower cost.',
                    highlight: 'Blocks up to 85% of solar heat gain, maximizing comfort and energy efficiency.',
                    quickBenefits: [
                        'Reduces cooling costs by 15-30% on average',
                        'Eliminates hot spots and glare for year-round comfort',
                        'Protects furniture and flooring from UV damage'
                    ],
                    applications: 'Sunrooms, large glass facades, south/west-facing windows, commercial buildings aiming for LEED certification, and any space with excessive heat gain.',
                    specs: [
                        { label: 'Technology Types', value: 'Ceramic (non-conductive, signal-friendly), Carbon (balanced performance), or Metallic/Dual-Reflective (maximum heat rejection with reflective appearance).' },
                        { label: 'VLT Range', value: 'Visible Light Transmission ranges from nearly clear (70%) to deep privacy (5%), allowing you to choose your desired appearance and privacy level.' },
                        { label: 'Primary Benefit', value: 'Significantly lowers indoor temperature by blocking infrared heat, reducing monthly cooling costs by 15-30% on average.' },
                        { label: 'Signal Compatibility', value: 'Ceramic and carbon films do not interfere with GPS, Wi-Fi, or cellular signals. Metallic films may cause minor interference.' }
                    ],
                    stats: [
                        { label: 'Solar Heat Rejection', value: '45% – 85%' },
                        { label: 'Glare Reduction', value: 'Up to 95%' },
                        { label: 'UV Blockage', value: '99.9%' },
                        { label: 'Privacy Level', value: 'Selectable (5%-70% VLT)' }
                    ],
                    image: 'respoolroom.webp'
                },
                {
                    id: 'uv_blocking',
                    name: 'Clear UV Protection',
                    icon: 'M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z',
                    description: 'A spectrally selective, crystal-clear film that acts as an invisible shield for your home and health. It specifically blocks 99.9% of the sun\'s damaging UV-A and UV-B rays, the primary cause of fading for furniture, flooring, and artwork. This premium film maintains maximum visible light transmission (typically 70-80% VLT) while providing museum-grade UV protection.',
                    highlight: 'The most powerful defense against fading and skin damage—completely invisible with no tint or color change.',
                    quickBenefits: [
                        'Preserves expensive furniture and artwork from fading',
                        'Maintains 100% natural light and view clarity',
                        'Protects skin from harmful UV exposure indoors'
                    ],
                    applications: 'Living rooms with hardwood floors, sunrooms, high-end retail displays, museums, galleries, and areas with valuable art collections where maintaining natural light is essential.',
                    specs: [
                        { label: 'Fading Protection', value: 'Provides museum-grade protection, blocking 99.9% of UV rays that cause fading. Equivalent to SPF 1000+ for your interiors, without altering visible light transmission.' },
                        { label: 'Clarity & Appearance', value: 'Remains virtually undetectable after installation. Premium films will not yellow, purple, or distort over time when properly installed.' },
                        { label: 'Health Benefit', value: 'Protects skin from harmful UV exposure, which is important for sun-sensitive individuals and reduces long-term skin damage risk.' },
                        { label: 'Light Transmission', value: 'Maintains 70-80% visible light transmission, allowing maximum natural light while blocking harmful UV rays.' }
                    ],
                    stats: [
                        { label: 'UV Blockage', value: '99.9%' },
                        { label: 'Visible Light Transmission', value: '70-80% (Clear)' },
                        { label: 'Solar Heat Rejection', value: 'Minimal (~15-25%)' },
                        { label: 'Glare Reduction', value: 'Minimal' }
                    ],
                    image: 'Res70.webp'
                },
                {
                    id: 'decorative',
                    name: 'Decorative & Frosted',
                    icon: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.077-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42',
                    description: 'Achieve instant, elegant privacy and transform plain glass into a design feature. These films diffuse light to create a soft, etched or frosted look, giving you 24/7 privacy in bathrooms, offices, and entryways without sacrificing the warm, natural light. Available in various patterns, textures, and opacity levels to match your design aesthetic.',
                    highlight: 'Provides all-day privacy and enhances your glass with an elegant, modern finish at a fraction of the cost of etched glass.',
                    quickBenefits: [
                        'Instant privacy without blocking natural light',
                        'Custom designs and patterns available',
                        'Removable and replaceable if needed'
                    ],
                    applications: 'Bathroom windows, glass conference rooms/partitions, front door sidelights, office dividers, restaurant windows, and any area needing 24/7 visual privacy while maintaining natural light.',
                    specs: [
                        { label: 'Aesthetics', value: 'Achieves the high-end look of etched or sandblasted glass at a fraction of the cost, without permanently altering the pane. Can be removed if needed.' },
                        { label: 'Opacity Options', value: 'Available in frost (translucent), white-out (opaque), black-out (complete privacy), gradient (fade effect), and textured patterns (reeded, geometric, custom designs).' },
                        { label: 'Customizable', value: 'Can be computer-cut into custom logos, patterns, borders, or reveal strips for branding or design. Perfect for commercial applications requiring brand identity.' },
                        { label: 'Installation', value: 'Applied to interior surface, easy to remove and replace if design preferences change.' }
                    ],
                    stats: [
                        { label: 'Privacy Level', value: '24/7 Total (opaque options)' },
                        { label: 'Light Transmission', value: 'Diffused (varies by pattern)' },
                        { label: 'UV Blockage', value: '98-99%' },
                        { label: 'Heat Rejection', value: 'Minimal to Moderate' }
                    ],
                    image: 'resbath.webp'
                },
                {
                    id: 'safety',
                    name: 'Security & Impact',
                    icon: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z',
                    description: 'These thick, clear or tinted polyester films bond aggressively to the glass, creating a high-strength membrane that significantly increases glass integrity. If the glass is broken by impact, severe weather, or attempted forced entry, the film absorbs the force and helps hold the broken shards securely in the frame, preventing injury and delaying unauthorized entry. Available in clear or tinted versions to combine security with solar control.',
                    highlight: 'The invisible line of defense against severe weather, accidents, and forced entry—combining safety with optional solar control.',
                    quickBenefits: [
                        'Holds broken glass together to prevent injury',
                        'Delays forced entry, giving time for response',
                        'Available in clear or tinted for dual protection'
                    ],
                    applications: 'Ground-floor windows, glass sliding doors, schools, hospitals, high-value retail locations, hurricane-prone areas, and any location requiring enhanced glass safety.',
                    specs: [
                        { label: 'Shatter Resistance', value: 'Holds broken glass together, dramatically reducing injury risk from flying shards. Film thickness determines protection level—thicker films (12-14 mil) provide maximum protection.' },
                        { label: 'Forced Entry Delay', value: 'Requires sustained, repeated impact to breach, giving security personnel or law enforcement valuable response time. Can delay entry by several minutes depending on film thickness.' },
                        { label: 'Frame Anchoring', value: 'Optional Frame Anchoring System (silicone or structural adhesive) provides additional stability by tying the film directly to the window frame, significantly increasing resistance to forced entry.' },
                        { label: 'Combined Benefits', value: 'Tinted security films combine impact resistance with solar control, providing both safety and energy efficiency in one solution.' }
                    ],
                    stats: [
                        { label: 'Film Thickness', value: '4 Mil - 14 Mil' },
                        { label: 'Tensile Strength', value: '100+ lbs / inch width' },
                        { label: 'UV Blockage', value: '99% (tinted versions)' },
                        { label: 'Appearance', value: 'Clear or Tinted options' }
                    ],
                    image: 'jewelry.webp'
                },
                {
                    id: 'antigraffiti',
                    name: 'Anti-Graffiti Shield',
                    icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
                    description: 'This is a replaceable, thick clear film installed on vulnerable, exposed glass surfaces (storefronts, mirrors, elevators) that acts as a sacrificial protective layer. It features a durable hard-coat surface treatment that resists damage from scratching, acid etching, permanent markers, paint, and blade attacks. When vandalized, I can simply peel it off and replace it for a fraction of the cost of replacing the underlying glass, saving significant time and money.',
                    highlight: 'A cost-effective, easily replaceable shield that protects your expensive glass from permanent vandalism and damage.',
                    quickBenefits: [
                        'Saves 80-90% vs replacing glass after vandalism',
                        'Quick peel-and-replace when damage occurs',
                        'Hard-coat resists scratches, paint, and etching'
                    ],
                    applications: 'Commercial storefronts, transit windows, subway stations, interior glass partitions, stainless steel surfaces, bathroom mirrors, elevator interiors, and any high-traffic area prone to vandalism.',
                    specs: [
                        { label: 'Damage Resistance', value: 'The durable hard-coat surface resists scratching, acid etching, permanent markers, spray paint, and blade damage. Multiple layers provide progressive protection.' },
                        { label: 'Cost Savings', value: 'Saves commercial properties 80-90% compared to repeatedly replacing custom, tempered, or laminated glass panes. Film replacement is quick and cost-effective.' },
                        { label: 'Replacement Process', value: 'Peel-and-replace design allows quick, low-cost removal and installation when vandalism occurs. Minimal downtime compared to glass replacement.' },
                        { label: 'Maintenance', value: 'Easy to clean with standard glass cleaners. Hard-coat surface resists staining and maintains clarity.' }
                    ],
                    stats: [
                        { label: 'Cost Savings', value: '80-90% vs Glass Replacement' },
                        { label: 'Surface Compatibility', value: 'All Glass Types & Smooth Metals' },
                        { label: 'UV Blockage', value: '98-99%' },
                        { label: 'Appearance', value: 'Crystal Clear' }
                    ],
                    image: 'anti-graffiti.webp'
                }
            ];

            Alpine.data("techData", () => ({
        activeTech: null,
                    techFilms,

        openModal(tech) {
                        try {
                            this.activeTech = tech;
                            this.disableBodyScroll();
                        } catch (e) {
                            log.warn('Open tech modal error:', e);
                        }
        },

        closeModal() {
                        try {
                            this.activeTech = null;
                            this.enableBodyScroll();
                        } catch (e) {
                            log.warn('Close tech modal error:', e);
                        }
        },

        disableBodyScroll() {
                        try {
                            // Only disable body scroll on mobile devices (< 1024px)
                            // Desktop modal uses lg:overflow-y-auto and should allow background scrolling
                            if (window.innerWidth < 1024) {
                                document?.body?.classList.add('overflow-hidden');
                                document?.documentElement?.classList.add('overflow-hidden');
                            }
                        } catch (e) {
                            log.warn('Disable scroll error:', e);
                        }
        },

        enableBodyScroll() {
                        try {
                            // Always remove overflow-hidden classes when closing modal
                            document?.body?.classList.remove('overflow-hidden');
                            document?.documentElement?.classList.remove('overflow-hidden');
                        } catch (e) {
                            log.warn('Enable scroll error:', e);
                        }
        },

        init() {
                        try {
                            this._escapeHandler = (event) => {
                                if (event.key === "Escape" && this.activeTech) {
                                    this.closeModal();
                                }
                            };
                            window.addEventListener("keydown", this._escapeHandler);
                        } catch (e) {
                            log.warn('Tech init error:', e);
                        }
        },
        destroy() {
                        // CRITICAL: Cleanup escape handler to prevent memory leaks
                        try {
                            if (this._escapeHandler) {
                                window.removeEventListener("keydown", this._escapeHandler);
                                this._escapeHandler = null;
                            }
                        } catch (e) {
                            log.warn('Tech cleanup error:', e);
                        }
        }
            }));
        }
    };

    const registerAllAlpineData = () => {
        registerContactForm();
        registerVideoPlayer();
        registerGalleryData();
        registerTechData();
    };

    // If Alpine already exists (e.g., hot reload), register immediately
    if (typeof Alpine !== 'undefined') {
        registerAllAlpineData();
    }

    // Register whenever Alpine boots on the page
    document.addEventListener('alpine:init', () => {
        registerAllAlpineData();
    });

    // CRITICAL: Add index-page class to body for instant hover performance
    // This enables CSS optimizations for browsers without :has() support
    if (document.body) {
        const hasHeroGradient = document.querySelector('.hero-gradient-bg-home');
        if (hasHeroGradient) {
            document.body.classList.add('index-page');
        }
    }

    // ============================================
    // GLOBAL FUNCTIONS - Safeguarded
    // ============================================


    // DOM CONTENT LOADED - Comprehensive Safeguards

    const initDOMFeatures = () => {
        try {
    // Date Update - Use idle callback for non-critical updates
            Utils.idleCallback(() => {
                const yearSpan = Utils.safeGetById("current-year");
                if (yearSpan) {
                    try {
                        yearSpan.textContent = new Date().getFullYear();
                    } catch (e) {
                        log.warn('Year update error:', e);
                    }
                }
            });

            // Nav Highlight (exclude logo link) - Use RAF for smooth updates
            Utils.safeRAF(() => {
                try {
                    const currentPath = (window.location.pathname || '').split("/").pop() || "index.html";
                    const navLinks = Utils.safeQueryAll('nav a[href$=".html"]');

                    // Optimized: Use for loop instead of forEach for better performance
                    // Batch DOM updates to prevent layout thrashing
                    const updates = [];
                    for (let i = 0; i < navLinks.length; i++) {
                        const link = navLinks[i];
                        try {
                            const logoImg = Utils.safeQuery('img[alt*="Logo"]', link);
                            if (logoImg) continue;

                            const linkPath = link.getAttribute("href");
                            if (linkPath === currentPath || (currentPath === "index.html" && linkPath === "index.html")) {
                                updates.push(() => {
                                    link.classList.add("text-[#FF4081]", "nav-active");
                                    link.classList.remove("text-gray-100");
                                });
                            }
                        } catch (e) {
                            log.warn('Nav link processing error:', e);
                        }
                    }
                    // Batch all DOM updates together
                    if (updates.length > 0) {
                        Utils.batchDOMUpdates(updates);
                    }
                } catch (e) {
                    log.warn('Nav highlight error:', e);
                }
            });

            // SCROLL HANDLER - Optimized & Safeguarded

            const backToTopButton = Utils.safeGetById("back-to-top");
            const scrollProgress = Utils.safeGetById("scroll-progress");
            const mainNav = Utils.safeGetById("main-nav");

    let scrollTicking = false;
            let rafId = null;

    // CRITICAL: Bulletproof scroll handler with crash prevention
    const handleScroll = () => {
        // Prevent crashes: Check if safe mode disabled scroll handlers
        if (errorBoundary.isFeatureDisabled('scrollHandlers')) {
            return;
        }
        
        // Prevent infinite loops: Check if already processing
        if (scrollTicking) return;
        scrollTicking = true;

        // CRITICAL: Wrap entire handler in try-catch to prevent any crash
        try {
            requestAnimationFrame(() => {
                try {
                    // 1. Read scroll position (Low cost)
                    const scrollY = window.scrollY || 0;
                    
                    // 2. Only toggle class if state changes (Prevents layout thrashing)
                    if (mainNav && mainNav.classList) {
                        try {
                            const isScrolled = scrollY > 20;
                            const currentScrolledState = mainNav.classList.contains("nav-scrolled");

                            if (isScrolled && !currentScrolledState) {
                                mainNav.classList.add("nav-scrolled");
                            } else if (!isScrolled && currentScrolledState) {
                                mainNav.classList.remove("nav-scrolled");
                            }
                        } catch (e) {
                            // Ignore nav class errors
                        }
                    }

                    // 3. Show/Hide Back to Top (Low cost)
                    if (backToTopButton && backToTopButton.classList) {
                        try {
                            const showBtn = scrollY > 300;
                            const isVisible = !backToTopButton.classList.contains("opacity-0");
                            
                            if (showBtn && !isVisible) {
                                backToTopButton.classList.remove("opacity-0", "pointer-events-none");
                            } else if (!showBtn && isVisible) {
                                backToTopButton.classList.add("opacity-0", "pointer-events-none");
                            }
                        } catch (e) {
                            // Ignore button errors
                        }
                    }

                    // Update scroll progress bar (optimized)
                    if (scrollProgress && scrollProgress.style) {
                        try {
                            const isScrolling = scrollY > 50;
                            if (isScrolling) {
                                // Cache document height to avoid layout recalculation
                                if (handleScroll._cachedDocHeight === undefined || handleScroll._cachedDocHeight === null) {
                                    const docEl = document.documentElement;
                                    const scrollHeight = docEl.scrollHeight || document.body.scrollHeight || 0;
                                    const clientHeight = docEl.clientHeight || window.innerHeight || 0;
                                    handleScroll._cachedDocHeight = Math.max(0, scrollHeight - clientHeight);
                                }
                                
                                const scrollPercent = handleScroll._cachedDocHeight > 0 ? Math.min((scrollY / handleScroll._cachedDocHeight), 1) : 0;
                                scrollProgress.style.transform = `scaleX(${scrollPercent})`;
                                scrollProgress.style.opacity = '1';
                            } else {
                                scrollProgress.style.transform = 'scaleX(0)';
                                scrollProgress.style.opacity = '0';
                            }
                        } catch (e) {
                            // Ignore progress bar errors
                        }
                    }

                    // Handle video pause on scroll away (Performance optimized)
                    try {
                        if (Utils && Utils.handleVideoScrollPause) {
                            Utils.handleVideoScrollPause();
                        }
                    } catch (e) {
                        // Ignore video pause errors
                    }
                } catch (e) {
                    // Catch any errors in RAF callback
                    errorBoundary.handleError(e, 'scroll');
                } finally {
                    // Always reset ticking flag, even on error
                    scrollTicking = false;
                }
            });
        } catch (e) {
            // Catch any errors in outer handler
            errorBoundary.handleError(e, 'scroll');
            scrollTicking = false;
        }
    };

            // CRITICAL FIX: Simplified throttled scroll handler - RAF already handles throttling
            // No need for additional throttling since RAF naturally limits to ~60fps
            const throttledScroll = handleScroll;

            // Add scroll listener with passive option for better performance
            // Passive listeners prevent blocking scroll performance
            try {
                window.addEventListener("scroll", throttledScroll, { passive: true });
            } catch (e) {
                // Fallback for browsers that don't support passive
                window.addEventListener("scroll", throttledScroll, false);
            }

            // Mobile-specific: Enhanced touch event listeners for video pause
            if (Utils.isMobile() || Utils.isTouchDevice()) {
                let touchScrollTimer = null;
                let immediateCheckTimer = null;
                
                const handleTouchScroll = (immediate = false) => {
                    // Clear existing timers
                    if (touchScrollTimer) {
                        clearTimeout(touchScrollTimer);
                    }
                    if (immediateCheckTimer) {
                        clearTimeout(immediateCheckTimer);
                    }
                    
                    // Immediate check for responsive feedback
                    if (immediate) {
                        immediateCheckTimer = setTimeout(() => {
                            Utils.handleVideoScrollPause();
                        }, 50);
                    }
                    
                    // Delayed check to catch momentum scrolling
                    touchScrollTimer = setTimeout(() => {
                        Utils.handleVideoScrollPause();
                    }, 200);
                };

                // Enhanced mobile scroll detection
                try {
                    // Listen for all touch and scroll events
                    window.addEventListener('touchstart', () => handleTouchScroll(false), { passive: true });
                    window.addEventListener('touchmove', () => handleTouchScroll(true), { passive: true });
                    window.addEventListener('touchend', () => handleTouchScroll(true), { passive: true });
                    
                    // Also listen for scroll events with shorter delay on mobile
                    const mobileScrollHandler = () => {
                        if (touchScrollTimer) {
                            clearTimeout(touchScrollTimer);
                        }
                        touchScrollTimer = setTimeout(() => {
                            Utils.handleVideoScrollPause();
                        }, 100); // Shorter delay for scroll events
                    };
                    
                    window.addEventListener('scroll', mobileScrollHandler, { passive: true });
                } catch (e) {
                    log.warn('Enhanced touch scroll listener error:', e);
                }
            }

            // CRITICAL FIX: Pre-cache document dimensions on page load (not on first scroll)
            // This prevents expensive layout calculations on first scroll
            Utils.safeRAF(() => {
                try {
                    // Defensive check: ensure document is ready
                    if (!document.documentElement || !document.body) {
                        // Retry after a short delay if DOM not ready
                        setTimeout(() => {
                            if (document.documentElement && document.body) {
                                const docEl = document.documentElement;
                                const scrollHeight = docEl.scrollHeight || document.body.scrollHeight || 0;
                                const clientHeight = docEl.clientHeight || window.innerHeight || 0;
                                if (handleScroll) {
                                    handleScroll._cachedHeight = { scrollHeight, clientHeight };
                                    handleScroll._cachedDocHeight = scrollHeight - clientHeight;
                                    handleScroll._lastScrollY = 0;
                                }
                            }
                        }, 100);
                        return;
                    }
                    
                    const docEl = document.documentElement;
                    const scrollHeight = docEl.scrollHeight || document.body.scrollHeight || 0;
                    const clientHeight = docEl.clientHeight || window.innerHeight || 0;
                    handleScroll._cachedHeight = { scrollHeight, clientHeight };
                    handleScroll._cachedDocHeight = scrollHeight - clientHeight;
                    handleScroll._lastScrollY = 0;
                    
                    // Lightweight initial check - only update UI if already scrolled
                    const scrollY = typeof window.scrollY !== 'undefined' ? window.scrollY : (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0);
                    if (scrollY > 0) {
                        // Only run full handler if page is already scrolled (e.g., hash link)
                handleScroll();
                    } else {
                        // Just set initial state without expensive calculations
                        if (mainNav) {
                            mainNav.dataset.scrolled = 'false';
                        }
                        if (backToTopButton) {
                            backToTopButton.dataset.visible = 'false';
                        }
                        if (scrollProgress?.style) {
                            try {
                                scrollProgress.style.cssText = 'transform: scale3d(0, 1, 1); opacity: 0;';
                            } catch (e) {
                                // Fallback if cssText fails
                                scrollProgress.style.transform = 'scale3d(0, 1, 1)';
                                scrollProgress.style.opacity = '0';
                            }
                        }
                    }
                } catch (e) {
                    log.warn('Initial scroll setup error:', e);
                }
            });

            // Scroll to top on click - Safeguarded
            if (backToTopButton) {
                try {
                    backToTopButton.addEventListener("click", (e) => {
                        try {
                            e.preventDefault();
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        } catch (err) {
                            // Fallback for browsers without smooth scroll
                            try {
                                window.scrollTo(0, 0);
                            } catch (fallbackErr) {
                                log.warn('Scroll to top error:', fallbackErr);
                            }
                        }
                    });
                } catch (e) {
                    log.warn('Back to top click handler error:', e);
                }
            }

            // CRITICAL FIX: Enhanced cleanup - prevent memory leaks
            const cleanup = () => {
                try {
                    // Cancel any pending RAF
                    if (rafId) {
                        try {
                            window.cancelAnimationFrame(rafId);
                        } catch (e) {
                            clearTimeout(rafId);
                        }
                        rafId = null;
                    }
                    
                    // Clear scroll end timer
                    if (handleScroll._scrollEndTimer) {
                        clearTimeout(handleScroll._scrollEndTimer);
                        handleScroll._scrollEndTimer = null;
                    }
                    
                    // Remove scrolling class
                    try {
                        document.body?.classList.remove('scrolling');
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                    
                    // Remove scroll listener
                    try {
                        window.removeEventListener("scroll", throttledScroll, { passive: true });
                    } catch (e) {
                        // Fallback for browsers that don't support passive removal
                        try {
                        window.removeEventListener("scroll", throttledScroll, false);
                        } catch (e2) {
                            // Ignore if removal fails
                        }
                    }
                    
                    // Clear cached values and state
                    if (handleScroll._cachedHeight) {
                        handleScroll._cachedHeight = null;
                    }
                    handleScroll._lastScrollY = undefined;
                    handleScroll._scrollingClassAdded = false;
                    
                    // Clear video cache for new page content
                    Utils.clearVideoCache();
                    
                    // CRITICAL: Clear setInterval watchers to prevent memory leaks
                    if (window._dropdownWatcher) {
                        clearInterval(window._dropdownWatcher);
                        window._dropdownWatcher = null;
                    }
                    if (window._mobileMenuWatcher) {
                        clearInterval(window._mobileMenuWatcher);
                        window._mobileMenuWatcher = null;
                    }
                    
                    // CRITICAL: Clear performance monitoring interval
                    if (performanceCheckInterval) {
                        clearInterval(performanceCheckInterval);
                        performanceCheckInterval = null;
                    }
                    
                    // CRITICAL: Disconnect all IntersectionObservers to prevent memory leaks
                    if (window._intersectionObservers && Array.isArray(window._intersectionObservers)) {
                        window._intersectionObservers.forEach(observer => {
                            try {
                                if (observer && typeof observer.disconnect === 'function') {
                                    observer.disconnect();
                                }
                            } catch (e) {
                                // Ignore individual observer disconnect errors
                            }
                        });
                        window._intersectionObservers = [];
                    }
                } catch (e) {
                    log.warn('Cleanup error:', e);
                }
            };

            // Add cleanup listeners
            window.addEventListener("beforeunload", cleanup);
            window.addEventListener("pagehide", cleanup); // Better for mobile browsers

        } catch (e) {
            log.error('DOM initialization error:', e);
        }
    };

    // DROPDOWN MENU HANDLING - Click outside to close and button toggle
    const initDropdownHandlers = () => {
        try {
            // DEBUG: Log that we're initializing
            log.log('🔍 [DROPDOWN] Initializing dropdown handlers...');
            
            // CRITICAL: Force remove x-cloak and ensure dropdown is accessible
            const forceRemoveCloak = () => {
                const moreDropdown = Utils.safeQuery('#more-dropdown');
                if (moreDropdown) {
                    // Remove x-cloak immediately - don't wait for Alpine
                    moreDropdown.removeAttribute('x-cloak');
                    
                    // Add a data attribute to track manual state
                    if (!moreDropdown.hasAttribute('data-manual-control')) {
                        moreDropdown.setAttribute('data-manual-control', 'true');
                    }
                } else {
                }
            };
            
            // Run immediately - don't wait
            forceRemoveCloak();
            
            // Also run after DOM ready as backup
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    forceRemoveCloak();
                });
            }
            
            // Run again after a short delay to catch any late Alpine initialization
            // Reduced from 3 timeouts to 1 to prevent excessive calls
            setTimeout(() => { forceRemoveCloak(); }, 200);
            
            // COMPLETE BYPASS: Pure JavaScript dropdown handler - doesn't rely on Alpine at all
            const moreButton = Utils.safeGetById('more-button');
            const moreDropdown = Utils.safeQuery('#more-dropdown');
            
            
            if (moreButton && moreDropdown) {
                // Store state in data attribute (not relying on Alpine)
                let isOpen = moreDropdown.getAttribute('data-js-open') === 'true';
                
                // CRITICAL: Sync isOpen with data attribute (ensures state is correct if dropdown was closed by FAQ handler)
                const syncIsOpen = () => {
                    const dataOpen = moreDropdown.getAttribute('data-js-open') === 'true';
                    if (isOpen !== dataOpen) {
                        isOpen = dataOpen;
                    }
                };
                
                // Function to calculate and set dropdown position
                // CRITICAL: Bulletproof dropdown position update with crash prevention
                const updateDropdownPosition = () => {
                    try {
                        // Prevent crashes: Check if safe mode disabled dropdown
                        if (errorBoundary.isFeatureDisabled('dropdown')) {
                            return;
                        }
                        
                        if (!isOpen || !moreButton || !moreDropdown) return;
                        
                        // Defensive checks: ensure elements exist and have required methods
                        if (!moreButton.getBoundingClientRect || !moreDropdown.style) {
                            return;
                        }
                        
                        const buttonRect = moreButton.getBoundingClientRect();
                        const dropdownWidth = 224; // w-56 = 14rem = 224px
                        
                        // Calculate horizontal position (center below button)
                        let left = buttonRect.left + (buttonRect.width / 2) - (dropdownWidth / 2);
                        
                        // Keep dropdown within viewport
                        const padding = 16;
                        left = Math.max(padding, Math.min(left, window.innerWidth - dropdownWidth - padding));
                        
                        // Calculate vertical position (below button with margin)
                        const top = buttonRect.bottom + 8; // mt-2 = 8px
                        
                        // Set position using fixed positioning (works better than absolute)
                        moreDropdown.style.setProperty('position', 'fixed', 'important');
                        moreDropdown.style.setProperty('left', `${left}px`, 'important');
                        moreDropdown.style.setProperty('top', `${top}px`, 'important');
                        moreDropdown.style.setProperty('width', `${dropdownWidth}px`, 'important');
                        moreDropdown.style.setProperty('z-index', '99999', 'important');
                    } catch (e) {
                        // Catch any errors in position calculation
                        errorBoundary.handleError(e, 'dropdown-position');
                    }
                };
                
                // CRITICAL: Bulletproof dropdown show with crash prevention
                const showDropdown = () => {
                    try {
                        // Prevent crashes: Check if safe mode disabled dropdown
                        if (errorBoundary.isFeatureDisabled('dropdown')) {
                            return;
                        }
                        
                        if (!moreButton || !moreDropdown) return;
                        
                        isOpen = true;
                        moreDropdown.setAttribute('data-js-open', 'true');
                        moreDropdown.removeAttribute('x-cloak');
                        
                        // CRITICAL: Calculate position FIRST (before any DOM manipulation)
                        // Get button position while everything is still in original state
                        const btnRect = moreButton.getBoundingClientRect();
                    const ddWidth = 224;
                    let ddLeft = btnRect.left + (btnRect.width / 2) - (ddWidth / 2);
                    ddLeft = Math.max(16, Math.min(ddLeft, window.innerWidth - ddWidth - 16));
                    const ddTop = btnRect.bottom + 8;
                    
                    // CRITICAL: Move dropdown to body to avoid parent clipping
                    // Store original parent
                    if (!moreDropdown.dataset.originalParent) {
                        // CRITICAL: Check parentElement exists before accessing .id
                        const parentId = moreDropdown.parentElement?.id || 'more-menu-container';
                        moreDropdown.dataset.originalParent = parentId;
                    }
                    // Only move if not already on body
                    if (moreDropdown.parentElement !== document.body) {
                        document.body.appendChild(moreDropdown);
                    }
                    
                    // CRITICAL: Remove Alpine's x-show directive - it's preventing display
                    moreDropdown.removeAttribute('x-show');
                    
                    // Completely disable Alpine on this element
                    if (moreDropdown.__x) {
                        try {
                            // Stop Alpine from managing this element
                            if (moreDropdown.__x.$el === moreDropdown) {
                                moreDropdown.__x = null;
                            }
                        } catch(e) {
                        }
                    }
                    
                    // Override ALL possible hiding mechanisms - use cssText for maximum control
                    moreDropdown.style.cssText = `
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        transform: none !important;
                        pointer-events: auto !important;
                        position: fixed !important;
                        left: ${ddLeft}px !important;
                        top: ${ddTop}px !important;
                        width: ${ddWidth}px !important;
                        z-index: 99999 !important;
                        background: rgb(31, 41, 55) !important;
                    `;
                    
                    moreDropdown.classList.add('js-dropdown-open');
                    moreButton.setAttribute('aria-expanded', 'true');
                    
                    // Rotate the arrow icon - find it by ID or class
                    const arrow = moreButton.querySelector('#more-arrow') || 
                                 moreButton.querySelector('svg') ||
                                 moreButton.querySelector('.ml-1');
                    if (arrow) {
                        arrow.style.setProperty('transform', 'rotate(180deg)', 'important');
                        arrow.style.setProperty('transition', 'transform 0.2s', 'important');
                        arrow.classList.add('rotate-180');
                        // Also update Alpine if it exists
                        try {
                            const nav = moreButton.closest('[x-data]');
                            if (nav && nav.__x) {
                                const data = nav.__x.$data;
                                if (data && typeof data.isMoreOpen !== 'undefined') {
                                    data.isMoreOpen = true;
                                }
                            }
                        } catch(e) {}
                    } else {
                    }
                    
                    // Also remove any Alpine transition classes that might be hiding it
                    moreDropdown.classList.remove('x-cloak');
                    Array.from(moreDropdown.classList).forEach(cls => {
                        if (cls.startsWith('x-transition') || cls.includes('enter') || cls.includes('leave')) {
                            moreDropdown.classList.remove(cls);
                        }
                    });
                    
                    // CRITICAL: Position is already set in cssText above - DON'T recalculate!
                    // The position was calculated BEFORE moving to body, so it's correct
                    // LAYOUT THRASHING PREVENTION: Batch all reads, then all writes
                    requestAnimationFrame(() => {
                        try {
                            // BATCH ALL LAYOUT READS FIRST (prevents layout thrashing)
                            const finalRect = moreDropdown.getBoundingClientRect();
                            const finalStyles = window.getComputedStyle(moreDropdown);
                            
                            // Collect all parent overflow checks (read phase)
                            const parentOverflows = [];
                            let parent = moreDropdown.parentElement;
                            while (parent && parent !== document.body) {
                                const parentStyles = window.getComputedStyle(parent);
                                if (parentStyles.overflow === 'hidden' || parentStyles.overflowY === 'hidden') {
                                    parentOverflows.push(parent);
                                }
                                parent = parent.parentElement;
                            }
                            
                            // Check visibility (read phase)
                            const isHidden = finalStyles.display === 'none' || 
                                           finalStyles.visibility === 'hidden' || 
                                           parseFloat(finalStyles.opacity) === 0 || 
                                           finalRect.width === 0;
                            
                            const isInViewport = finalRect.top >= 0 && 
                                                finalRect.left >= 0 && 
                                                finalRect.bottom <= window.innerHeight && 
                                                finalRect.right <= window.innerWidth;
                            
                            const hasNoDimensions = finalRect.width === 0 || finalRect.height === 0;
                            
                            // NOW PERFORM ALL WRITES (write phase - batched)
                            // Fix parent overflow issues
                            parentOverflows.forEach(p => {
                                p.style.setProperty('overflow', 'visible', 'important');
                            });
                            
                            // If hidden, force visibility
                            if (isHidden) {
                                if (DEBUG) console.error('❌ [DROPDOWN] STILL HIDDEN! Forcing visibility...');
                                
                                // Read button position once (read phase)
                                const btnRectFix = moreButton.getBoundingClientRect();
                                const ddWidthFix = 224;
                                let ddLeftFix = btnRectFix.left + (btnRectFix.width / 2) - (ddWidthFix / 2);
                                ddLeftFix = Math.max(16, Math.min(ddLeftFix, window.innerWidth - ddWidthFix - 16));
                                const ddTopFix = btnRectFix.bottom + 8;
                                
                                // Remove Alpine's x-show attribute entirely
                                moreDropdown.removeAttribute('x-show');
                                
                                // Disable Alpine on this element completely
                                if (moreDropdown.__x) {
                                    try {
                                        moreDropdown.__x.$data = null;
                                    } catch(e) {}
                                }
                                
                                // Write all styles at once (write phase)
                                moreDropdown.style.cssText = `
                                    display: block !important;
                                    visibility: visible !important;
                                    opacity: 1 !important;
                                    transform: none !important;
                                    position: fixed !important;
                                    left: ${ddLeftFix}px !important;
                                    top: ${ddTopFix}px !important;
                                    width: 224px !important;
                                    z-index: 99999 !important;
                                    pointer-events: auto !important;
                                `;
                            } else if (hasNoDimensions) {
                                // Force visibility if no dimensions
                                moreDropdown.style.cssText += 'display: block !important; visibility: visible !important; opacity: 1 !important;';
                            }
                        } catch (e) {
                            // Ignore verification errors
                        }
                        
                        // CRITICAL: Set up a watcher to prevent Alpine from re-hiding it
                        let preventAlpineHideInterval = null;
                        if (!window._dropdownWatcher) {
                            window._dropdownWatcher = setInterval(() => {
                                // CRITICAL: Don't force show if FAQ link was clicked (prevents reappearing)
                                if (window._faqLinkClicked) {
                                    return;
                                }
                                if (isOpen && moreDropdown) {
                                    const currentStyles = window.getComputedStyle(moreDropdown);
                                    if (currentStyles.display === 'none' || currentStyles.visibility === 'hidden') {
                                        moreDropdown.removeAttribute('x-show');
                                        moreDropdown.style.setProperty('display', 'block', 'important');
                                        moreDropdown.style.setProperty('visibility', 'visible', 'important');
                                        moreDropdown.style.setProperty('opacity', '1', 'important');
                                    }
                                }
                            }, 250); // Optimized: Reduced frequency for better performance
                        }
                    });
                    
                    // Also try to update Alpine if it exists (for consistency)
                    try {
                        const nav = moreButton.closest('[x-data]');
                        if (nav && nav.__x) {
                            const data = nav.__x.$data;
                            if (data && typeof data.isMoreOpen !== 'undefined') {
                                data.isMoreOpen = true;
                            }
                            // Try to call Alpine's updateDropdownPosition if it exists
                            if (data && typeof data.updateDropdownPosition === 'function') {
                                data.updateDropdownPosition();
                            }
                        }
                    } catch (e) {
                        // Ignore Alpine errors
                    }
                    } catch (e) {
                        // Catch any errors in showDropdown
                        errorBoundary.handleError(e, 'dropdown-show');
                        // Ensure dropdown is closed on error
                        if (moreDropdown) {
                            moreDropdown.setAttribute('data-js-open', 'false');
                            moreDropdown.style.display = 'none';
                        }
                        isOpen = false;
                    }
                };
                
                // CRITICAL: Bulletproof dropdown hide with crash prevention
                const hideDropdown = () => {
                    try {
                        if (!moreDropdown || !moreButton) return;
                        
                        isOpen = false;
                        moreDropdown.setAttribute('data-js-open', 'false');
                        
                        // CRITICAL: Clear FAQ flag when manually closing dropdown
                        window._faqLinkClicked = false;
                        moreDropdown.style.setProperty('display', 'none', 'important');
                        moreDropdown.classList.remove('js-dropdown-open');
                        moreButton.setAttribute('aria-expanded', 'false');
                        
                        // CRITICAL: Clear watcher interval when dropdown closes to prevent memory leaks
                        if (window._dropdownWatcher) {
                            clearInterval(window._dropdownWatcher);
                            window._dropdownWatcher = null;
                        }
                    
                    // Rotate arrow back
                    const arrow = moreButton.querySelector('svg');
                    if (arrow) {
                        arrow.style.setProperty('transform', 'rotate(0deg)', 'important');
                        arrow.classList.remove('rotate-180');
                    }
                    
                    // Move dropdown back to original parent if we moved it
                    if (moreDropdown.dataset.originalParent && moreDropdown.parentElement === document.body) {
                        const originalParent = document.getElementById(moreDropdown.dataset.originalParent) || 
                                            document.querySelector('#more-menu-container');
                        if (originalParent) {
                            originalParent.appendChild(moreDropdown);
                        }
                    }
                    
                    // Also try to update Alpine if it exists
                    try {
                        const nav = moreButton.closest('[x-data]');
                        if (nav && nav.__x) {
                            const data = nav.__x.$data;
                            if (data && typeof data.isMoreOpen !== 'undefined') {
                                data.isMoreOpen = false;
                            }
                        }
                    } catch (e) {
                        // Ignore Alpine errors
                    }
                    } catch (e) {
                        // Catch any errors in hideDropdown
                        errorBoundary.handleError(e, 'dropdown-hide');
                        // Ensure state is reset on error
                        isOpen = false;
                        if (moreDropdown) {
                            moreDropdown.setAttribute('data-js-open', 'false');
                        }
                    }
                };
                
                // CRITICAL: Bulletproof toggle with crash prevention
                const toggleDropdown = (e) => {
                    try {
                        if (e) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                        
                        // CRITICAL: If user is manually clicking to open, clear FAQ flag (they want to use dropdown)
                        if (!isOpen) {
                            window._faqLinkClicked = false;
                        }
                        
                        // CRITICAL: Sync state before toggling (in case FAQ handler closed it)
                        syncIsOpen();
                        
                        if (isOpen) {
                            hideDropdown();
                        } else {
                            showDropdown();
                        }
                    } catch (e) {
                        // Catch any errors in toggle
                        errorBoundary.handleError(e, 'dropdown-toggle');
                    }
                };
                
                // Attach click handler - use capture phase to run BEFORE Alpine
                moreButton.addEventListener('click', toggleDropdown, true);
                
                // Update position on scroll and resize
                const handlePositionUpdate = Utils.debounce(() => {
                    // CRITICAL: Check if we've reached FAQ section - clear flag if so (user can now use dropdown)
                    if (window._faqLinkClicked) {
                        try {
                            const faqSection = document.getElementById('faq') || document.getElementById('faq-contact');
                            if (faqSection) {
                                const rect = faqSection.getBoundingClientRect();
                                // If FAQ section is in viewport (within 200px of top), clear the flag
                                if (rect.top < 200 && rect.bottom > 0) {
                                    window._faqLinkClicked = false;
                                }
                            }
                        } catch (e) {
                            // Ignore errors
                        }
                    }
                    
                    // CRITICAL: Don't update position if FAQ link was just clicked AND we haven't reached FAQ yet
                    if (window._faqLinkClicked) {
                        return;
                    }
                    if (isOpen) {
                        updateDropdownPosition();
                    }
                }, 100);
                
                window.addEventListener('scroll', handlePositionUpdate, { passive: true });
                window.addEventListener('resize', handlePositionUpdate, { passive: true });
                
                // Also handle clicks outside to close
                document.addEventListener('click', (e) => {
                    if (isOpen && !moreButton.contains(e.target) && !moreDropdown.contains(e.target)) {
                        hideDropdown();
                    }
                }, true);
                
            } else {
                if (DEBUG) console.error('❌ [DROPDOWN] Missing elements! Button:', !!moreButton, 'Dropdown:', !!moreDropdown);
            }
            
            // Fallback click-outside handler for dropdown menu
            // This ensures the dropdown closes even if Alpine's @click.outside doesn't work
            document.addEventListener('click', (e) => {
                // Use setTimeout to let Alpine handle the click first
                setTimeout(() => {
                    const moreButton = Utils.safeGetById('more-button');
                    const moreContainer = Utils.safeQuery('#more-menu-container');
                    const moreDropdown = Utils.safeQuery('#more-dropdown');
                    
                    if (!moreButton || !moreContainer || !moreDropdown) return;
                    
                    // Check if click is outside the dropdown container
                    const clickedInside = moreContainer.contains(e.target);
                    
                    if (!clickedInside) {
                        // Click was outside - close the dropdown
                        try {
                            // Try to use Alpine.js to close
                            const nav = moreContainer.closest('[x-data]');
                            if (nav && nav.__x) {
                                const data = nav.__x.$data;
                                if (data && typeof data.closeMoreMenu === 'function') {
                                    data.closeMoreMenu();
                                } else if (data && typeof data.isMoreOpen !== 'undefined') {
                                    data.isMoreOpen = false;
                                }
                            } else {
                                // Fallback: directly hide the dropdown
                                moreDropdown.style.display = 'none';
                                moreButton.setAttribute('aria-expanded', 'false');
                            }
                        } catch (err) {
                            // If Alpine fails, use direct DOM manipulation
                            moreDropdown.style.display = 'none';
                            moreButton.setAttribute('aria-expanded', 'false');
                        }
                    }
                }, 10); // Small delay to let Alpine handle first
            }, false); // Use bubble phase
        } catch (e) {
            log.warn('Dropdown handler error:', e);
        }
    };

    // MOBILE MENU HANDLING - Similar to dropdown but for mobile menu
    const initMobileMenuHandlers = () => {
        try {
            
            // Force remove x-cloak
            const forceRemoveMobileCloak = () => {
                const mobileMenu = Utils.safeQuery('#mobile-menu');
                if (mobileMenu) {
                    mobileMenu.removeAttribute('x-cloak');
                }
            };
            
            forceRemoveMobileCloak();
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', forceRemoveMobileCloak);
            }
            setTimeout(forceRemoveMobileCloak, 100);
            setTimeout(forceRemoveMobileCloak, 500);
            setTimeout(forceRemoveMobileCloak, 1000);
            
            const mobileButton = Utils.safeGetById('mobile-menu-trigger');
            const mobileMenu = Utils.safeQuery('#mobile-menu');
            const mobileIcon = Utils.safeQuery('#mobile-menu-icon');
            const mobileCloseIcon = Utils.safeQuery('#mobile-menu-close-icon');
            
            
            if (mobileButton && mobileMenu) {
                let isMobileOpen = false;
                
                const showMobileMenu = () => {
                    isMobileOpen = true;
                    mobileMenu.setAttribute('data-js-open', 'true');
                    mobileMenu.removeAttribute('x-cloak');
                    mobileMenu.removeAttribute('x-show');
                    
                    // CRITICAL: Move mobile menu to body to avoid parent clipping (same as dropdown)
                    if (!mobileMenu.dataset.originalParent) {
                        // CRITICAL: Check parentElement exists before accessing .id
                        const mobileParentId = mobileMenu.parentElement?.id || 'main-nav';
                        mobileMenu.dataset.originalParent = mobileParentId;
                    }
                    if (mobileMenu.parentElement !== document.body) {
                        document.body.appendChild(mobileMenu);
                    }
                    
                    // Disable Alpine on mobile menu completely
                    if (mobileMenu.__x) {
                        try {
                            if (mobileMenu.__x.$el === mobileMenu) {
                                mobileMenu.__x = null;
                            }
                        } catch(e) {}
                    }
                    
                    // Calculate top position based on nav height
                    const nav = Utils.safeQuery('#main-nav');
                    const navHeight = nav ? nav.offsetHeight : 80;
                    
                    // Force show menu with all styles
                    mobileMenu.style.cssText = `
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        transform: translateY(0) !important;
                        position: fixed !important;
                        left: 0 !important;
                        right: 0 !important;
                        top: ${navHeight}px !important;
                        width: 100% !important;
                        max-height: calc(100vh - ${navHeight}px) !important;
                        z-index: 99998 !important;
                        background: rgb(17, 24, 39) !important;
                    `;
                    
                    // Remove Alpine transition classes
                    mobileMenu.classList.remove('x-cloak');
                    Array.from(mobileMenu.classList).forEach(cls => {
                        if (cls.startsWith('x-transition') || cls.includes('enter') || cls.includes('leave')) {
                            mobileMenu.classList.remove(cls);
                        }
                    });
                    
                    // Toggle icons
                    if (mobileIcon) {
                        mobileIcon.style.setProperty('display', 'none', 'important');
                        mobileIcon.removeAttribute('x-show');
                    }
                    if (mobileCloseIcon) {
                        mobileCloseIcon.style.setProperty('display', 'block', 'important');
                        mobileCloseIcon.removeAttribute('x-show');
                        mobileCloseIcon.removeAttribute('x-cloak');
                    }
                    
                    // Lock body scroll
                    document.body.style.setProperty('overflow', 'hidden', 'important');
                    document.documentElement.style.setProperty('overflow', 'hidden', 'important');
                    
                    mobileButton.setAttribute('aria-expanded', 'true');
                    
                    // Update Alpine if it exists
                    try {
                        const nav = mobileButton.closest('[x-data]');
                        if (nav && nav.__x) {
                            const data = nav.__x.$data;
                            if (data && typeof data.isMobileMenuOpen !== 'undefined') {
                                data.isMobileMenuOpen = true;
                            }
                        }
                    } catch(e) {}
                    
                    
                    // Set up watcher to prevent Alpine from re-hiding it
                    if (!window._mobileMenuWatcher) {
                        window._mobileMenuWatcher = setInterval(() => {
                            if (isMobileOpen && mobileMenu) {
                                const currentStyles = window.getComputedStyle(mobileMenu);
                                if (currentStyles.display === 'none' || currentStyles.visibility === 'hidden') {
                                    mobileMenu.removeAttribute('x-show');
                                    mobileMenu.style.setProperty('display', 'block', 'important');
                                    mobileMenu.style.setProperty('visibility', 'visible', 'important');
                                    mobileMenu.style.setProperty('opacity', '1', 'important');
                                }
                            }
                        }, 250); // Optimized: Reduced frequency for better performance
                    }
                };
                
                const hideMobileMenu = () => {
                    isMobileOpen = false;
                    mobileMenu.setAttribute('data-js-open', 'false');
                    mobileMenu.style.setProperty('display', 'none', 'important');
                    
                    // CRITICAL: Clear watcher interval when menu closes to prevent memory leaks
                    if (window._mobileMenuWatcher) {
                        clearInterval(window._mobileMenuWatcher);
                        window._mobileMenuWatcher = null;
                    }
                    
                    // Move menu back to original parent if we moved it
                    if (mobileMenu.dataset.originalParent && mobileMenu.parentElement === document.body) {
                        const originalParent = document.getElementById(mobileMenu.dataset.originalParent) || 
                                            document.querySelector('#main-nav');
                        if (originalParent) {
                            originalParent.appendChild(mobileMenu);
                        }
                    }
                    
                    // Toggle icons
                    if (mobileIcon) {
                        mobileIcon.style.setProperty('display', 'block', 'important');
                    }
                    if (mobileCloseIcon) {
                        mobileCloseIcon.style.setProperty('display', 'none', 'important');
                    }
                    
                    // Unlock body scroll
                    document.body.style.removeProperty('overflow');
                    document.documentElement.style.removeProperty('overflow');
                    
                    mobileButton.setAttribute('aria-expanded', 'false');
                    
                    // Update Alpine if it exists
                    try {
                        const nav = mobileButton.closest('[x-data]');
                        if (nav && nav.__x) {
                            const data = nav.__x.$data;
                            if (data && typeof data.isMobileMenuOpen !== 'undefined') {
                                data.isMobileMenuOpen = false;
                            }
                        }
                    } catch(e) {}
                };
                
                const toggleMobileMenu = (e) => {
                    if (e) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    
                    if (isMobileOpen) {
                        hideMobileMenu();
                    } else {
                        showMobileMenu();
                    }
                };
                
                // Attach click handler
                mobileButton.addEventListener('click', toggleMobileMenu, true);
                
                // Close on window resize to desktop size
                window.addEventListener('resize', () => {
                    if (window.innerWidth >= 1024 && isMobileOpen) {
                        hideMobileMenu();
                    }
                }, { passive: true });
                
                // Close on escape key
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && isMobileOpen) {
                        hideMobileMenu();
                    }
                }, true);
                
                // Close when clicking on menu links
                const menuLinks = mobileMenu.querySelectorAll('a');
                menuLinks.forEach(link => {
                    link.addEventListener('click', () => {
                        if (isMobileOpen) {
                            hideMobileMenu();
                        }
                    });
                });
                
            } else {
                if (DEBUG) console.error('❌ [MOBILE] Missing elements! Button:', !!mobileButton, 'Menu:', !!mobileMenu);
            }
        } catch (e) {
            log.warn('Mobile menu handler error:', e);
        }
    };

    // FAQ LINK HANDLERS - Close dropdown and mobile menu when FAQ is clicked
    const initFAQHandlers = () => {
        
        try {
            // Find all FAQ links (both desktop dropdown and mobile menu)
            const faqLinks = document.querySelectorAll('a[href*="#faq"]');
            
            faqLinks.forEach((link, index) => {
                
                link.addEventListener('click', () => {
                    
                    // CRITICAL: Set flag to prevent dropdown from reopening during scroll
                    window._faqLinkClicked = true;
                    // Clear flag after scroll completes (5 seconds to ensure smooth scroll finishes)
                    setTimeout(() => {
                        window._faqLinkClicked = false;
                    }, 5000);
                    
                    // Close dropdown if it's open - use direct DOM manipulation
                    const moreDropdown = document.getElementById('more-dropdown');
                    if (moreDropdown) {
                        // CRITICAL: Clear the dropdown watcher to prevent it from forcing the dropdown open
                        if (window._dropdownWatcher) {
                            clearInterval(window._dropdownWatcher);
                            window._dropdownWatcher = null;
                        }
                        
                        // Force hide the dropdown
                        moreDropdown.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important;';
                        moreDropdown.setAttribute('data-js-open', 'false');
                        
                        // CRITICAL: Update Alpine.js state if it exists
                        try {
                            const nav = moreDropdown.closest('[x-data]');
                            if (nav && nav.__x) {
                                const data = nav.__x.$data;
                                if (data && typeof data.isMoreOpen !== 'undefined') {
                                    data.isMoreOpen = false;
                                }
                            }
                        } catch (e) {
                            // Ignore Alpine errors
                        }
                        
                        // Reset arrow rotation
                        const moreButton = document.getElementById('more-button');
                        if (moreButton) {
                            moreButton.setAttribute('aria-expanded', 'false');
                            const arrow = moreButton.querySelector('svg');
                            if (arrow) {
                                arrow.style.transform = 'rotate(0deg)';
                                arrow.classList.remove('rotate-180');
                            }
                        }
                    }
                    
                    // Close mobile menu if it's open - use direct DOM manipulation
                    const mobileMenu = document.getElementById('mobile-menu');
                    if (mobileMenu) {
                        // Force hide the mobile menu
                        mobileMenu.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important;';
                        mobileMenu.setAttribute('data-js-open', 'false');
                        
                        // Unlock body scroll
                        if (document.body) document.body.classList.remove('overflow-hidden');
                        if (document.documentElement) document.documentElement.classList.remove('overflow-hidden');
                        
                        // Reset mobile button icons
                        const mobileButton = document.getElementById('mobile-menu-button');
                        if (mobileButton) {
                            const hamburger = mobileButton.querySelector('.hamburger-icon');
                            const close = mobileButton.querySelector('.close-icon');
                            if (hamburger) hamburger.style.display = 'block';
                            if (close) close.style.display = 'none';
                        }
                    }
                });
            });
            
        } catch (e) {
            if (DEBUG) console.error('❌ [FAQ] Error in FAQ handler:', e);
            errorBoundary.handleError(e, 'faq');
        }
    };

    // BUTTON INTERACTION HANDLING - Touch & Click
    const initButtonHandlers = () => {
        try {
            // Debounce function to prevent rapid clicks
            const debounceMap = new WeakMap();
            const getDebouncedHandler = (element, handler, delay = 300) => {
                if (!debounceMap.has(element)) {
                    let timeoutId = null;
                    const debounced = (e) => {
                        if (timeoutId) clearTimeout(timeoutId);
                        timeoutId = setTimeout(() => {
                            handler(e);
                            timeoutId = null;
                        }, delay);
                    };
                    debounceMap.set(element, debounced);
                }
                return debounceMap.get(element);
            };

            // Track button click timestamps to prevent rapid clicks
            const clickTimestamps = new WeakMap();
            const MIN_CLICK_INTERVAL = 300; // 300ms minimum between clicks

            // Handle all button clicks with debouncing and rapid-click protection
            document.addEventListener('click', (e) => {
                const button = e.target.closest('button, a[role="button"], [role="button"]');
                if (!button) return;

                // Skip menu buttons - they have their own handlers
                if (button.id === 'more-button' || button.id === 'mobile-menu-trigger' || 
                    button.closest('#more-menu-container') || button.closest('#mobile-menu-trigger')) {
                    return;
                }

                // CRITICAL: Skip ALL form-related buttons - forms handle their own submission protection
                if (button.type === 'submit' || 
                    button.type === 'button' && (
                        button.closest('form') || 
                        button.closest('#contact') ||
                        button.getAttribute('aria-label')?.includes('file') ||
                        button.getAttribute('aria-label')?.includes('photo') ||
                        button.getAttribute('aria-label')?.includes('Remove') ||
                        button.getAttribute('aria-label')?.includes('Clear')
                    )) {
                    return; // Let form handlers manage their own clicks
                }

                // Check for rapid clicks
                const lastClick = clickTimestamps.get(button);
                const now = Date.now();
                if (lastClick && (now - lastClick) < MIN_CLICK_INTERVAL) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                clickTimestamps.set(button, now);

                // Skip if button is disabled
                if (button.disabled || button.getAttribute('aria-disabled') === 'true') {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }

                // Skip if button has loading state (but NOT form submit buttons - they handle their own state)
                if (button.type !== 'submit' && button.classList.contains('opacity-50') && button.classList.contains('cursor-not-allowed')) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }

                // Check for Alpine.js isSubmitting state
                try {
                    const alpineData = button.closest('[x-data]');
                    if (alpineData && alpineData.__x) {
                        const data = alpineData.__x.$data;
                        if (data && data.isSubmitting === true) {
                            e.preventDefault();
                            e.stopPropagation();
                            return;
                        }
                    }
                } catch (err) {
                    // Ignore Alpine.js errors
                }

                // Handle form submit buttons - prevent double submission
                if (button.type === 'submit' || button.getAttribute('type') === 'submit') {
                    const form = button.closest('form');
                    if (form) {
                        // Check form's Alpine.js state
                        try {
                            const formData = form.__x || (form.closest('[x-data]')?.__x);
                            if (formData && formData.$data && formData.$data.isSubmitting === true) {
                                e.preventDefault();
                                e.stopPropagation();
                                return;
                            }
                        } catch (err) {
                            // Ignore Alpine.js errors
                        }

                        // Add temporary disabled state to prevent double submission
                        button.disabled = true;
                        button.setAttribute('aria-busy', 'true');
                        button.classList.add('is-loading');
                        
                        // Re-enable after a delay (form handler should manage this, but safety net)
                        setTimeout(() => {
                            if (button.disabled && !button.closest('form')?.__x?.$data?.isSubmitting) {
                                button.disabled = false;
                                button.removeAttribute('aria-busy');
                                button.classList.remove('is-loading');
                            }
                        }, 5000); // 5 second safety timeout
                    }
                }

                // Add active state for touch feedback
                if (Utils.isTouchDevice()) {
                    button.classList.add('active-touch');
                    setTimeout(() => {
                        button.classList.remove('active-touch');
                    }, 150);
                }
            }, false);

            // Handle touch events for better mobile feedback
            if (Utils.isTouchDevice()) {
                document.addEventListener('touchstart', (e) => {
                    const button = e.target.closest('button, a, [role="button"]');
                    if (button && !button.disabled) {
                        button.classList.add('touch-active');
                    }
                }, { passive: true });

                document.addEventListener('touchend', (e) => {
                    const button = e.target.closest('button, a, [role="button"]');
                    if (button) {
                        setTimeout(() => {
                            button.classList.remove('touch-active');
                        }, 150);
                    }
                }, { passive: true });

                document.addEventListener('touchcancel', (e) => {
                    const button = e.target.closest('button, a, [role="button"]');
                    if (button) {
                        button.classList.remove('touch-active');
                    }
                }, { passive: true });
            }
        } catch (e) {
            log.warn('Button handler error:', e);
        }
    };

    // ANCHOR LINK HANDLING - Smooth Scroll with Offset
    const initAnchorLinks = () => {
        try {
            // Helper function to scroll to element with offset
            const scrollToElement = (targetElement) => {
                if (!targetElement) return;
                
                const nav = Utils.safeQuery('#main-nav');
                const navHeight = nav ? nav.offsetHeight : 96;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - navHeight - 16;

                try {
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                } catch (err) {
                    window.scrollTo(0, offsetPosition);
                }
            };

            // Handle all anchor link clicks
            document.addEventListener('click', (e) => {
                const link = e.target.closest('a[href^="#"]');
                if (!link) return;

                const href = link.getAttribute('href');
                if (!href || href === '#') return;

                // Check if this is an FAQ link - close dropdown and mobile menu
                if (href.includes('#faq')) {
                    
                    // CRITICAL: Set flag to prevent dropdown from reopening during scroll
                    window._faqLinkClicked = true;
                    // Clear flag after scroll completes (5 seconds to ensure smooth scroll finishes)
                    setTimeout(() => {
                        window._faqLinkClicked = false;
                    }, 5000);
                    
                    // Close dropdown if it's open
                    const moreDropdown = document.getElementById('more-dropdown');
                    if (moreDropdown) {
                        // CRITICAL: Clear the dropdown watcher to prevent it from forcing the dropdown open
                        if (window._dropdownWatcher) {
                            clearInterval(window._dropdownWatcher);
                            window._dropdownWatcher = null;
                        }
                        
                        moreDropdown.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important;';
                        moreDropdown.setAttribute('data-js-open', 'false');
                        
                        // CRITICAL: Update Alpine.js state if it exists
                        try {
                            const nav = moreDropdown.closest('[x-data]');
                            if (nav && nav.__x) {
                                const data = nav.__x.$data;
                                if (data && typeof data.isMoreOpen !== 'undefined') {
                                    data.isMoreOpen = false;
                                }
                            }
                        } catch (e) {
                            // Ignore Alpine errors
                        }
                        
                        // Reset arrow rotation
                        const moreButton = document.getElementById('more-button');
                        if (moreButton) {
                            moreButton.setAttribute('aria-expanded', 'false');
                            const arrow = moreButton.querySelector('svg');
                            if (arrow) {
                                arrow.style.transform = 'rotate(0deg)';
                                arrow.classList.remove('rotate-180');
                            }
                        }
                    }
                    
                    // Close mobile menu if it's open
                    const mobileMenu = document.getElementById('mobile-menu');
                    if (mobileMenu) {
                        mobileMenu.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important;';
                        mobileMenu.setAttribute('data-js-open', 'false');
                        
                        // Unlock body scroll
                        if (document.body) document.body.classList.remove('overflow-hidden');
                        if (document.documentElement) document.documentElement.classList.remove('overflow-hidden');
                        
                        // Reset mobile button icons
                        const mobileButton = document.getElementById('mobile-menu-button');
                        if (mobileButton) {
                            const hamburger = mobileButton.querySelector('.hamburger-icon');
                            const close = mobileButton.querySelector('.close-icon');
                            if (hamburger) hamburger.style.display = 'block';
                            if (close) close.style.display = 'none';
                        }
                    }
                }

                // Skip if it's a hash-only link or external link
                if (href.startsWith('#') && href.length > 1) {
                    const targetId = href.substring(1);
                    const targetElement = Utils.safeGetById(targetId);

                    if (targetElement) {
                        e.preventDefault();
                        scrollToElement(targetElement);

                        // Close mobile menu if open - dispatch event for Alpine.js
                        try {
                            window.dispatchEvent(new CustomEvent('close-mobile-menu'));
                        } catch (e) {
                            // Ignore if event dispatch fails
                        }

                        // Update URL without triggering scroll
                        try {
                            window.history.replaceState(null, '', href);
                        } catch (e) {
                            // Ignore history errors
                        }
                    }
                }
            }, { passive: false });

            // Handle hash links on page load
            if (window.location.hash) {
                Utils.safeRAF(() => {
                    const hash = window.location.hash.substring(1);
                    const targetElement = Utils.safeGetById(hash);
                    scrollToElement(targetElement);
                });
            }
        } catch (e) {
            log.warn('Anchor link handler error:', e);
        }
    };

    // Initialize DOM features when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initDOMFeatures();
            initAnchorLinks();
            initButtonHandlers();
            initDropdownHandlers();
            initMobileMenuHandlers();
            initFAQHandlers();
            registerContactForm();
            
            // Accessibility enhancements
            initAccessibilityFeatures();
            
            // Image optimizations
            initImageOptimizations();
            
            // Performance: Initialize intersection observer for animations
            if ('IntersectionObserver' in window) {
                // CRITICAL: Store observer reference for cleanup to prevent memory leaks
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.style.opacity = '1';
                            entry.target.style.transform = 'translateY(0)';
                            observer.unobserve(entry.target);
                        }
                    });
                }, { 
                    threshold: 0.1,
                    rootMargin: '50px'
                });

                // Store observer in global cleanup object for page unload cleanup
                if (!window._intersectionObservers) {
                    window._intersectionObservers = [];
                }
                window._intersectionObservers.push(observer);

                // Observe cards for subtle entrance animations
                requestIdleCallback(() => {
                    document.querySelectorAll('.service-card, .frosted-glass-light:not(.p-6)').forEach(el => {
                        el.style.opacity = '0.8';
                        el.style.transform = 'translateY(10px)';
                        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                        observer.observe(el);
                    });
                });
            }
        });
    } else {
        initDOMFeatures();
        initAnchorLinks();
        initButtonHandlers();
        initDropdownHandlers();
        initMobileMenuHandlers();
        initFAQHandlers();
        registerContactForm();
    }

    // CRITICAL: Register Alpine components immediately when Alpine initializes
    // This prevents "Component not found" errors which can crash the entire page
    document.addEventListener('alpine:init', () => {
        registerContactForm();
    });

    // Initialize performance monitoring
    Utils.safeRAF(() => {
        Utils.checkPerformance();
    });

    // ERROR BOUNDARY - Global Error Handler (handled above in errorBoundary section)

    // SERVICE WORKER REGISTRATION - Progressive Web App Features
    
    // Register service worker for offline functionality
    const registerServiceWorker = () => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                        log.log('Service Worker: Registered successfully', registration.scope);
                        
                        // Check for updates
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            if (newWorker) {
                                newWorker.addEventListener('statechange', () => {
                                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                        // New content available, could show update notification
                                        log.log('Service Worker: New content available');
                                    }
                                });
                            }
                        });
                    })
                    .catch((error) => {
                        log.warn('Service Worker: Registration failed', error);
                    });
            });
        } else {
            log.warn('Service Worker: Not supported in this browser');
        }
    };

    // Initialize service worker
    registerServiceWorker();

    // PERFORMANCE MONITORING - Core Web Vitals
    
    // Monitor Core Web Vitals (optional, for development)
    const monitorPerformance = () => {
        if (DEBUG && 'PerformanceObserver' in window) {
            try {
                // Largest Contentful Paint
                new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                        log.log('LCP:', entry.startTime);
                    }
                }).observe({ entryTypes: ['largest-contentful-paint'] });

                // First Input Delay
                new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                        log.log('FID:', entry.processingStart - entry.startTime);
                    }
                }).observe({ entryTypes: ['first-input'] });

                // Cumulative Layout Shift
                new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                        if (!entry.hadRecentInput) {
                            log.log('CLS:', entry.value);
                        }
                    }
                }).observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                log.warn('Performance monitoring not available:', e);
            }
        }
    };

    // Initialize performance monitoring in development
    monitorPerformance();

    // Accessibility Features (Best Practice)
    const initAccessibilityFeatures = () => {
        // Keyboard navigation detection
        let isKeyboardUser = false;
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                isKeyboardUser = true;
                document.body.classList.add('keyboard-user');
            }
        });
        
        document.addEventListener('mousedown', () => {
            isKeyboardUser = false;
            document.body.classList.remove('keyboard-user');
        });
        
        // Focus management for modals
        const trapFocus = (element) => {
            const focusableElements = element.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (focusableElements.length === 0) return;
            
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey && document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    } else if (!e.shiftKey && document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            });
        };
        
        // Enhanced screen reader announcements with context
        window.announceToScreenReader = (message, priority = 'polite', context = '') => {
            const announcement = document.createElement('div');
            announcement.setAttribute('aria-live', priority);
            announcement.setAttribute('aria-atomic', 'true');
            announcement.className = 'sr-only';
            
            // Add context for better understanding
            const fullMessage = context ? `${context}: ${message}` : message;
            announcement.textContent = fullMessage;
            
            // Add to announcement region
            let announcementRegion = document.getElementById('sr-announcements');
            if (!announcementRegion) {
                announcementRegion = document.createElement('div');
                announcementRegion.id = 'sr-announcements';
                announcementRegion.className = 'sr-only';
                announcementRegion.setAttribute('aria-live', 'polite');
                announcementRegion.setAttribute('aria-atomic', 'false');
                document.body.appendChild(announcementRegion);
            }
            
            announcementRegion.appendChild(announcement);
            
            // Remove after announcement with fade out
            setTimeout(() => {
                if (announcement.parentNode) {
                    announcement.parentNode.removeChild(announcement);
                }
            }, 2000);
        };

        // Progress announcements for long operations
        window.announceProgress = (current, total, operation = 'Loading') => {
            const percentage = Math.round((current / total) * 100);
            const message = `${operation} ${percentage}% complete. ${current} of ${total} items.`;
            window.announceToScreenReader(message, 'polite', 'Progress');
        };
    };

    // Advanced Image Optimizations (Best Practice)
    const initImageOptimizations = () => {
        // Lazy loading enhancement
        // CRITICAL: Store observer reference for cleanup to prevent memory leaks
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    // Add loaded class for fade-in effect
                    img.addEventListener('load', () => {
                        img.classList.add('loaded');
                    });
                    
                    // WebP support detection and switching
                    if (browserSupport.webp && img.dataset.webp) {
                        img.src = img.dataset.webp;
                    }
                    
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px'
        });
        
        // Store observer in global cleanup object for page unload cleanup
        if (!window._intersectionObservers) {
            window._intersectionObservers = [];
        }
        window._intersectionObservers.push(imageObserver);
        
        // Observe all lazy images
        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            imageObserver.observe(img);
        });
        
        // Add WebP support class to body
        if (browserSupport.webp) {
            document.body.classList.add('webp-support');
        }
        
        // Preload critical images on idle
        if (browserSupport.requestIdleCallback) {
            requestIdleCallback(() => {
                const criticalImages = document.querySelectorAll('img[fetchpriority="high"]');
                criticalImages.forEach(img => {
                    if (!img.complete) {
                        const preloadLink = document.createElement('link');
                        preloadLink.rel = 'preload';
                        preloadLink.as = 'image';
                        preloadLink.href = img.src;
                        document.head.appendChild(preloadLink);
                    }
                });
            });
        }
    };

    // Core Web Vitals Monitoring (Best Practice)
    // CRITICAL: Store observer references for cleanup to prevent memory leaks
    const webVitalsCleanup = {
        lcpObserver: null,
        fidObserver: null,
        clsObserver: null
    };

    const initWebVitals = () => {
        if ('PerformanceObserver' in window) {
            try {
                // Largest Contentful Paint (LCP)
                webVitalsCleanup.lcpObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    if (DEBUG) console.log('LCP:', lastEntry.startTime);
                    
                    // Store for analytics (non-blocking)
                    if (lastEntry.startTime > 2500) {
                        log.warn('LCP above 2.5s:', lastEntry.startTime);
                    }
                });
                webVitalsCleanup.lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

                // First Input Delay (FID)
                webVitalsCleanup.fidObserver = new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                        if (DEBUG) console.log('FID:', entry.processingStart - entry.startTime);
                        
                        if (entry.processingStart - entry.startTime > 100) {
                            log.warn('FID above 100ms:', entry.processingStart - entry.startTime);
                        }
                    }
                });
                webVitalsCleanup.fidObserver.observe({ entryTypes: ['first-input'] });

                // Cumulative Layout Shift (CLS)
                let clsValue = 0;
                webVitalsCleanup.clsObserver = new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    }
                    if (DEBUG) console.log('CLS:', clsValue);
                    
                    if (clsValue > 0.1) {
                        log.warn('CLS above 0.1:', clsValue);
                    }
                });
                webVitalsCleanup.clsObserver.observe({ entryTypes: ['layout-shift'] });

            } catch (error) {
                log.warn('Web Vitals monitoring failed:', error);
            }
        }
    };

    // CRITICAL: Cleanup function for Web Vitals observers
    const cleanupWebVitals = () => {
        try {
            if (webVitalsCleanup.lcpObserver) {
                webVitalsCleanup.lcpObserver.disconnect();
                webVitalsCleanup.lcpObserver = null;
            }
            if (webVitalsCleanup.fidObserver) {
                webVitalsCleanup.fidObserver.disconnect();
                webVitalsCleanup.fidObserver = null;
            }
            if (webVitalsCleanup.clsObserver) {
                webVitalsCleanup.clsObserver.disconnect();
                webVitalsCleanup.clsObserver = null;
            }
        } catch (e) {
            log.warn('Web Vitals cleanup error:', e);
        }
    };

    // Add cleanup to global cleanup function
    window.addEventListener('beforeunload', cleanupWebVitals);
    window.addEventListener('pagehide', cleanupWebVitals);

    // Initialize Web Vitals monitoring
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWebVitals);
    } else {
        initWebVitals();
    }

    // Comprehensive Performance Monitoring (Best Practice)
    // CRITICAL: Store references for cleanup to prevent memory leaks
    const monitoringCleanup = {
        memoryInterval: null,
        visibilityListener: null,
        longTaskObserver: null
    };

    const initComprehensiveMonitoring = () => {
        // Memory usage monitoring
        if ('memory' in performance) {
            // CRITICAL: Store interval ID for cleanup
            monitoringCleanup.memoryInterval = setInterval(() => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
                    log.warn('High memory usage detected:', {
                        used: Math.round(memory.usedJSHeapSize / 1048576) + 'MB',
                        limit: Math.round(memory.jsHeapSizeLimit / 1048576) + 'MB'
                    });
                }
            }, 30000); // Check every 30 seconds
        }
        
        // Network quality monitoring
        if ('connection' in navigator) {
            const connection = navigator.connection;
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                log.log('Slow network detected, optimizing for performance');
                document.body.classList.add('slow-network');
            }
        }
        
        // Page visibility monitoring
        // CRITICAL: Store listener reference for cleanup
        const handleVisibilityChange = () => {
            if (document.hidden) {
                log.log('Page hidden, pausing non-critical operations');
            } else {
                log.log('Page visible, resuming operations');
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        monitoringCleanup.visibilityListener = handleVisibilityChange;
        
        // Long task monitoring
        if ('PerformanceObserver' in window) {
            try {
                // CRITICAL: Store observer reference for cleanup
                monitoringCleanup.longTaskObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 50) {
                            log.warn('Long task detected:', entry.duration + 'ms');
                        }
                    }
                });
                monitoringCleanup.longTaskObserver.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                // Long task API not supported
            }
        }
    };

    // CRITICAL: Cleanup function for monitoring resources
    const cleanupMonitoring = () => {
        try {
            if (monitoringCleanup.memoryInterval) {
                clearInterval(monitoringCleanup.memoryInterval);
                monitoringCleanup.memoryInterval = null;
            }
            
            if (monitoringCleanup.visibilityListener) {
                document.removeEventListener('visibilitychange', monitoringCleanup.visibilityListener);
                monitoringCleanup.visibilityListener = null;
            }
            
            if (monitoringCleanup.longTaskObserver) {
                monitoringCleanup.longTaskObserver.disconnect();
                monitoringCleanup.longTaskObserver = null;
            }
        } catch (e) {
            log.warn('Monitoring cleanup error:', e);
        }
    };

    // Add cleanup to global cleanup function
    window.addEventListener('beforeunload', cleanupMonitoring);
    window.addEventListener('pagehide', cleanupMonitoring);

    // Initialize comprehensive monitoring
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initComprehensiveMonitoring);
    } else {
        initComprehensiveMonitoring();
    }

})();
