import { Suspense, lazy } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./components/home";
import AboutPage from "./pages/about";
import ServicesPage from "./pages/services";
import ForGuestsPage from "./pages/for-guests";
import ForInvestorsPage from "./pages/for-investors";
import ForPropertyOwnersPage from "./pages/for-property-owners";
import ContactPage from "./pages/contact";
import FAQPage from "./pages/faq";
import BlogPage from "./pages/blog";
import SuccessStoriesPage from "./pages/success-stories";
import routes from "tempo-routes";

// Lazy load admin panel
const AdminDashboard = lazy(() => import("./pages/admin"));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/for-guests" element={<ForGuestsPage />} />
            <Route path="/for-investors" element={<ForInvestorsPage />} />
            <Route
              path="/for-property-owners"
              element={<ForPropertyOwnersPage />}
            />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/success-stories" element={<SuccessStoriesPage />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Routes>
          {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
        </>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
