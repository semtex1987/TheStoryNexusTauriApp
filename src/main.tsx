import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { ThemeProvider } from "./lib/theme-provider";
import { ToastContainer } from "react-toastify";
import { SongProvider } from "@/features/songs/context/SongContext";
import App from "./app";
// Styles
import "./index.css";
import "react-toastify/dist/ReactToastify.css";

// Pages
import Home from "./features/songs/pages/Home";
import SongDashboard from "./features/songs/pages/SongDashboard";
import Sections from "./features/sections/pages/Sections";
import SectionEditorPage from "./features/sections/pages/SectionEditorPage";
import PromptsPage from "./features/prompts/pages/PromptsPage";
import AISettingsPage from "./features/ai/pages/AISettingsPage";
import { MainLayout } from "./components/MainLayout";
import SongElementsPage from "./features/song-elements/pages/SongElementsPage";
import BrainstormPage from "./features/brainstorm/pages/BrainstormPage";
import GuidePage from "./features/guide/pages/GuidePage";
import NotesPage from "./features/notes/pages/NotesPage";
// biome-ignore lint/style/noNonNullAssertion: <explanation>

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="app-theme">
      <BrowserRouter>
        <SongProvider>
          <Routes>
            {/* Landing page */}
            <Route path="/" element={<App />} />

            {/* Routes with MainLayout */}
            <Route element={<MainLayout />}>
              {/* Songs section */}
              <Route path="/songs" element={<Home />} />
              {/* AI Settings */}
              <Route path="/ai-settings" element={<AISettingsPage />} />
              {/* Guide */}
              <Route path="/guide" element={<GuidePage />} />
            </Route>

            {/* Song Dashboard */}
            <Route path="/dashboard/:songId" element={<SongDashboard />}>
              <Route path="sections" element={<Sections />} />
              <Route
                path="sections/:sectionId"
                element={<SectionEditorPage />}
              />
              <Route path="prompts" element={<PromptsPage />} />
              <Route path="song-elements" element={<SongElementsPage />} />
              <Route path="brainstorm" element={<BrainstormPage />} />
              <Route path="notes" element={<NotesPage />} />
            </Route>
          </Routes>
        </SongProvider>
        <ToastContainer />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
