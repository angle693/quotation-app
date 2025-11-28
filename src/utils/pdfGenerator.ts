import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Quotation, RateData } from '../types';

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
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};

const renderPageToCanvas = async (html: string, logoDataUrl?: string): Promise<HTMLCanvasElement> => {
  const div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.left = '-9999px';
  div.style.top = '0';
  div.style.width = '210mm';
  div.style.padding = '15px';
  div.style.fontFamily = 'Arial, sans-serif';
  div.style.fontSize = '11px';
  div.innerHTML = html;

  if (logoDataUrl && div.querySelector('#logo')) {
    (div.querySelector('#logo') as HTMLImageElement).src = logoDataUrl;
  }

  document.body.appendChild(div);
  const canvas = await html2canvas(div, {
    scale: 1.3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false
  });
  document.body.removeChild(div);
  return canvas;
};

export const generatePDF = async (
  quotation: Quotation,
  rates: RateData,
  brandAdjustments: { [brand: string]: number }
) => {
  const brandDetails: { [brand: string]: { label: string; code: string } } = {
    'Duraflame Semiwaterproof 303': { label: 'semiwaterproof', code: '303' },
    'Durbi Semiwaterproof 303': { label: 'semiwaterproof', code: '303' },
    'Nocte Semiwaterproof 303': { label: 'semiwaterproof', code: '303' },
    'Nocte Waterproof 710': { label: 'waterproof', code: '710' }
  };

  const calculateBrandTotal = (brand: string) => {
    return quotation.products.reduce((total, product) => total + (product.brandTotals[brand] || 0), 0);
  };
  const calculateAdditionalItemsTotal = () => {
    return quotation.additionalItems.reduce((total, item) => total + item.total, 0);
  };

  // --- PAGE 1 CONTENT ---
  const page1Html = `
    <div style="max-width: 800px; margin: 0 auto;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #d97706; padding-bottom: 5px;">
        <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
          <div style="width: 110px; height: 75px; margin-right: 15px;">
            <img id="logo" src="" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
          <div style="text-align: left;">
            <h1 style="margin: 0; font-size: 36px; font-weight: bold; color: #92400e; letter-spacing: 1.5px;">BHAKTI SALES</h1>
            <p style="margin: 5px 0 0 0; color: #92400e; font-size: 18px; padding-bottom: 35px;">PLYWOOD | DECORATIVE DOORS | INTERIOR GALLERY</p>
          </div>
        </div>
        <div style="text-align: right; margin-top: 10px;">
          <p style="margin: 2px 0; color: #92400e; font-size: 13px; font-weight: bold;">+91 94283 02008 / +91 9313977948</p>
          <p style="margin: 2px 0; color: #92400e; font-size: 13px;">www.bhaktisales.com</p>
        </div>
        <div style="border-top: 1px solid #d97706; margin: 15px 0; padding-top: 15px;">
          <p style="margin: 0; color: #92400e; font-size: 22px; line-height: 1.4;">
            Opp. Gita Mandir, Pratap Nagar Main Road, Vadodara - 4 
          </p>
        </div>
      </div>

      <!-- Customer Info -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div style="flex: 1;">
          <h3 style="margin-top: 0; color: #1f2937; font-size: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Customer Details</h3>
          <p style="margin: 6px 0; font-size: 13px;"><strong>Name:</strong> ${quotation.customer.name}</p>
          <p style="margin: 6px 0; font-size: 13px;"><strong>Mobile:</strong> +91 ${quotation.customer.mobile}</p>
          <p style="margin: 6px 0; font-size: 13px;"><strong>Address:</strong> ${quotation.customer.address}</p>
        </div>
        <div style="text-align: right;">
          <h3 style="margin-top: 0; color: #1f2937; font-size: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Quotation Info</h3>
          <p style="margin: 6px 0; font-size: 13px;"><strong>Quotation No:</strong> #${quotation.quotationNo}</p>
          <p style="margin: 6px 0; font-size: 13px;"><strong>Date:</strong> ${new Date(quotation.createdAt).toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      <!-- Products -->
      ${quotation.products.length > 0 ? `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #1f2937; font-size: 15px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Product Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="border: 1px solid #d1d5db; padding: 6px; text-align: left;">Thickness</th>
              <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">Size</th>
              <th style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">Qty</th>
              <th style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">Sq.Ft</th>
              ${quotation.selectedBrands.map(brand => {
                const details = brandDetails[brand] || { label: '', code: '' };
                return `
                  <th style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">
                    <div>${brand}</div>
                    <div style="font-size: 9px; color: #6b7280;">${details.label}</div>
                    <div style="font-size: 9px; color: #6b7280;">${details.code}</div>
                  </th>
                `;
              }).join('')}
            </tr>
          </thead>
          <tbody>
            ${quotation.products.map(product => `
              <tr>
                <td style="border: 1px solid #d1d5db; padding: 6px;">${product.thickness}</td>
                <td style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">${product.size}</td>
                <td style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">${product.quantity}</td>
                <td style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">${product.totalSqFt}</td>
                ${quotation.selectedBrands.map(brand => `
                  <td style="border: 1px solid #d1d5db; padding: 6px; text-align: center; color: #059669; font-weight: bold;">₹${Math.round(product.brandTotals[brand] || 0)}</td>
                `).join('')}
              </tr>
            `).join('')}
            <tr style="background-color: #f9fafb; font-weight: bold;">
              <td colspan="4" style="border: 1px solid #d1d5db; padding: 6px; text-align: right;">Product Totals:</td>
              ${quotation.selectedBrands.map(brand => `
                <td style="border: 1px solid #d1d5db; padding: 6px; text-align: center; color: #059669; font-weight: bold;">₹${Math.round(calculateBrandTotal(brand))}</td>
              `).join('')}
            </tr>
          </tbody>
        </table>
      </div>
      ` : ''}
    </div>
  `;

  // --- PAGE 2 CONTENT (only if additional items exist) ---
  let page2Html = '';
  if (quotation.additionalItems.length > 0) {
    page2Html = `
      <div style="max-width: 800px; margin: 0 auto; padding-top: 20px;">
        <h3 style="color: #1f2937; font-size: 15px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Additional Items</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="border: 1px solid #d1d5db; padding: 6px; text-align: left;">Product Name</th>
              <th style="border: 1px solid #d1d5db; padding: 6px; text-align: left;">Description</th>
              <th style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">Qty</th>
              <th style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">Rate</th>
              <th style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${quotation.additionalItems.map(item => `
              <tr>
                <td style="border: 1px solid #d1d5db; padding: 6px;">${item.productName}</td>
                <td style="border: 1px solid #d1d5db; padding: 6px;">${item.description}</td>
                <td style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">${item.quantity}</td>
                <td style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">₹${item.rate}</td>
                <td style="border: 1px solid #d1d5db; padding: 6px; text-align: center; color: #059669; font-weight: bold;">₹${Math.round(item.total)}</td>
              </tr>
            `).join('')}
            <tr style="background-color: #f9fafb; font-weight: bold;">
              <td colspan="4" style="border: 1px solid #d1d5db; padding: 6px; text-align: right;">Additional Items Total:</td>
              <td style="border: 1px solid #d1d5db; padding: 6px; text-align: center; color: #059669; font-weight: bold;">₹${Math.round(calculateAdditionalItemsTotal())}</td>
            </tr>
          </tbody>
        </table>

        <h3 style="color: #1f2937; font-size: 15px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Totals Breakdown:</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="border: 1px solid #d1d5db; padding: 6px; text-align: left;">Brand Name</th>
              <th style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">Brand Total</th>
              <th style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">Additional</th>
              <th style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">All Total</th>
            </tr>
          </thead>
          <tbody>
            ${quotation.selectedBrands.map(brand => `
              <tr>
                <td style="border: 1px solid #d1d5db; padding: 6px;">${brand}</td>
                <td style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">₹${Math.round(calculateBrandTotal(brand))}</td>
                <td style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">₹${Math.round(calculateAdditionalItemsTotal())}</td>
                <td style="border: 1px solid #d1d5db; padding: 6px; text-align: center; font-weight: bold;">₹${Math.round(calculateBrandTotal(brand) + calculateAdditionalItemsTotal())}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3 style="color: #1f2937; font-size: 15px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Plywood Rates:</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="border: 1px solid #d1d5db; padding: 6px; text-align: left;">THICKNESS</th>
              ${quotation.selectedBrands.map(brand => {
                const details = brandDetails[brand] || { label: '', code: '' };
                return `
                  <th style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">
                    <div>${brand}</div>
                    <div style="font-size: 9px; color: #6b7280;">${details.label}</div>
                    <div style="font-size: 9px; color: #6b7280;">${details.code}</div>
                  </th>
                `;
              }).join('')}
            </tr>
          </thead>
          <tbody>
            ${['19MM', '12MM', '9MM', '6MM'].map(thickness => `
              <tr>
                <td style="border: 1px solid #d1d5db; padding: 6px;">${thickness}</td>
                ${quotation.selectedBrands.map(brand => `
                  <td style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">₹${Math.round(rates[brand]?.[thickness as keyof typeof rates[typeof brand]] || 0)}</td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  try {
    // Load logo once
    let logoDataUrl = '';
    try {
      logoDataUrl = await loadImageAsBase64('/Bhakti_Sales_New_logo_without_background-removebg-preview.jpg');
    } catch (err) {
      console.error('Failed to load logo:', err);
    }

    // Render pages
    const canvas1 = await renderPageToCanvas(page1Html, logoDataUrl);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height1 = (canvas1.height * width) / canvas1.width;
    pdf.addImage(canvas1.toDataURL('image/jpeg', 0.75), 'JPEG', 0, 0, width, height1);

    if (page2Html) {
      const canvas2 = await renderPageToCanvas(page2Html, logoDataUrl);
      const height2 = (canvas2.height * width) / canvas2.width;
      pdf.addPage();
      pdf.addImage(canvas2.toDataURL('image/jpeg', 0.75), 'JPEG', 0, 0, width, height2);
    }

    pdf.save(`quotation-${quotation.customer.name.replace(/\s+/g, '')}-${quotation.quotationNo}.pdf`);
  } catch (error) {
    console.error('PDF generation error:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};