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
import AdminHome from "./pages/admin/index";
import AdminProperties from "./pages/admin/properties";
import AdminConfig from "./pages/admin/config";
import AdminUsers from "./pages/admin/users";

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
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/properties" element={<AdminProperties />} />
          <Route path="/admin/config" element={<AdminConfig />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </>
    </Suspense>
  );
}

export default App;
