// src/pages/RatesPage.tsx
import React, { useState } from 'react';
import { Edit3, Check, X } from 'lucide-react';
import { useQuotation } from '../context/QuotationContext';

const RatesPage: React.FC = () => {
  const { rates, updateRates } = useQuotation();
  const [isEditing, setIsEditing] = useState(false);
  const [editableRates, setEditableRates] = useState(rates);

  const brands = Object.keys(rates);
  const thicknesses = ['19MM', '12MM', '9MM', '6MM'];

  const handleEdit = () => {
    setIsEditing(true);
    setEditableRates({ ...rates });
  };

  const handleSave = () => {
    updateRates(editableRates);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditableRates(rates);
    setIsEditing(false);
  };

  const handleRateChange = (brand: string, thickness: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditableRates(prev => ({
      ...prev,
      [brand]: {
        ...prev[brand],
        [thickness]: numValue,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rate Management</h1>
          <p className="text-gray-600 mt-1">Manage plywood rates for all brands and thicknesses</p>
        </div>
        
        <div className="flex space-x-3">
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Rates</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Thickness
                </th>
                {brands.map(brand => (
                  <th key={brand} className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    {brand}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {thicknesses.map(thickness => (
                <tr key={thickness} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{thickness}</td>
                  {brands.map(brand => (
                    <td key={`${brand}-${thickness}`} className="px-6 py-4 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.5"
                          value={editableRates[brand][thickness as keyof typeof editableRates[typeof brand]]}
                          onChange={(e) => handleRateChange(brand, thickness, e.target.value)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      ) : (
                        <span className="text-lg font-medium text-gray-900">
                          ₹{rates[brand][thickness as keyof typeof rates[typeof brand]]}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isEditing && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-5 h-5 text-amber-600" />
            <p className="text-amber-800 font-medium">Editing Mode Active</p>
          </div>
          <p className="text-amber-700 text-sm mt-1">
            Make your changes and click "Save Changes" to update the rates, or "Cancel" to discard changes.
          </p>
        </div>
      )}
    </div>
  );
};

export default RatesPage;