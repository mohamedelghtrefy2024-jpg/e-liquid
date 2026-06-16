// Lightweight smoke test: loads index.html + js/App.js (and its imports) in
// jsdom, mocks the CDN globals (Chart/jsPDF/QRCode/Dexie), and verifies the
// React app mounts into #root without throwing.
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

(async () => {
  const dom = new JSDOM(`<!doctype html><html><head><title></title></head><body><div id="root"></div></body></html>`, {
    runScripts: 'outside-only',
    url: 'http://localhost/EPP/index.html',
  });
  const { window } = dom;
  global.window = window;
  global.document = window.document;
  global.localStorage = window.localStorage;
  global.navigator = window.navigator;
  global.MutationObserver = window.MutationObserver || class { observe(){} disconnect(){} };
  global.Notification = undefined; // not available in jsdom
  global.window.Chart = function(){ return { destroy(){} }; };
  global.window.jspdf = { jsPDF: function(){ return {
    setFillColor(){},setTextColor(){},setFontSize(){},setFont(){},text(){},setLineWidth(){},setDrawColor(){},line(){},rect(){},roundedRect(){},addPage(){},save(){}
  }; } };
  global.window.QRCode = function(){};

  const appPath = path.join(__dirname, '..', 'js', 'App.js');
  await import('file://' + appPath);

  // Give React a tick to render
  await new Promise(r => setTimeout(r, 300));

  const root = document.getElementById('root');
  console.log('root children:', root.children.length);
  console.log('document.title:', document.title);
  console.log('SUCCESS: app mounted without throwing');
})().catch(e => {
  console.error('FAILURE:', e);
  process.exit(1);
});
