import React from 'react'
import { useParams } from 'react-router-dom'

const FormSubmission: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-card border border-border rounded-lg p-8">
          <h1 className="text-2xl font-bold mb-2">Sample Contact Form</h1>
          <p className="text-muted-foreground mb-8">Please fill out all required fields.</p>
          
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Name *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address *
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Subject
              </label>
              <select className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring">
                <option>General Inquiry</option>
                <option>Support</option>
                <option>Sales</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Message *
              </label>
              <textarea
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                rows={4}
                placeholder="Enter your message"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
            >
              Submit Form
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default FormSubmission
