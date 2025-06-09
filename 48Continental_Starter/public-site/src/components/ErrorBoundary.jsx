/* eslint-env browser */
import React from 'react';
import PropTypes from 'prop-types';

class ErrorBoundaryComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error,
            errorInfo,
            hasError: true
        });
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary-fallback">
                    <h2>Something went wrong loading the map</h2>
                    <p>We're working on fixing this. In the meantime, try refreshing the page.</p>
                    {this.props.showError && (
                        <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
                            <summary>Error details</summary>
                            <p style={{ color: 'red' }}>{this.state.error?.toString()}</p>
                            <small style={{ color: '#666' }}>
                                {this.state.errorInfo?.componentStack}
                            </small>
                        </details>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: '#007AFF',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

ErrorBoundaryComponent.propTypes = {
    children: PropTypes.node.isRequired,
    showError: PropTypes.bool
};

ErrorBoundaryComponent.defaultProps = {
    showError: false
};

export { ErrorBoundaryComponent as ErrorBoundary };
export default ErrorBoundaryComponent;
