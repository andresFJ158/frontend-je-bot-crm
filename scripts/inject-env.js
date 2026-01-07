// Script to inject environment variables into the HTML at runtime
// This allows configuring NEXT_PUBLIC_API_URL without rebuilding

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../.next/standalone/app.html');
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (apiUrl && fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  
  // Inject script to set window.__ENV__
  const script = `
    <script>
      window.__ENV__ = window.__ENV__ || {};
      window.__ENV__.NEXT_PUBLIC_API_URL = '${apiUrl}';
    </script>
  `;
  
  // Insert before closing head tag
  html = html.replace('</head>', script + '</head>');
  
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('✅ Injected NEXT_PUBLIC_API_URL:', apiUrl);
} else if (!apiUrl) {
  console.warn('⚠️ NEXT_PUBLIC_API_URL not set, using default');
}

