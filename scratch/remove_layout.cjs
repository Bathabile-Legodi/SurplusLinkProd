const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '../src/routes');
const files = fs.readdirSync(routesDir).filter(f => (f.startsWith('donor.') || f.startsWith('ngo.')) && f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Remove imports
  content = content.replace(/import\s+\{\s*DashboardLayout\s*\}\s*from\s+['"]@\/components\/DashboardLayout['"];?\n?/g, '');
  content = content.replace(/import\s+\{\s*type\s+SidebarNavItem\s*\}\s*from\s+['"]@\/components\/AppSidebar['"];?\n?/g, '');
  
  // Remove nav definitions
  content = content.replace(/const\s+(ngo|donor)SidebarNav\s*:\s*SidebarNavItem\[\]\s*=\s*\[[\s\S]*?\];?\n?/g, '');
  
  // Replace <DashboardLayout nav={...}> with <>
  content = content.replace(/<DashboardLayout\s+nav=\{[^}]+\}>/g, '<>');
  content = content.replace(/<\/DashboardLayout>/g, '</>');
  
  // Remove requireRole from beforeLoad
  content = content.replace(/import\s+\{\s*requireRole\s*\}\s*from\s+['"]@\/lib\/auth-guard['"];?\n?/g, '');
  content = content.replace(/beforeLoad:\s*\(\)\s*=>\s*requireRole\(['"][^'"]+['"]\),?\n?/g, '');

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Updated ${file}`);
}
