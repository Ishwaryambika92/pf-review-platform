import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import { NavBar } from "./components/NavBar";
import { Footer } from "./components/Footer";
import { FONT_IMPORT } from "./design/tokens";
import Home from "./pages/Home";
import AuthPage from "./pages/Auth";
import MyReviews from "./pages/MyReviews";
import AdminModeration from "./pages/AdminModeration";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import Disclaimer from "./pages/Disclaimer";
import ReviewPolicy from "./pages/ReviewPolicy";

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <style>{FONT_IMPORT}{`
           * {
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    width: 100%;
    max-width: 100%;
    margin: 0;
  }

  body {
    overflow-x: hidden;
  }

  .spin {
    animation: pf-spin 0.9s linear infinite;
  }

  @keyframes pf-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 767px) {
    .pf-directory-grid {
      grid-template-columns: 1fr !important;
      gap: 20px !important;
      width: 100% !important;
      max-width: 100% !important;
      .pf-reviews-column {
  order: 1;
}

.pf-service-column {
  order: 2;
}
    }

    .pf-directory-grid > * {
      min-width: 0 !important;
      max-width: 100% !important;
    }

    button,
    input,
    textarea,
    select {
      max-width: 100%;
    }

    img {
      max-width: 100%;
      height: auto;
    }
  }

          /* Navbar responsive behavior only — desktop links vs. mobile hamburger menu */
          .pf-nav-desktop-links { display: flex; }
          .pf-nav-hamburger-btn { display: none; }
          .pf-nav-mobile-menu { display: none; }
          @media (max-width: 860px) {
            .pf-nav-desktop-links { display: none; }
            .pf-nav-hamburger-btn { display: inline-flex; }
            .pf-nav-mobile-menu.open { display: flex; }
          }
        `}</style>
        <BrowserRouter>
          <NavBar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/my-reviews" element={<MyReviews />} />
            <Route path="/admin/moderation" element={<AdminModeration />} />

            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsConditions />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/review-policy" element={<ReviewPolicy />}/>
          </Routes>
          <Footer />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
