import React from "react";
import * as ReactDOMClient from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Home from "./components/Home";
import Albums from "./components/Albums";
import Profile from "./components/Profile";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { AuthTokenProvider } from "./AuthTokenContext";
import Reviews from "./components/Reviews";
import NotFound from "./components/NotFound";
import AlbumDetail from "./components/AlbumDetail";
import AuthDebugger from "./components/AuthDebugger";
import VerifyUser from "./components/VerifyUser";

const container = document.getElementById("root");
const root = ReactDOMClient.createRoot(container);

const requestedScopes = [
  "profile",
  "email",
  "read:album",
  "read:user",
  "read:review",
  "edit:review",
  "edit:user",
  "delete:review",
  "write:album",
  "write:user",
  "write:review",
];

function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth0();

  // If the user is not authenticated, redirect to the home page
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  // Otherwise, display the children (the protected page)
  return children;
}

root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={process.env.REACT_APP_AUTH0_DOMAIN}
      clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/verify-user`,
        audience: process.env.REACT_APP_AUTH0_AUDIENCE,
        scope: requestedScopes.join(" "),
      }}
    >
      <AuthTokenProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/details/:albumId" element={<AlbumDetail />} />
              <Route path="/verify-user" element={<VerifyUser />} />
              <Route path="/albums" element={<Albums />} />
              <Route path="/AuthDebugger" element={<AuthDebugger />} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthTokenProvider>
    </Auth0Provider>
  </React.StrictMode>
);
