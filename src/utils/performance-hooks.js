import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Intersection Observer Hook for lazy loading
export const useIntersectionObserver = (options = {}) => {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const [hasBeenIntersecting, setHasBeenIntersecting] = useState(false);
    const elementRef = useRef(null);

    const defaultOptions = {
        threshold: 0.1,
        rootMargin: '0px',
        triggerOnce: true,
        ...options
    };

    useEffect(() => {
        const element = elementRef.current;
        if (!element || typeof IntersectionObserver !== 'function') return;

        const observer = new IntersectionObserver(([entry]) => {
            const isElementIntersecting = entry.isIntersecting;
            setIsIntersecting(isElementIntersecting);

            if (isElementIntersecting && !hasBeenIntersecting) {
                setHasBeenIntersecting(true);
                if (defaultOptions.triggerOnce) {
                    observer.unobserve(element);
                }
            }
        }, defaultOptions);

        observer.observe(element);

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [defaultOptions.threshold, defaultOptions.rootMargin, defaultOptions.triggerOnce, hasBeenIntersecting]);

    return [elementRef, defaultOptions.triggerOnce ? hasBeenIntersecting : isIntersecting];
};

// Debounced value hook
export const useDebounce = (value, delay = 300) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

// Throttled callback hook
export const useThrottle = (callback, delay = 100) => {
    const timeoutRef = useRef(null);
    const callbackRef = useRef(callback);
    const lastCalledRef = useRef(0);

    // Update callback ref when callback changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    return useCallback((...args) => {
        const now = Date.now();
        const timeSinceLastCall = now - lastCalledRef.current;

        if (timeSinceLastCall >= delay) {
            lastCalledRef.current = now;
            callbackRef.current(...args);
        } else {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                lastCalledRef.current = Date.now();
                callbackRef.current(...args);
            }, delay - timeSinceLastCall);
        }
    }, [delay]);
};

// Local storage with performance optimization
export const useLocalStorage = (key, initialValue) => {
    // State to store our value
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Return a wrapped version of useState's setter function that persists the new value to localStorage
    const setValue = useCallback((value) => {
        try {
            // Allow value to be a function so we have the same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            
            // Save to localStorage in next tick to avoid blocking render
            setTimeout(() => {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }, 0);
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    return [storedValue, setValue];
};

// Async data fetching with caching
export const useAsyncData = (fetchFn, dependencies = [], options = {}) => {
    const {
        cacheKey,
        cacheTime = 5 * 60 * 1000, // 5 minutes
        retryAttempts = 3,
        retryDelay = 1000,
        onSuccess,
        onError
    } = options;

    const [state, setState] = useState({
        data: null,
        loading: true,
        error: null,
        lastFetch: null
    });

    const cacheRef = useRef(new Map());
    const abortControllerRef = useRef(null);

    const fetchData = useCallback(async (attempt = 1) => {
        // Check cache first
        if (cacheKey && cacheRef.current.has(cacheKey)) {
            const cached = cacheRef.current.get(cacheKey);
            if (Date.now() - cached.timestamp < cacheTime) {
                setState({
                    data: cached.data,
                    loading: false,
                    error: null,
                    lastFetch: cached.timestamp
                });
                return;
            }
        }

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const data = await fetchFn(abortControllerRef.current.signal);
            const timestamp = Date.now();

            // Cache the result
            if (cacheKey) {
                cacheRef.current.set(cacheKey, { data, timestamp });
            }

            setState({
                data,
                loading: false,
                error: null,
                lastFetch: timestamp
            });

            if (onSuccess) onSuccess(data);
        } catch (error) {
            if (error.name === 'AbortError') return; // Request was cancelled

            if (attempt < retryAttempts) {
                setTimeout(() => fetchData(attempt + 1), retryDelay * attempt);
                return;
            }

            setState({
                data: null,
                loading: false,
                error,
                lastFetch: Date.now()
            });

            if (onError) onError(error);
        }
    }, [fetchFn, cacheKey, cacheTime, retryAttempts, retryDelay, onSuccess, onError]);

    // Fetch data when dependencies change
    useEffect(() => {
        fetchData();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, dependencies);

    const refetch = useCallback(() => {
        // Clear cache for this key
        if (cacheKey && cacheRef.current.has(cacheKey)) {
            cacheRef.current.delete(cacheKey);
        }
        fetchData();
    }, [cacheKey, fetchData]);

    return { ...state, refetch };
};

// Virtual scrolling hook
export const useVirtualScroll = (items, itemHeight, containerHeight) => {
    const [scrollTop, setScrollTop] = useState(0);

    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + 2, items.length); // +2 for buffer

    const visibleItems = useMemo(() => 
        items.slice(startIndex, endIndex)
    , [items, startIndex, endIndex]);

    const totalHeight = items.length * itemHeight;
    const offsetY = startIndex * itemHeight;

    const handleScroll = useCallback((e) => {
        setScrollTop(e.target.scrollTop);
    }, []);

    return {
        visibleItems,
        totalHeight,
        offsetY,
        handleScroll,
        startIndex
    };
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName) => {
    const renderCountRef = useRef(0);
    const renderTimesRef = useRef([]);
    const [metrics, setMetrics] = useState({
        renderCount: 0,
        averageRenderTime: 0,
        lastRenderTime: 0
    });

    useEffect(() => {
        const renderStart = performance.now();
        renderCountRef.current += 1;

        return () => {
            const renderTime = performance.now() - renderStart;
            renderTimesRef.current.push(renderTime);

            // Keep only last 10 render times for average calculation
            if (renderTimesRef.current.length > 10) {
                renderTimesRef.current.shift();
            }

            const averageRenderTime = renderTimesRef.current.reduce((sum, time) => sum + time, 0) / renderTimesRef.current.length;

            setMetrics({
                renderCount: renderCountRef.current,
                averageRenderTime,
                lastRenderTime: renderTime
            });

            // Log slow renders
            if (renderTime > 16 && componentName) { // 60fps threshold
                console.warn(`Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
            }
        };
    });

    return metrics;
};

// Optimized event listener hook
export const useEventListener = (eventName, handler, element = window) => {
    const savedHandler = useRef();

    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        const isSupported = element && element.addEventListener;
        if (!isSupported) return;

        const eventListener = (event) => savedHandler.current(event);
        element.addEventListener(eventName, eventListener, { passive: true });

        return () => {
            element.removeEventListener(eventName, eventListener);
        };
    }, [eventName, element]);
};

// Optimized resize observer hook
export const useResizeObserver = (callback, element) => {
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!element || typeof ResizeObserver !== 'function') return;

        const observer = new ResizeObserver((entries) => {
            callbackRef.current(entries);
        });

        observer.observe(element);

        return () => {
            observer.unobserve(element);
        };
    }, [element]);
};

// Media query hook with performance optimization
export const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia(query).matches;
        }
        return false;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia(query);
        const handleChange = () => setMatches(mediaQuery.matches);

        // Modern browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
        // Legacy browsers
        else {
            mediaQuery.addListener(handleChange);
            return () => mediaQuery.removeListener(handleChange);
        }
    }, [query]);

    return matches;
};

// Previous value hook for comparison
export const usePrevious = (value) => {
    const ref = useRef();
    
    useEffect(() => {
        ref.current = value;
    }, [value]);
    
    return ref.current;
};

// Optimized form state hook
export const useFormState = (initialState = {}, validationRules = {}) => {
    const [values, setValues] = useState(initialState);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validate = useCallback((fieldName, value) => {
        const rule = validationRules[fieldName];
        if (!rule) return null;

        if (typeof rule === 'function') {
            return rule(value, values);
        }

        if (rule.required && (!value || value.toString().trim() === '')) {
            return rule.message || `${fieldName} is required`;
        }

        if (rule.minLength && value.toString().length < rule.minLength) {
            return rule.message || `${fieldName} must be at least ${rule.minLength} characters`;
        }

        if (rule.maxLength && value.toString().length > rule.maxLength) {
            return rule.message || `${fieldName} must be less than ${rule.maxLength} characters`;
        }

        if (rule.pattern && !rule.pattern.test(value)) {
            return rule.message || `${fieldName} format is invalid`;
        }

        return null;
    }, [validationRules, values]);

    const setValue = useCallback((name, value) => {
        setValues(prev => ({ ...prev, [name]: value }));

        // Validate field if it has been touched
        if (touched[name]) {
            const error = validate(name, value);
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    }, [validate, touched]);

    const setError = useCallback((name, error) => {
        setErrors(prev => ({ ...prev, [name]: error }));
    }, []);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        const fieldValue = type === 'checkbox' ? checked : value;
        setValue(name, fieldValue);
    }, [setValue]);

    const handleBlur = useCallback((e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        
        const error = validate(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    }, [validate]);

    const validateAll = useCallback(() => {
        const newErrors = {};
        let isValid = true;

        Object.keys(validationRules).forEach(fieldName => {
            const error = validate(fieldName, values[fieldName]);
            if (error) {
                newErrors[fieldName] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);
        setTouched(Object.keys(validationRules).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {}));

        return isValid;
    }, [validate, validationRules, values]);

    const reset = useCallback(() => {
        setValues(initialState);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, [initialState]);

    return {
        values,
        errors,
        touched,
        isSubmitting,
        setIsSubmitting,
        setValue,
        setError,
        handleChange,
        handleBlur,
        validateAll,
        reset
    };
};