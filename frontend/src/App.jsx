import { Link, Outlet } from 'react-router-dom';

function App() {
  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-light px-4">
        <Link to="/" className="navbar-brand">School Payment</Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto">
            <li className="nav-item"><Link to="/" className="nav-link">Orders</Link></li>
            <li className="nav-item"><Link to="/login" className="nav-link">Login</Link></li>
            <li className="nav-item"><Link to="/register" className="nav-link">Register</Link></li>
          </ul>
        </div>
      </nav>
      <div className="container mt-4">
        <Outlet />
      </div>
    </div>
  );
}

export default App;
