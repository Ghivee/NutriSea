const { execSync } = require('child_process');
try {
  let cwdStr = "d:\\Projekan\\NUTRISEA WEB & APP\\NutriSea APP";
  console.log("Modernizing schedule time input UI...");
  execSync('git add . && git commit -m "feat(admin): modernize medication schedule time input with dynamic fields and time picker"', { cwd: cwdStr, stdio: 'inherit' });
  
  console.log("Pushing final tweaks to origin main...");
  execSync('git push origin main', { cwd: cwdStr, stdio: 'inherit' });
  console.log("Pushed successfully.");
} catch (e) {
  console.log("Error:", e.message);
}
