// Import Tailwind CSS
import 'tailwindcss/tailwind.css';

// Main layout component
function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-black text-white p-4">
        <h1 className="text-3xl font-bold">48 Continental</h1>
        <nav className="mt-2">
          <a href="#" className="mr-4 hover:underline">Home</a>
          <a href="#" className="mr-4 hover:underline">About</a>
          <a href="#" className="mr-4 hover:underline">Route Map</a>
          <a href="#" className="hover:underline">Contact</a>
        </nav>
      </header>
      <main className="flex-1 p-8">
        <section className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Journey Across America</h2>
          <p className="text-lg text-gray-700">A 60-day electric vehicle adventure through all 48 states.</p>
        </section>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-2xl font-semibold mb-4">Live Route Status</h3>
            <p>Current Stop: Loading...</p>
            <p>Next Stop: Loading...</p>
            <p>ETA: Loading...</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-2xl font-semibold mb-4">Gallery</h3>
            <p>Photos and videos coming soon!</p>
          </div>
        </div>
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>&copy; 2025 48 Continental. Built on the road. Hosted on Cloudflare.</p>
      </footer>
    </div>
  );
}

export default App;
