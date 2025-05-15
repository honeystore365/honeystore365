'use server';

import puppeteer from 'puppeteer';
import React from 'react';
import InvoiceTemplate, { InvoiceTemplateProps } from '@/components/InvoiceTemplate';
import { Buffer } from 'buffer';

const BROWSERLESS_API_TOKEN = process.env.BROWSERLESS_API_TOKEN;

// This function is intended to be called from a Node.js environment (e.g., an API route with Node.js runtime)
export async function generatePdfBuffer(
  invoiceData: InvoiceTemplateProps
): Promise<Buffer> {
  console.log('[generatePdfBuffer] Starting PDF generation...');
  // Dynamically import ReactDOMServer to prevent bundling issues
  const ReactDOMServer = (await import('react-dom/server')).default;

  const htmlContent = ReactDOMServer.renderToStaticMarkup(
    React.createElement(InvoiceTemplate, invoiceData)
  );

  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_API_TOKEN}`,
  });
  const page = await browser.newPage();

  // It's crucial that Tailwind CSS is available to this HTML.
  // If styles are missing in the PDF, this is where you'd inject CSS.
  // For example, by reading your compiled globals.css and using page.addStyleTag({ content: cssString })
  // Or ensure InvoiceTemplate links to a CDN or has critical styles inlined.
  const fs = require('fs').promises; // For reading local CSS file
  const path = require('path');
  try {
    const cssPath = path.join(process.cwd(), '.next', 'static', 'css'); // Path might vary based on build
    console.log('Attempting to read CSS from path:', cssPath); // Added logging
    // Find the main CSS file, this is an example, might need a more robust way
    const files = await fs.readdir(cssPath);
    console.log('Files found in CSS directory:', files); // Added logging
    const mainCssFile = files.find((f: string) => f.startsWith('main.') && f.endsWith('.css'));
    if (mainCssFile) {
      const fullCssPath = path.join(cssPath, mainCssFile); // Added variable for clarity
      console.log('Main CSS file found:', fullCssPath); // Added logging
      const globalCss = await fs.readFile(fullCssPath, 'utf-8'); // Used variable
      await page.addStyleTag({ content: globalCss });
      console.log('Global CSS successfully injected.'); // Added logging
    } else {
       console.warn("Global CSS file not found for PDF injection. Styles might be incomplete.");
    }
  } catch (cssError) {
    console.error("Error reading or injecting global CSS for PDF:", cssError); // Changed warn to error and added context
  }


  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  console.log('HTML content set. Generating PDF...'); // Added logging
  let pdfBuffer;
  try {
    pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    });
    console.log('PDF generated successfully.'); // Added logging
  } catch (pdfError) {
    console.error('Error generating PDF:', pdfError);
    throw pdfError; // Re-throw to be caught by the API route
  }
  console.log('PDF generated. Closing browser...'); // Added logging
  await browser.close();
  console.log('Browser closed. Returning PDF buffer.'); // Added logging
  console.log('[generatePdfBuffer] PDF generation complete.');
  return Buffer.from(pdfBuffer); // Ensure it's a Node.js Buffer
}
