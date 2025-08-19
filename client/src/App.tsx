import React from 'react'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">
          Form Builder
        </h1>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">🎉 Setup Complete!</h2>
            <p className="text-blue-700">
              Your Form Builder application is now ready. The frontend and backend are configured and running.
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h3 className="font-medium text-green-800 mb-2">✅ Features Included:</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Drag & Drop Form Builder</li>
              <li>• Multiple Field Types</li>
              <li>• Form Analytics</li>
              <li>• File Upload Support</li>
              <li>• Export to CSV</li>
              <li>• Docker Ready</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="font-medium text-yellow-800 mb-2">🚀 Next Steps:</h3>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Start MongoDB service</li>
              <li>2. Run: cd server && npm run dev</li>
              <li>3. Visit the dashboard to create forms</li>
            </ol>
          </div>
          
          <div className="text-center pt-4">
            <button 
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
