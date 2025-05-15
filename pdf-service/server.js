const express = require('express');
const puppeteer = require('puppeteer');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
// Adjust the path to your InvoiceTemplate component
// This assumes pdf-service is at the root, next to src/
// esbuild-register should handle the .tsx extension and default export.
const InvoiceTemplateComponent = require('../src/components/InvoiceTemplate').default; 


const app = express();
const port = process.env.PDF_SERVICE_PORT || 3001;

app.use(express.json({ limit: '10mb' })); // Increase limit if invoiceData is large

app.post('/generate-pdf', async (req, res) => {
  const invoiceData = req.body;

  if (!invoiceData) {
    return res.status(400).send({ error: 'Invoice data is required' });
  }

  try {
    // Ensure InvoiceTemplateComponent is a function (the React component)
    if (typeof InvoiceTemplateComponent !== 'function') {
      console.error('InvoiceTemplateComponent is not a function. Type:', typeof InvoiceTemplateComponent, 'Value:', InvoiceTemplateComponent);
      throw new Error('InvoiceTemplateComponent is not a function. Check module import.');
    }

    // Test with an absolutely minimal component, no props from invoiceData initially
    const MinimalTestComponent = () => React.createElement('html', null, 
      React.createElement('body', null, 
        React.createElement('h1', null, "Minimal PDF Test")
      )
    );
    
    let htmlContent;
    let mainRenderError = null;

    try {
      console.log('[pdf-service] Attempting to render InvoiceTemplateComponent with data snippet:', JSON.stringify(invoiceData, null, 2).substring(0, 500) + "...");
      htmlContent = ReactDOMServer.renderToStaticMarkup(
        React.createElement(InvoiceTemplateComponent, invoiceData)
      );
      console.log('[pdf-service] InvoiceTemplateComponent rendered successfully.');
    } catch (renderError) {
      mainRenderError = renderError; // Store the error
      console.error('[pdf-service] Error rendering InvoiceTemplateComponent:', renderError);
      console.log('[pdf-service] Falling back to MinimalTestComponent due to error.');
      try {
        htmlContent = ReactDOMServer.renderToStaticMarkup(
          React.createElement(MinimalTestComponent) // No props passed to minimal component initially
        );
        console.log('[pdf-service] MinimalTestComponent rendered successfully.');
      } catch (minimalRenderError) {
        console.error('[pdf-service] Error rendering EVEN MinimalTestComponent:', minimalRenderError);
        // If even this fails, the problem is likely with ReactDOMServer or React setup in this env
        throw minimalRenderError; // Propagate this critical error
      }
    }

    // If htmlContent is still undefined here, it means MinimalTestComponent also failed silently or was skipped.
    if (!htmlContent) {
        throw new Error("Failed to render any HTML content for PDF.");
    }

    console.log('[pdf-service] HTML content generated, proceeding to Puppeteer.');
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Common for CI/server environments
        // '--font-render-hinting=none' // May help with font rendering issues on some systems
      ]
    });
    const page = await browser.newPage();

    // For Tailwind CSS and custom fonts, Puppeteer needs access to them.
    // 1. Ensure fonts (like NotoSansArabic-Regular.ttf) are accessible.
    //    The InvoiceTemplate's <style> block references 'Noto Sans Arabic'.
    //    Puppeteer will try to use system fonts or fonts accessible via @font-face in the HTML.
    // 2. For Tailwind, the HTML must include the CSS.
    //    - Easiest: Link a CDN version of Tailwind in InvoiceTemplate.tsx's <head>.
    //    - Or: Inject your compiled globals.css content here:
    //      const fs = require('fs').promises;
    //      const path = require('path');
    //      try {
    //        // Path to your Next.js app's compiled global CSS. Adjust if necessary.
    //        // This path is tricky as it depends on Next.js build output structure.
    //        // A more robust way is to have a dedicated CSS file for the invoice template.
    //        const cssFilePath = path.join(__dirname, '..', 'src', 'app', 'globals.css'); // Path to source CSS
    //        const globalCss = await fs.readFile(cssFilePath, 'utf-8');
    //        await page.addStyleTag({ content: globalCss });
    //      } catch (e) {
    //        console.warn("Could not load or inject global CSS for PDF:", e);
    //      }

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceData.orderDetails?.id || 'unknown'}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF in pdf-service:', error);
    res.status(500).send({ error: `Failed to generate PDF: ${error.message}` });
  }
});

app.listen(port, () => {
  console.log(`PDF generation service listening on port ${port}`);
});
