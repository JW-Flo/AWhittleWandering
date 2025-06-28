import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Call.import;
React;
from;
'react';
import { Link } from 'react-router-dom';
export default function NotFoundPage() {
    return (_jsxs("div", { className: "not-found-page", children: [_jsx("h1", { children: "404 - Page Not Found" }), _jsx("p", { children: "Oops! The page you're looking for doesn't exist or has been moved." }), _jsxs("div", { className: "not-found-suggestions", children: [_jsx("h2", { children: "You might want to try:" }), _jsxs("ul", { children: [_jsx("li", { children: _jsx(Link, { to: "/", children: "Return to the Homepage" }) }), _jsx("li", { children: _jsx(Link, { to: "/map", children: "View the Live Trip Map" }) }), _jsx("li", { children: _jsx(Link, { to: "/log", children: "Check the Trip Log" }) })] })] }), _jsx("div", { className: "not-found-image", children: _jsx("img", { src: "/images/lost-tesla.svg", alt: "Lost Tesla", onError: (e) => {
                        const target = e.target;
                        target.src = '/images/fallback-image.png';
                    } }) })] }));
}
