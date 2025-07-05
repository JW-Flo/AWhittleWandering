/**
 * Vitest global setup for frontend component tests.
 * Extends expect() with @testing-library/jest-dom matchers
 * so assertions like toBeInTheDocument() & toHaveClass() are typed.
 */
import '@testing-library/jest-dom/vitest';
