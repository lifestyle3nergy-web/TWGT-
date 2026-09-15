const { execSync } = require('child_process');

module.exports = function (opts) {
  const version = opts.version;

  if (!version) {
    console.error('❌ twgt release: --version is required (e.g. v1.2.3)');
    process.exit(1);
  }

  console.log(`🔍 twgt release: validating release ${version}...`);
  execSync('node scripts/check-release.js', { stdio: 'inherit' });

  console.log(`🏷 twgt release: creating tag ${version}...`);
  execSync(`git tag ${version}`, { stdio: 'inherit' });
  execSync(`git push origin ${version}`, { stdio: 'inherit' });

  console.log('🚀 twgt release: tag pushed — GitHub Actions will publish the release.');
};
