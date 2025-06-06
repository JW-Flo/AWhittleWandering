import React, { Component } from 'react';
import PropTypes from 'prop-types';

/* eslint-env browser */

/**
 * Error Boundary component to catch and handle errors in React components
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to console
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
        this.setState({ errorInfo });

        // You can also log to an error reporting service
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return this.props.fallback ? (
                this.props.fallback(this.state.error, this.state.errorInfo)
            ) : (
                <div className="error-boundary">
                    <h2>Something went wrong.</h2>
                    <details style={{ whiteSpace: 'pre-wrap' }}>
                        <summary>Show details</summary>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    {this.props.resetErrorBoundary && (
                        <button
                            onClick={this.props.resetErrorBoundary}
                            style={{
                                marginTop: '20px',
                                padding: '8px 16px',
                                background: '#007aff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Try Again
                        </button>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired,
    fallback: PropTypes.func,
    onError: PropTypes.func,
    resetErrorBoundary: PropTypes.func
};

export default ErrorBoundary;
