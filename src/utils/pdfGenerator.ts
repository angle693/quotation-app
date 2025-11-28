import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Quotation, RateData } from '../types';

// Helper function to load image as base64
const loadImageAsBase64 = (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};

export const generatePDF = async (
  quotation: Quotation,
  rates: RateData,
  brandAdjustments: { [brand: string]: number }
) => {
  // Mapping of brand details for label and code
  const brandDetails: { [brand: string]: { label: string; code: string } } = {
    'Duraflame Semiwaterproof 303': { label: 'semiwaterproof', code: '303' },
    'Durbi Semiwaterproof 303': { label: 'semiwaterproof', code: '303' },
    'Nocte Semiwaterproof 303': { label: 'semiwaterproof', code: '303' },
    'Nocte Waterproof 710': { label: 'waterproof', code: '710' }
  };

  // Create a temporary div for PDF content
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '0';
  tempDiv.style.width = '210mm';
  tempDiv.style.backgroundColor = 'white';
  tempDiv.style.padding = '20px';
  tempDiv.style.fontFamily = 'Arial, sans-serif';

  // Calculate totals
  const calculateBrandTotal = (brand: string) => {
    return quotation.products.reduce((total, product) => {
      return total + (product.brandTotals[brand] || 0);
    }, 0);
  };

  const calculateAdditionalItemsTotal = () => {
    return quotation.additionalItems.reduce((total, item) => total + item.total, 0);
  };

  const calculateGrandTotal = (brand: string) => {
    return calculateBrandTotal(brand) + calculateAdditionalItemsTotal();
  };

  const getAdjustedRate = (brand: string, thickness: string) => {
    const baseRate = rates[brand]?.[thickness as keyof typeof rates[typeof brand]] || 0;
    const adjustment = brandAdjustments[brand] || 0;
    return baseRate * (1 + adjustment / 100);
  };

  // Build HTML content
  tempDiv.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto; background: white; padding: 20px;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #d97706; padding-bottom: 5px;">
        <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
          <div style="width: 120px; height: 85px; margin-right: 15px;">
            <img id="logo" src="" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
          <div style="text-align: left;">
            <h1 style="margin: 0; font-size: 40px; font-weight: bold; color: #92400e; letter-spacing: 2px;">BHAKTI SALES</h1>
            <p style="margin: 5px 0 0 0; color: #92400e; font-size: 20px;padding-bottom:40px">PLYWOOD | DECORATIVE DOORS | INTERIOR GALLERY</p>
          </div>
        </div>
        <div style="text-align: right; margin-top: 10px;">
          <p style="margin: 2px 0; color: #92400e; font-size: 14px; font-weight: bold;">+91 94283 02008/+91 9313977948</p>
          <p style="margin: 2px 0; color: #92400e; font-size: 14px;">www.bhaktisales.com</p>
        </div>
        <div style="border-top: 1px solid #d97706; margin: 15px 0; padding-top: 15px;">
          <p style="margin: 0; color: #92400e; font-size: 25px; line-height: 1.4;">
            Opp. Gita Mandir, Pratap Nagar Main Road, Vadodara - 4 
          </p>
        </div>
      </div>

      <!-- Customer & Quotation Info -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 25px;">
        <div style="flex: 1;">
          <h3 style="margin-top: 0; color: #1f2937; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Customer Details</h3>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Name:</strong> ${quotation.customer.name}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Mobile:</strong> +91 ${quotation.customer.mobile}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Address:</strong> ${quotation.customer.address}</p>
        </div>
        <div style="text-align: right;">
          <h3 style="margin-top: 0; color: #1f2937; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Quotation Info</h3>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Quotation No:</strong> #${quotation.quotationNo}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Date:</strong> ${new Date(quotation.createdAt).toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      <!-- Products Table -->
      ${quotation.products.length > 0 ? `
      <div style="margin-bottom: 25px;">
        <h3 style="color: #1f2937; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Product Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Thickness</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Size</th>
              <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">Qty</th>
              <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">Sq.Ft</th>
              ${quotation.selectedBrands.map(brand => {
                const details = brandDetails[brand] || { label: '', code: '' };
                return `
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">
                    <div>${brand}</div>
                    <div style="font-size: 10px; color: #6b7280;">${details.label}</div>
                    <div style="font-size: 10px; color: #6b7280;">${details.code}</div>
                  </th>
                `;
              }).join('')}
            </tr>
          </thead>
          <tbody>
            ${quotation.products.map(product => `
              <tr>
                <td style="border: 1px solid #d1d5db; padding: 8px;">${product.thickness}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${product.size}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${product.quantity}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${product.totalSqFt}</td>
                ${quotation.selectedBrands.map(brand => `
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; color: #059669; font-weight: bold;">₹${Math.round(product.brandTotals[brand] || 0)}</td>
                `).join('')}
              </tr>
            `).join('')}
            <tr style="background-color: #f9fafb; font-weight: bold;">
              <td colspan="4" style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">Product Totals:</td>
              ${quotation.selectedBrands.map(brand => `
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; color: #059669; font-weight: bold;">₹${Math.round(calculateBrandTotal(brand))}</td>
              `).join('')}
            </tr>
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- Additional Items and Total Breakdown on second page -->
      ${quotation.additionalItems.length > 0 ? `
      <div style="page-break-before: always; margin-bottom: 25px;">
        <div>
          <h3 style="color: #1f2937; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Additional Items</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Product Name</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Description</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">Qty</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">Rate</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${quotation.additionalItems.map(item => `
                <tr>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">${item.productName}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">${item.description}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${item.quantity}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">₹${item.rate}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; color: #059669; font-weight: bold;">₹${Math.round(item.total)}</td>
                </tr>
              `).join('')}
              <tr style="background-color: #f9fafb; font-weight: bold;">
                <td colspan="4" style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">Additional Items Total:</td>
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; color: #059669; font-weight: bold;">₹${Math.round(calculateAdditionalItemsTotal())}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="page-break-before: always;">
          <h3 style="color: #1f2937; font-size: 16px; margin-top: 95px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; padding-top:90px">Totals Breakdown:</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Brand Name</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">Brand Total</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">Additional</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">All Total</th>
              </tr>
            </thead>
            <tbody>
              ${quotation.selectedBrands.map(brand => `
                <tr>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">${brand}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">₹${Math.round(calculateBrandTotal(brand))}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">₹${Math.round(calculateAdditionalItemsTotal())}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-weight: bold;">₹${Math.round(calculateBrandTotal(brand) + calculateAdditionalItemsTotal())}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="page-break-before: always;">
          <h3 style="color: #1f2937; font-size: 16px; margin-top: 30px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Plywood Rates:</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">THICKNESS</th>
              ${quotation.selectedBrands.map(brand => {
                const details = brandDetails[brand] || { label: '', code: '' };
                return `
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">
                    <div>${brand}</div>
                    <div style="font-size: 10px; color: #6b7280;">${details.label}</div>
                    <div style="font-size: 10px; color: #6b7280;">${details.code}</div>
                  </th>
                `;
              }).join('')}
              </tr>
            </thead>
            <tbody>
              ${['19MM', '12MM', '9MM', '6MM'].map(thickness => `
                <tr>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">${thickness}</td>
                  ${quotation.selectedBrands.map(brand => `
                    <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">₹${Math.round(rates[brand]?.[thickness as keyof typeof rates[typeof brand]] || 0)}</td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}
  `;

  document.body.appendChild(tempDiv);

  try {
    // Load logo as base64
    let logoDataUrl = '';
    try {
      // Use public folder path for production safety
      const logoUrl = '/Bhakti_Sales_New_logo_without_background-removebg-preview.png';
      logoDataUrl = await loadImageAsBase64(logoUrl);
    } catch (err) {
      console.error('Failed to load logo:', err);
      // Fallback: skip logo if loading fails
    }

    // Set logo in HTML after it's loaded
    const logoImg = tempDiv.querySelector('#logo') as HTMLImageElement;
    if (logoImg && logoDataUrl) {
      logoImg.src = logoDataUrl;
    }

    // Generate PDF
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 800,
      height: tempDiv.scrollHeight
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Add additional pages if needed
    let heightLeft = pdfHeight;
    let position = 0;

    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      if (position < 0) break; // Avoid negative position
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }

    const fileName = `quotation-${quotation.customer.name.replace(/\s+/g, '')}-${quotation.quotationNo}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF. Please try again.');
  } finally {
    document.body.removeChild(tempDiv);
  }
};