import { Suspense, useEffect } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
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
import AdminPage from "./pages/admin";
import ErrorBoundary from "./components/ErrorBoundary";
import { initializeErrorHandler } from "./lib/error-handler";
import routes from "tempo-routes";

// Loading component with improved UX
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading HabibStay...</p>
    </div>
  </div>
);

function App() {
  useEffect(() => {
    // Initialize global error handling
    initializeErrorHandler();
    
    // Set up performance monitoring
    if ('performance' in window && 'observe' in window.PerformanceObserver.prototype) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            console.log('Page load time:', entry.duration);
          }
        }
      });
      observer.observe({ entryTypes: ['navigation'] });
    }
  }, []);

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
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
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
          {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
        </>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
