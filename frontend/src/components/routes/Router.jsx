import React, { Suspense } from "react";
import styles from "./Router.module.css";
import {Routes, Route, Navigate } from "react-router-dom";

const Login = React.lazy(() => import("../check/login/Login"));
const Signup = React.lazy(() => import("../check/signup/Signup"));
const Home = React.lazy(() => import("../../pages/home/Home"));
const MessageBox = React.lazy(() => import("../chat/MessageBox"));
const Friend_request = React.lazy(() => import("../friend_request/Friend_request"));
const Friend_request_lists = React.lazy(() => import("../friend_request_lists/Friend_request_lists"));
const Profile= React.lazy(() => import("../profile/Profile"));
const Edit_profile= React.lazy(() => import("../edit_profile/Edit_profile"));
const Not_Found = React.lazy(() => import("../Not_found/Not_Found"));

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/" replace /> : children;
}

function Router() {
  return (
    
        <div className={styles.routeContainer}>
      <Suspense
        fallback={
          <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
            <p className={styles.loadingText}>Loading Page...</p>
          </div>
        }
      >
        <Routes>

          {/* Default redirect */}
          

          {/* Public routes */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />

          <Route path="/signup" element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } />

          {/* Protected route */}
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/chat/:email" element={
            <ProtectedRoute>
              <MessageBox />
            </ProtectedRoute>
          } />

          <Route path="/friend-request" element={
            <ProtectedRoute>
              <Friend_request />
            </ProtectedRoute>
          } />

          <Route path="/friend-request-list" element={
            <ProtectedRoute>
              <Friend_request_lists />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/edit-profile" element={
            <ProtectedRoute>
              <Edit_profile />
            </ProtectedRoute>
          } />

          {/* Not Found */}
          <Route path="*" element={
            <ProtectedRoute>
              <Not_Found />
            </ProtectedRoute>
          } />
         

        </Routes>
      </Suspense>
    </div>
   
  );
}

export default Router;