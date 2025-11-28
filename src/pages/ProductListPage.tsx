// src/pages/ProductListPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
// 👇 Added Trash2 icon
import { Download, MessageCircle, Edit3, FileText, Trash2 } from 'lucide-react';
import { useQuotation } from '../context/QuotationContext';
import { generatePDF } from '../utils/pdfGenerator';

const ProductListPage: React.FC = () => {
  const navigate = useNavigate();
  // 👇 Destructure deleteQuotation
  const { quotations, rates, deleteQuotation } = useQuotation();

  const handleDownload = (quotation: any) => {
    generatePDF(quotation, rates, quotation.brandAdjustments || {});
  };

  const handleWhatsApp = (quotation: any) => {
    const message = `Dear ${quotation.customer.name}, here is your quotation from Bhakti Sales - Vadodara. Quotation No: ${quotation.quotationNo}`;
    const encodedMessage = encodeURIComponent(message);
    const mobile = quotation.customer.mobile.replace(/\D/g, '');
    // 👉 Fixed: removed extra space in WhatsApp URL
    const whatsappUrl = `https://wa.me/91${mobile}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEdit = (quotation: any) => {
    navigate('/add-product', { state: { quotation } });
  };

  // 👇 Added handleDelete
  const handleDelete = (quotationNo: number) => {
    if (confirm('Are you sure you want to delete this quotation? This action cannot be undone.')) {
      deleteQuotation(quotationNo);
    }
  };

  const calculateBrandTotal = (quotation: any, brand: string) => {
    return quotation.products.reduce((total: number, product: any) => {
      return total + (product.brandTotals[brand] || 0);
    }, 0);
  };

  const calculateAdditionalItemsTotal = (quotation: any) => {
    return quotation.additionalItems.reduce((total: number, item: any) => {
      return total + item.total;
    }, 0);
  };

  const calculateGrandTotal = (quotation: any, brand: string) => {
    return calculateBrandTotal(quotation, brand) + calculateAdditionalItemsTotal(quotation);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quotation Records</h1>
          <p className="text-gray-600 mt-1">Manage and track all your quotations</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          <p className="text-amber-800 text-sm font-medium">
            Total Quotations: {quotations.length}
          </p>
        </div>
      </div>

      {quotations.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No quotations yet</h3>
          <p className="text-gray-600 mb-6">Create your first quotation to get started</p>
          <button
            onClick={() => navigate('/add-product')}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Create Quotation
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Quotation No.
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Customer Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Mobile Number
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Selected Brands
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Grand Total
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quotations.map((quotation) => (
                  <tr key={quotation.quotationNo} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        #{quotation.quotationNo}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {quotation.customer.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      +91 {quotation.customer.mobile}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {quotation.selectedBrands.slice(0, 2).map(brand => (
                          <span key={brand} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                            {brand.split(' ')[0]}
                          </span>
                        ))}
                        {quotation.selectedBrands.length > 2 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                            +{quotation.selectedBrands.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {quotation.selectedBrands.map(brand => (
                          <div key={brand} className="text-green-600 font-medium">
                            {brand.split(' ')[0]}: ₹{Math.round(calculateGrandTotal(quotation, brand)).toLocaleString()}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(quotation.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleDownload(quotation)}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleWhatsApp(quotation)}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          title="Send via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(quotation)}
                          className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit Quotation"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {/* 👇 Added Delete Button */}
                        <button
                          onClick={() => handleDelete(quotation.quotationNo)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Quotation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductListPage;