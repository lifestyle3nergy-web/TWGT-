const { execSync } = require('child_process');

module.exports = function () {
  console.log('🔄 twgt update: updating dependencies...');

  try {
    execSync('npm update', { stdio: 'inherit' });
    console.log('📦 Dependencies updated.');

    execSync('npm audit fix', { stdio: 'inherit' });
    console.log('🔐 Security patches applied.');

    console.log('✅ twgt update complete.');
  } catch (err) {
    console.error('❌ Update failed:', err.message);
    process.exit(1);
  }
};
