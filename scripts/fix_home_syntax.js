const fs = require('fs');
const path = require('path');

const homePath = path.join(__dirname, '../app/home/page.tsx');
let homeContent = fs.readFileSync(homePath, 'utf8');

// Replace {t.something} with {t("something")}
homeContent = homeContent.replace(/\{t\.([a-zA-Z0-9_]+)\}/g, "{t(\"$1\")}");
// Replace {t.something.replace(...)} with {t("something").replace(...)}
homeContent = homeContent.replace(/\{t\.([a-zA-Z0-9_]+)\.replace/g, "{t(\"$1\").replace");

fs.writeFileSync(homePath, homeContent, 'utf8');
console.log('Fixed syntax in app/home/page.tsx');
