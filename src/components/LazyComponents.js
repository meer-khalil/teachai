import React, { memo, useMemo, useCallback, lazy, Suspense } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

// Lazy loaded components for code splitting
const LazyPostEditor = lazy(() => import('../components/PostEditor'));
const LazyUserProfile = lazy(() => import('../components/UserProfile'));
const LazyDashboard = lazy(() => import('../components/Dashboard'));
const LazyChatInterface = lazy(() => import('../components/ChatInterface'));
const LazyQuizGenerator = lazy(() => import('../components/QuizGenerator'));
const LazyLessonPlanner = lazy(() => import('../components/LessonPlanner'));

// Loading fallback component
const LoadingFallback = memo(({ message = "Loading..." }) => (
    <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">{message}</span>
    </div>
));

// Intersection Observer based lazy loading wrapper
const LazyLoadWrapper = memo(({ 
    children, 
    height = "200px", 
    offset = "100px",
    fallback = <LoadingFallback />,
    className = ""
}) => {
    const [ref, isIntersecting] = useIntersectionObserver({
        rootMargin: offset,
        threshold: 0.1
    });

    return (
        <div 
            ref={ref} 
            className={className}
            style={{ minHeight: height }}
        >
            {isIntersecting ? children : fallback}
        </div>
    );
});

// Optimized image component with lazy loading
const OptimizedImage = memo(({ 
    src, 
    alt, 
    className = "",
    width,
    height,
    placeholder = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0f0f0'/%3e%3c/svg%3e"
}) => {
    const [ref, isIntersecting] = useIntersectionObserver({
        rootMargin: '50px',
        threshold: 0.1
    });

    const [loaded, setLoaded] = React.useState(false);
    const [error, setError] = React.useState(false);

    const handleLoad = useCallback(() => {
        setLoaded(true);
    }, []);

    const handleError = useCallback(() => {
        setError(true);
    }, []);

    return (
        <div ref={ref} className={`relative overflow-hidden ${className}`}>
            {!isIntersecting ? (
                <img
                    src={placeholder}
                    alt=""
                    className="w-full h-full object-cover blur-sm"
                    width={width}
                    height={height}
                />
            ) : (
                <>
                    <img
                        src={error ? placeholder : src}
                        alt={alt}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                            loaded ? 'opacity-100' : 'opacity-0'
                        }`}
                        onLoad={handleLoad}
                        onError={handleError}
                        width={width}
                        height={height}
                        loading="lazy"
                    />
                    {!loaded && !error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
});

// Virtualized list component for large datasets
const VirtualizedList = memo(({ 
    items, 
    itemHeight = 60,
    containerHeight = 400,
    renderItem,
    overscan = 5
}) => {
    const [scrollTop, setScrollTop] = React.useState(0);
    const containerRef = React.useRef();

    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + overscan, items.length);

    const visibleItems = items.slice(startIndex, endIndex);

    const handleScroll = useCallback((e) => {
        setScrollTop(e.target.scrollTop);
    }, []);

    const totalHeight = items.length * itemHeight;
    const offsetY = startIndex * itemHeight;

    return (
        <div
            ref={containerRef}
            className="overflow-auto"
            style={{ height: containerHeight }}
            onScroll={handleScroll}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${offsetY}px)` }}>
                    {visibleItems.map((item, index) => 
                        renderItem(item, startIndex + index)
                    )}
                </div>
            </div>
        </div>
    );
});

// Debounced search input component
const DebouncedSearchInput = memo(({ 
    onSearch, 
    delay = 300, 
    placeholder = "Search...",
    className = ""
}) => {
    const [value, setValue] = React.useState('');
    const timeoutRef = React.useRef();

    const debouncedSearch = useCallback((searchValue) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
            onSearch(searchValue);
        }, delay);
    }, [onSearch, delay]);

    const handleChange = useCallback((e) => {
        const newValue = e.target.value;
        setValue(newValue);
        debouncedSearch(newValue);
    }, [debouncedSearch]);

    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <input
            type="text"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        />
    );
});

// Memoized card component for list items
const OptimizedCard = memo(({ 
    title, 
    content, 
    author, 
    date, 
    onClick,
    className = ""
}) => {
    const handleClick = useCallback(() => {
        if (onClick) onClick();
    }, [onClick]);

    const formattedDate = useMemo(() => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }, [date]);

    return (
        <div 
            className={`bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow duration-200 ${className}`}
            onClick={handleClick}
        >
            <h3 className="text-lg font-semibold mb-2 line-clamp-2">{title}</h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-3">{content}</p>
            <div className="flex justify-between items-center text-xs text-gray-500">
                <span>By {author}</span>
                <span>{formattedDate}</span>
            </div>
        </div>
    );
});

// Optimized modal component with portal
const OptimizedModal = memo(({ 
    isOpen, 
    onClose, 
    children, 
    className = "",
    closeOnOverlayClick = true 
}) => {
    const modalRef = React.useRef();

    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleOverlayClick = useCallback((e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
        }
    }, [closeOnOverlayClick, onClose]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    React.useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleOverlayClick}
        >
            <div 
                ref={modalRef}
                className={`bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto ${className}`}
            >
                {children}
            </div>
        </div>
    );
});

// Performance monitoring hook
export const usePerformanceMonitor = () => {
    const [metrics, setMetrics] = React.useState({
        renderCount: 0,
        lastRenderTime: 0,
        averageRenderTime: 0
    });

    React.useEffect(() => {
        const startTime = performance.now();
        
        return () => {
            const endTime = performance.now();
            const renderTime = endTime - startTime;
            
            setMetrics(prev => ({
                renderCount: prev.renderCount + 1,
                lastRenderTime: renderTime,
                averageRenderTime: (prev.averageRenderTime * prev.renderCount + renderTime) / (prev.renderCount + 1)
            }));
        };
    });

    return metrics;
};

// Error boundary for lazy components
class LazyComponentErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Lazy component loading error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-[200px] text-center p-4">
                    <div>
                        <p className="text-red-600 mb-2">Failed to load component</p>
                        <button 
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Higher-order component for adding performance monitoring
export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
    const PerformanceMonitoredComponent = memo((props) => {
        const renderStart = React.useRef();
        
        React.useEffect(() => {
            renderStart.current = performance.now();
        });

        React.useEffect(() => {
            if (renderStart.current) {
                const renderTime = performance.now() - renderStart.current;
                if (renderTime > 16) { // 16ms threshold (60fps)
                    console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
                }
            }
        });

        return <WrappedComponent {...props} />;
    });

    PerformanceMonitoredComponent.displayName = `withPerformanceMonitoring(${componentName})`;
    return PerformanceMonitoredComponent;
};

// Export all components
export {
    LazyPostEditor,
    LazyUserProfile,
    LazyDashboard,
    LazyChatInterface,
    LazyQuizGenerator,
    LazyLessonPlanner,
    LoadingFallback,
    LazyLoadWrapper,
    OptimizedImage,
    VirtualizedList,
    DebouncedSearchInput,
    OptimizedCard,
    OptimizedModal,
    LazyComponentErrorBoundary
};