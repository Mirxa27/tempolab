import { Suspense } from "react";
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
import routes from "tempo-routes";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
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
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </>
    </Suspense>
  );
}

export default App;
