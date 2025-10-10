// Simple script to test Vercel deployment
console.log('🚀 Deploying to Vercel...');

// Test the PDF export API after deployment
const testPDFAPI = async (vercelUrl) => {
  const testHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f0f0f0; }
        .content { background: white; padding: 20px; border-radius: 8px; }
        h1 { color: #333; }
        code { background: #e0e0e0; padding: 2px 4px; border-radius: 3px; }
      </style>
    </head>
    <body>
      <div class="content">
        <h1>PDF Export Test</h1>
        <p>This is a test of the Vercel PDF export functionality.</p>
        <p>It includes <strong>bold text</strong> and <em>italic text</em>.</p>
        <p>And some <code>inline code</code> as well.</p>
        
        <h2>Code Block Test</h2>
        <pre><code>function hello() {
  console.log("Hello, PDF!");
  return "success";
}</code></pre>
        
        <h2>Math Test</h2>
        <p>Here's some math: \\(E = mc^2\\)</p>
        
        <h2>Mermaid Test</h2>
        <div class="mermaid">
          graph TD
            A[Start] --> B[Process]
            B --> C[End]
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    console.log('🧪 Testing PDF API...');
    
    const response = await fetch(`${vercelUrl}/api/export/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        html: testHTML, 
        theme: 'Standard Light' 
      }),
    });

    if (response.ok) {
      console.log('✅ PDF export successful!');
      const blob = await response.blob();
      console.log(`📄 PDF size: ${blob.size} bytes`);
      
      // Download the PDF
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vercel-test.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    } else {
      console.error('❌ PDF export failed:', response.status, response.statusText);
      const error = await response.text();
      console.error('Error details:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    return false;
  }
};

// Instructions for deployment
console.log(`
📋 VERCEL DEPLOYMENT INSTRUCTIONS:

1. Login to Vercel:
   vercel login

2. Deploy to preview (development):
   vercel

3. Deploy to production:
   vercel --prod

4. Test the PDF API:
   - Open your deployed URL
   - Open browser console
   - Run: testPDFAPI('https://your-app.vercel.app')

5. The PDF API will be available at:
   https://your-app.vercel.app/api/export/pdf

🎯 Your serverless function is ready at: api/export/pdf.ts
`);

// Export the test function for use in browser console
if (typeof window !== 'undefined') {
  window.testPDFAPI = testPDFAPI;
}
