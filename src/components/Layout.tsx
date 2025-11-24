// src/components/Layout.tsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, Plus, List, Building2 } from 'lucide-react';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Bhakti Sales</h1>
              <p className="text-sm text-gray-600">Quotation Manager</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          <NavLink
            to="/rates"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Rates Management</span>
          </NavLink>
          
          <NavLink
            to="/add-product"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Create Quotation</span>
          </NavLink>
          
          <NavLink
            to="/product-list"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <List className="w-5 h-5" />
            <span className="font-medium">Quotation Records</span>
          </NavLink>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <div className="text-sm text-gray-600">
              {new Date().toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;