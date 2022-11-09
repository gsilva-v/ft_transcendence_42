import './main.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import SignIn from './pages/SignIn/SignIn';
import NotFound from './pages/NotFound/NotFound';
import OAuth from './pages/OAuth/OAuth';
import { AuthProvider } from './auth/auth';
import Profile from './pages/Profile/Profile';
import Game from './pages/Game/Game';
import { NavBar } from './components/NavBar/NavBar';
import { RequireAuth, ValidadeSignin } from './utils/utils';
import Chat from './pages/Chat/Chat';

export default function AppRouter() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <RequireAuth>
                <NavBar />
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <NavBar />
                <Profile />
              </RequireAuth>
            }
          />
          <Route
            path="/game"
            element={
              <RequireAuth>
                <Game />
              </RequireAuth>
            }
          />
          <Route
            path="/chat"
            element={
              <RequireAuth>
                <NavBar />
                <Chat />
              </RequireAuth>
            }
          />
          <Route
            path="/community"
            element={
              <RequireAuth>
                <NavBar />
                <Chat />
              </RequireAuth>
            }
          />

          <Route path="/oauth" element={<OAuth />} />
          <Route
            path="/signin"
            element={
              <ValidadeSignin >
                <SignIn />
              </ValidadeSignin>
            } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
