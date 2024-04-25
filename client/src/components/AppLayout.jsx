import "../style/appLayout.css";

import { Outlet, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

export default function AppLayout() {
  const { user, isLoading, isAuthenticated, logout, loginWithRedirect } = useAuth0();

  const navigate = useNavigate();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="title">
          <h1>Swift Sounds</h1>
          <h2>Write reviews for Taylor Swift albums!</h2>
        </div>

        <nav className="menu">
          <ul className="menu-list">
            <li>
              <button
                className="nav-button"
                onClick={() => navigate("../home")}
              >
                Home
              </button>
            </li>

            <li>
                  <button
                    className="nav-button"
                    onClick={() => navigate("../Albums")}
                  >
                    Albums
                  </button>
                </li>

            {!isAuthenticated ? (
              <li>
                <button className="nav-button" onClick={loginWithRedirect}>
                  Login/Sign Up
                </button>
              </li>
            ) : (
              <>
                
                <li>
                  <button
                    className="nav-button"
                    onClick={() => navigate("../Reviews")}
                  >
                    My Reviews
                  </button>
                </li>

                <li>
                  <button
                    className="nav-button"
                    onClick={() => navigate("../profile")}
                  >
                    My Profile
                  </button>
                </li>

                <li>
                  <button
                    className="nav-button"
                    onClick={() => navigate("../authdebugger")}
                  >
                    Auth Debugger
                  </button>
                </li>

                
              </>
            )}
          </ul>
        </nav>
        {isAuthenticated && (
          <div className="user-section">
            <span>Welcome 👋 {user.nickname}</span>
            <button className="exit-button" onClick={() => logout({ returnTo: "/home" })}>
              Log Out
            </button>
          </div>
        )}
      </header>

      <div className="content">
        <Outlet />
      </div>

      <footer className="footer">
        &copy;{new Date().getFullYear()} CS5610 <br />
        Yiwen Xu
      </footer>
    </div>
  );
}