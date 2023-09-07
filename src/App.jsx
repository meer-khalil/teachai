import React from "react";

import { Route, Routes } from "react-router-dom";

import Home from './components/Home/Home'
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Contact from "./components/Contact/Contact";
import FAQ from "./components/FAQ/FAQ";
import Pricing from "./components/Pricing/Pricing";
import About from "./components/About/About";
import Privacy from "./components/Privacy/Privacy";
import Terms from "./components/Terms/Terms";
import Affliate from "./components/Afflisate/Affliate";
import Teachers from "./components/Teacher/Teachers";

import Signup from './components/Signup/Signup'
import Login from './components/Login/Login'
import AdminDashboard from "./components/Admin/Dashbaord/AdminDashboard";

// import PaymentPage from "./components/Stripe/StripeForm";

import Blog from "./components/Blog/Blog";
import BlogPost from "./components/BlogPost/BlogPost";
import Success from "./components/Stripe/Success";
import Cancel from "./components/Stripe/Cancel";
import Stripe from "./components/Stripe/Stripe";
import UserDashboard from "./components/Dashboard/UserDashboard";
import YourComponent from "./components/Pdf/YourComponent";
import Stories from "./components/Blog/Stories/Stories";
import DetailStory from "./components/Blog/Stories/DetailStory";
import Editor from "./components/Editor/Editor";
import TinyMCE from "./components/Editor/TinyMCE";

export default function App() {
  // const site = 'https://teachai32.netlify.app'
  // const site = null;

  return (
    <div>
      <Navbar />
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/teachers" element={<Teachers />} />

        <Route path="/affliate" element={<Affliate />} />


        <Route path="/about" element={<About />} />

        <Route path="/contact" element={<Contact />} />

        <Route path="/faq" element={<FAQ />} />

        <Route path="/pricing" element={<Pricing />} />

        <Route path="/privacy" element={<Privacy />} />

        <Route path="/terms" element={<Terms />} />


        <Route path="/signup" element={<Signup />} />

        <Route path="/login" element={<Login />} />

        <Route path="/admin/dashboard/*" element={<AdminDashboard />} />

        <Route path="/user/dashboard/*" element={<UserDashboard />} />

        {/* <Route path="/blogs" element={<Blog />} /> */}

        <Route path="/stories" element={<Stories />} />

        <Route exact path="/story/:slug" element={<DetailStory />} />

        {/* <Route path="/blogs/:postId" element={<BlogPost />} /> */}

        <Route path="/payment" element={<Stripe />} />

        <Route path="/success" element={<Success />} />

        <Route path="/cancel" element={<Cancel />} />

        <Route path="/pdf" element={<YourComponent />} />

        {/* <Route path="/editor" element={<Editor />} /> */}

        {/* <Route path="/tinyeditor" element={<TinyMCE />} /> */}


      </Routes>

      <Footer />

    </div>
  );
}