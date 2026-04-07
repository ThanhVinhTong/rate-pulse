export default function AnalyticsPage() {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-500 mt-1">Overview • Last updated just now</p>
          </div>
  
          {/* Filters Section - ADD FILTERS HERE*/}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Filters</h2>
            <div className="flex flex-wrap gap-4">
              {/* Example filters - ADD FILTERS HERE*/}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Date Range</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                  <span className="flex items-center text-gray-400">to</span>
                  <input
                    type="date"
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
  
              <div>
                <label className="block text-sm text-gray-600 mb-1">Category</label>
                <select className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500">
                  <option>All</option>
                  <option>Sales</option>
                  <option>Revenue</option>
                  <option>Users</option>
                </select>
              </div>
  
              <div>
                <label className="block text-sm text-gray-600 mb-1">Status</label>
                <select className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500">
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>All</option>
                </select>
              </div>
  
              <button className="mt-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
                Apply Filters
              </button>
            </div>
          </div>
  
          {/* Converter Section */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Converter</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm text-gray-600 mb-2">From</label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="100"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                  />
                  <select className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500">
                    <option>USD</option>
                    <option>EUR</option>
                    <option>AUD</option>
                  </select>
                </div>
              </div>
  
              <div>
                <label className="block text-sm text-gray-600 mb-2">To</label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="145"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                    readOnly
                  />
                  <select className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500">
                    <option>AUD</option> {/* THERE IS Currency type from @/types/exchange-rates.ts*/}
                    <option>USD</option>
                    <option>EUR</option>
                  </select>
                </div>
              </div>
            </div>
            <button className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium">
              Convert
            </button>
          </div>
  
          {/* Chart Section */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Chart</h2>
              <div className="flex gap-2">
                <button className="px-4 py-1 text-sm font-medium rounded-lg border border-gray-300">Week</button>
                <button className="px-4 py-1 text-sm font-medium rounded-lg border border-gray-300 bg-blue-50 text-blue-600">Month</button>
                <button className="px-4 py-1 text-sm font-medium rounded-lg border border-gray-300">Year</button>
              </div>
            </div>
            
            {/* Simple chart placeholder - you can replace with Chart.js / Recharts later */}
            <div className="h-96 bg-gray-100 rounded-2xl flex items-center justify-center border border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-5xl mb-2">📊</div>
                <p className="text-gray-400 font-medium">Your chart will appear here</p>
                <p className="text-xs text-gray-500 mt-1">Replace this div with your charting library</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }