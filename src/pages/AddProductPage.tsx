// src/pages/AddProductPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Minus, Trash2, FileText, Package } from 'lucide-react';
import { useQuotation } from '../context/QuotationContext';
import { Customer, ProductRow, AdditionalItem, Quotation } from '../types';
import { generatePDF } from '../utils/pdfGenerator';

const PREDEFINED_ADDITIONAL_ITEMS = [
  'BLOCKBOARD 19MM',
  'BLOCKBOARD 25MM',
  'DURIAN-DIXON LINER 0.8MM',
  'TELESCOPIC CHANNEL',
  'SLIM BOX TENDOM',
  'FEVICOL',
  'BLUCOAT',
  'HARDWARE FITTINGS',
  'HINGES',
  'AUTO HINGES 0"',
  'AUTO HINGES 8"',
  'CHARCOAL PANELS & LOUVERS',
  'WPL PANELS 10FT * 1 FT',
  'PVC SHEETS',
  'PRINTED SOLID WPC DOORS',
  'WPC FRAMES',
];

const SIZE_OPTIONS = [
  { label: '8 x 4', sqft: 32 },
  { label: '7 x 4', sqft: 28 },
  { label: '7 x 3', sqft: 21 },
  { label: '6 x 4', sqft: 24 },
  { label: '6 x 3', sqft: 18 },
  { label: '6 x 2.5', sqft: 15 },
];

const AddProductPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rates, addQuotation, updateQuotation, quotations } = useQuotation();
  
  // Check if we're editing an existing quotation
  const editingQuotation = location.state?.quotation as Quotation | undefined;
  const isEditing = !!editingQuotation;

  const [customer, setCustomer] = useState<Customer>({
    name: '',
    mobile: '',
    address: '',
  });

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [increasePercentage, setIncreasePercentage] = useState<number>(0);
  const [decreasePercentage, setDecreasePercentage] = useState<number>(0);
  
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>([]);

  const brands = Object.keys(rates);
  const thicknesses = ['19MM / 18MM', '12MM', '9MM', '6MM'];

  // Initialize form with existing quotation data if editing
  useEffect(() => {
    if (editingQuotation) {
      setCustomer(editingQuotation.customer);
      setSelectedBrands(editingQuotation.selectedBrands);
      setProducts(editingQuotation.products);
      setAdditionalItems(editingQuotation.additionalItems);
      
      // Set percentage adjustments if they exist
      const brandAdjustments = editingQuotation.brandAdjustments || {};
      const firstBrandAdjustment = Object.values(brandAdjustments)[0] || 0;
      if (firstBrandAdjustment > 0) {
        setIncreasePercentage(firstBrandAdjustment);
      } else if (firstBrandAdjustment < 0) {
        setDecreasePercentage(Math.abs(firstBrandAdjustment));
      }
    } else {
      // Initialize with one row for each thickness
      const initialProducts: ProductRow[] = thicknesses.map(thickness => ({
        id: `${thickness}-${Date.now()}-${Math.random()}`,
        thickness,
        size: '8 x 4',
        quantity: 0,
        totalSqFt: 0,
        brandTotals: {},
      }));
      setProducts(initialProducts);
    }
  }, [editingQuotation]);

  // Update brand totals when rates, percentages, or selected brands change
  useEffect(() => {
    setProducts(prev => prev.map(product => {
      const updatedProduct = { ...product };
      selectedBrands.forEach(brand => {
        const adjustedRate = getAdjustedRate(brand, product.thickness);
        updatedProduct.brandTotals[brand] = adjustedRate * product.totalSqFt;
      });
      return updatedProduct;
    }));
  }, [selectedBrands, increasePercentage, decreasePercentage, rates]);

  const handleBrandSelection = (brand: string) => {
    setSelectedBrands(prev => {
      const isSelected = prev.includes(brand);
      if (isSelected) {
        return prev.filter(b => b !== brand);
      } else {
        return [...prev, brand];
      }
    });
  };

  const getAdjustedRate = (brand: string, thickness: string) => {
    // Map thickness display names to rate keys
    const thicknessMap: { [key: string]: string } = {
      '19MM / 18MM': '19MM',
      '12MM': '12MM',
      '9MM': '9MM',
      '6MM': '6MM',
    };
    
    const rateKey = thicknessMap[thickness] || thickness;
    const baseRate = rates[brand]?.[rateKey as keyof typeof rates[typeof brand]] || 0;
    
    let adjustment = 0;
    if (increasePercentage > 0) {
      adjustment = increasePercentage;
    } else if (decreasePercentage > 0) {
      adjustment = -decreasePercentage;
    }
    
    return baseRate * (1 + adjustment / 100);
  };

  const addProductRow = (thickness: string) => {
    const newProduct: ProductRow = {
      id: `${thickness}-${Date.now()}-${Math.random()}`,
      thickness,
      size: '8 x 4',
      quantity: 0,
      totalSqFt: 0,
      brandTotals: {},
    };
    
    selectedBrands.forEach(brand => {
      newProduct.brandTotals[brand] = 0;
    });

    setProducts(prev => [...prev, newProduct]);
  };

  const updateProductRow = (id: string, field: keyof ProductRow, value: any) => {
    setProducts(prev => prev.map(product => {
      if (product.id === id) {
        const updatedProduct = { ...product, [field]: value };
        
        if (field === 'size' || field === 'quantity') {
          const sizeOption = SIZE_OPTIONS.find(s => s.label === updatedProduct.size);
          const sqft = sizeOption ? sizeOption.sqft * updatedProduct.quantity : 0;
          updatedProduct.totalSqFt = sqft;
          
          // Recalculate brand totals
          selectedBrands.forEach(brand => {
            const adjustedRate = getAdjustedRate(brand, updatedProduct.thickness);
            updatedProduct.brandTotals[brand] = adjustedRate * sqft;
          });
        }
        
        return updatedProduct;
      }
      return product;
    }));
  };

  const removeProductRow = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addAdditionalItem = () => {
    const newItem: AdditionalItem = {
      id: `additional-${Date.now()}`,
      productName: PREDEFINED_ADDITIONAL_ITEMS[0],
      description: '',
      quantity: 1,
      rate: 0,
      total: 0,
    };
    setAdditionalItems(prev => [...prev, newItem]);
  };

  const updateAdditionalItem = (id: string, field: keyof AdditionalItem, value: any) => {
    setAdditionalItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updatedItem.total = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const removeAdditionalItem = (id: string) => {
    setAdditionalItems(prev => prev.filter(i => i.id !== id));
  };

  const calculateBrandTotal = (brand: string) => {
    return products.reduce((total, product) => total + (product.brandTotals[brand] || 0), 0);
  };

  const calculateAdditionalItemsTotal = () => {
    return additionalItems.reduce((total, item) => total + item.total, 0);
  };

  const handleGenerateQuotation = () => {
    // Validation
    if (!customer.name || !customer.mobile || selectedBrands.length === 0) {
      alert('Please fill in all customer details and select at least one brand.');
      return;
    }

    // Prepare data for API
    const quotationData = {
      customer: {
        name: customer.name.trim(),
        mobile: customer.mobile.trim(),
        address: customer.address?.trim() || '',
      },
      selectedBrands: [...selectedBrands],
      brandAdjustments: selectedBrands.reduce((acc, brand) => {
        acc[brand] = increasePercentage > 0 ? increasePercentage : decreasePercentage > 0 ? -decreasePercentage : 0;
        return acc;
      }, {} as { [brand: string]: number }),
      products: products.map(product => ({
        ...product,
        brandTotals: { ...product.brandTotals },
      })),
      additionalItems: additionalItems.map(item => ({
        ...item,
        total: item.quantity * item.rate,
      })),
    };

    // Send to backend
    addQuotation(quotationData);

    // Generate PDF
    const nextNo = quotations.length > 0
      ? Math.max(...quotations.map(q => q.quotationNo)) + 1
      : 1001;

    generatePDF({
      ...quotationData,
      quotationNo: nextNo,
      createdAt: new Date(),
    }, rates, quotationData.brandAdjustments);

    navigate('/product-list');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Quotation' : 'Create New Quotation'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Modify existing quotation details' : 'Generate professional quotations for your customers'}
          </p>
        </div>
        {isEditing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <p className="text-blue-800 text-sm font-medium">
              Editing Quotation #{editingQuotation?.quotationNo}
            </p>
          </div>
        )}
      </div>

      {/* Customer Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name *
            </label>
            <input
              type="text"
              value={customer.name}
              onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="Enter customer name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Number *
            </label>
            <input
              type="tel"
              value={customer.mobile}
              onChange={(e) => setCustomer(prev => ({ ...prev, mobile: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="Enter mobile number"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              value={customer.address}
              onChange={(e) => setCustomer(prev => ({ ...prev, address: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="Enter customer address"
            />
          </div>
        </div>
      </div>

      {/* Product Rates Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Package className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Product Rates</h2>
        </div>

        {/* Rate Adjustments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Increase %
            </label>
            <input
              type="number"
              step="0.1"
              value={increasePercentage}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                setIncreasePercentage(value);
                if (value > 0) setDecreasePercentage(0);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Decrease %
            </label>
            <input
              type="number"
              step="0.1"
              value={decreasePercentage}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                setDecreasePercentage(value);
                if (value > 0) setIncreasePercentage(0);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>
        </div>

        {/* Brand Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Brands:
          </label>
          <div className="flex flex-wrap gap-4">
            {brands.map(brand => (
              <label key={brand} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => handleBrandSelection(brand)}
                  className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                />
                <span className="font-medium text-gray-900">
                  {brand.replace('Semiwaterproof 303', '').replace('Waterproof 710', 'WATERPROOF 710').trim()}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Product Table */}
        {selectedBrands.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    THICKNESS
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200">
                    SIZE
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200">
                    QUANTITY
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200">
                    TOTAL SQ FT
                  </th>
                  {selectedBrands.map(brand => (
                    <th key={brand} className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200">
                      {brand.replace('Semiwaterproof 303', '').replace('Waterproof 710', 'WATERPROOF 710').trim()}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {thicknesses.map(thickness => (
                  <React.Fragment key={thickness}>
                    {products.filter(p => p.thickness === thickness).map((product, index) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900 border-r border-gray-200">
                          {index === 0 ? thickness : ''}
                        </td>
                        <td className="px-4 py-3 border-r border-gray-200">
                          <select
                            value={product.size}
                            onChange={(e) => updateProductRow(product.id, 'size', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {SIZE_OPTIONS.map(option => (
                              <option key={option.label} value={option.label}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-center border-r border-gray-200">
                          <input
                            type="number"
                            min="0"
                            value={product.quantity}
                            onChange={(e) => updateProductRow(product.id, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center border-r border-gray-200">
                          <div className="text-sm text-gray-600">
                            {SIZE_OPTIONS.find(s => s.label === product.size)?.sqft} sq ft/unit
                          </div>
                          <div className="font-medium">
                            {product.totalSqFt} sq ft
                          </div>
                        </td>
                        {selectedBrands.map(brand => (
                          <td key={brand} className="px-4 py-3 text-center border-r border-gray-200">
                            <div className="text-sm text-gray-600">
                              ₹{Math.round(getAdjustedRate(brand, thickness))}/sq ft
                            </div>
                            <div className="font-medium text-green-600">
                              ₹{Math.round(product.brandTotals[brand] || 0)}
                            </div>
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {index === 0 && (
                              <button
                                onClick={() => addProductRow(thickness)}
                                className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                                title="Add Row"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                            {products.filter(p => p.thickness === thickness).length > 1 && (
                              <button
                                onClick={() => removeProductRow(product.id)}
                                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Remove Row"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                
                {/* Totals Row */}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-4 py-3 text-right border-r border-gray-200" colSpan={4}>
                    Total
                  </td>
                  {selectedBrands.map(brand => (
                    <td key={brand} className="px-4 py-3 text-center text-green-600 border-r border-gray-200">
                      ₹{Math.round(calculateBrandTotal(brand))}
                    </td>
                  ))}
                  <td className="px-4 py-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Additional Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Additional Items</h2>
          <button
            onClick={addAdditionalItem}
            className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>

        {additionalItems.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Qty</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Rate</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Total</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {additionalItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <select
                        value={item.productName}
                        onChange={(e) => updateAdditionalItem(item.id, 'productName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      >
                        {PREDEFINED_ADDITIONAL_ITEMS.map(product => (
                          <option key={product} value={product}>
                            {product}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateAdditionalItem(item.id, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="Description"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateAdditionalItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateAdditionalItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-green-600">
                      ₹{Math.round(item.total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => removeAdditionalItem(item.id)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {additionalItems.length > 0 && (
          <div className="mt-4 text-right">
            <p className="text-lg font-semibold text-gray-900">
              Additional Items Total: <span className="text-green-600">₹{Math.round(calculateAdditionalItemsTotal())}</span>
            </p>
          </div>
        )}
      </div>

      {/* Generate Quotation Button */}
      <div className="flex justify-center">
        <button
          onClick={handleGenerateQuotation}
          className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all transform hover:scale-105 shadow-lg"
        >
          <FileText className="w-6 h-6" />
          <span className="text-lg font-semibold">
            {isEditing ? 'Update Quotation' : 'Generate Quotation'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default AddProductPage;