import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import FormBuilder from './pages/FormBuilder'
import EditForm from './pages/EditForm'
import FormView from './pages/FormView'
import Analytics from './pages/Analytics'
import FormSubmission from './pages/FormSubmission'
import PublicForm from './pages/PublicForm'

function App() {
  return (
    <Router>
      <Routes>
        {/* Public form route (no layout) */}
        <Route path="/public/:slug" element={<PublicForm />} />
        
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Main layout with nested routes */}
        <Route path="/" element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="forms" element={<Dashboard />} />
          <Route path="forms/new" element={<FormBuilder />} />
          <Route path="forms/:id" element={<FormView />} />
          <Route path="forms/:id/edit" element={<EditForm />} />
          <Route path="forms/:id/submissions" element={<FormSubmission />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="analytics/:id" element={<Analytics />} />
          
          {/* Settings page - you can create this later */}
          <Route path="settings" element={
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">Settings</h1>
              <p className="text-gray-600">Settings page coming soon...</p>
            </div>
          } />
        </Route>
        
        {/* Catch all route - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App
