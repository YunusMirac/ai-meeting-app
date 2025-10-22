import { Link, useNavigate, useLocation } from "react-router-dom";
import "./styles/Navbar.css"

function HomePageNavbar() {
  const navigate = useNavigate();
  const location = useLocation(); // 1. Hook, um die aktuelle URL zu bekommen

  // 2. Prüfen, ob der Benutzer eingeloggt ist
  const isAuthenticated = !!localStorage.getItem("access_token"); // Oder "userToken"

  // 3. Deine spezielle Regel definieren: Auf diesen Seiten soll immer die " öffentliche" Navi angezeigt werden
  const publicPages = ['/', '/login', '/register'];
  const forcePublicView = publicPages.includes(location.pathname);

  function handleLogout() {
    localStorage.removeItem("access_token"); // Oder "userToken"
    navigate("/");
  }

  return (
    <nav className="navbar">
      {/* Die Hauptlogik: 
        Zeige die "eingeloggte" Navi an, WENN der User eingeloggt ist UND wir NICHT auf einer der öffentlichen Seiten sind.
        In ALLEN ANDEREN Fällen, zeige die "ausgeloggte" Navi.
      */}
      { isAuthenticated && !forcePublicView ? (
        // ----- EINGELOGGTE ANSICHT (z.B. auf /startpage) -----
        <>
          {/* Homelink zeigt zur Startseite */}
          <Link id="homeLink" to="/startpage">Home</Link>
          <button id="logoutButton" onClick={handleLogout}>Logout</button>
        </>
      ) : (
        // ----- ÖFFENTLICHE / AUSGELOGGTE ANSICHT -----
        <>
          {/* Homelink zeigt zur öffentlichen Homepage */}
          <ul className="navbar-list">
            <li><Link id="homeLink" to="/">AI-Meeting</Link></li>
          </ul>
          <ul className="navbar-list-right">
            <li><Link id="loginLink" className="hover-grow" to="/login">Login</Link></li>
            <li><Link id="registerLink" className="hover-grow" to="/register">Register</Link></li>
          </ul>
        </>
      )}
    </nav>
  );
}

export default HomePageNavbar;