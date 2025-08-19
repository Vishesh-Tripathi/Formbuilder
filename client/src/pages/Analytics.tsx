import React from 'react'
import { useParams } from 'react-router-dom'

const Analytics: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">View detailed insights for your form</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-6 rounded-lg border">
          <div className="text-2xl font-bold text-foreground">124</div>
          <div className="text-sm text-muted-foreground">Total Submissions</div>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <div className="text-2xl font-bold text-foreground">87%</div>
          <div className="text-sm text-muted-foreground">Completion Rate</div>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <div className="text-2xl font-bold text-foreground">2.5m</div>
          <div className="text-sm text-muted-foreground">Avg. Time</div>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <div className="text-2xl font-bold text-foreground">+12%</div>
          <div className="text-sm text-muted-foreground">Growth</div>
        </div>
      </div>
      
      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Submissions Over Time</h3>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Chart visualization would go here
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Field Response Rates</h3>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Chart visualization would go here
          </div>
        </div>
      </div>
      
      {/* Recent Submissions */}
      <div className="bg-card rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Recent Submissions</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <div className="font-medium">Submission #{item}</div>
                  <div className="text-sm text-muted-foreground">2 hours ago</div>
                </div>
                <button className="text-primary hover:text-primary/80">
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
