import { Outlet, Link, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };
  
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <Link to="/">
            <h1>A Whittle Wandering</h1>
            <span className="tagline">48 states, One Tesla, One epic journey</span>
          </Link>
        </div>
        
        <nav className="main-nav">
          <ul>
            <li className={isActive('/')}>
              <Link to="/">Home</Link>
            </li>
            <li className={isActive('/map')}>
              <Link to="/map">Live Map</Link>
            </li>
            <li className={isActive('/daily-log') || (location.pathname.startsWith('/daily-log/') ? 'active' : '')}>
              <Link to="/daily-log">Daily Log</Link>
            </li>
            <li className={isActive('/about')}>
              <Link to="/about">About</Link>
            </li>
          </ul>
        </nav>
      </header>
      
      <main className="app-content">
        <Outlet />
      </main>
      
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>A Whittle Wandering</h3>
            <p>© {new Date().getFullYear()} A Whittle Wandering</p>
          </div>
          
          
          <div className="footer-section">
            <h3>Resources</h3>
            <ul>
              <li><Link to="/about">About the Trip</Link></li>
              <li><a href="https://www.tesla.com/supercharger" target="_blank" rel="noopener noreferrer">Supercharger Network</a></li>
              <li><a href="https://www.nps.gov/" target="_blank" rel="noopener noreferrer">National Parks</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>Powered by Cloudflare Workers | Built with ❤️ in the USA</p>
        </div>
      </footer>
    </div>
  );
}
