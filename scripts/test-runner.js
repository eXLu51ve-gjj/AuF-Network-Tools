/**
 * Comprehensive test runner for final checkpoint
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      unitTests: { passed: false, output: '' },
      typeCheck: { passed: false, output: '' },
      lint: { passed: false, output: '' },
      build: { passed: false, output: '' },
      themeConsistency: { passed: false, output: '' },
      responsiveLayout: { passed: false, output: '' },
    };
  }

  run(command, description) {
    console.log(`\n🔍 Running: ${description}...`);
    try {
      const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
      console.log(`✅ ${description} passed`);
      return { passed: true, output };
    } catch (error) {
      console.log(`❌ ${description} failed`);
      return { passed: false, output: error.stdout || error.message };
    }
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive test suite...\n');
    console.log('=' .repeat(60));

    // 1. Unit Tests
    this.results.unitTests = this.run('npm test -- --run', 'Unit Tests');

    // 2. TypeScript Type Check
    this.results.typeCheck = this.run('npx tsc --noEmit', 'TypeScript Type Check');

    // 3. ESLint
    this.results.lint = this.run('npx eslint src --ext .ts,.tsx', 'ESLint');

    // 4. Build Test
    this.results.build = this.run('npm run build', 'Production Build');

    // 5. Theme Consistency Check
    this.results.themeConsistency = this.checkThemeConsistency();

    // 6. Responsive Layout Check
    this.results.responsiveLayout = this.checkResponsiveLayout();

    // Generate Report
    this.generateReport();
  }

  checkThemeConsistency() {
    console.log('\n🔍 Checking theme consistency...');
    try {
      const themeFile = path.join(__dirname, '../src/renderer/contexts/ThemeContext.tsx');
      const content = fs.readFileSync(themeFile, 'utf-8');

      const checks = [
        { name: 'OLED Black Background', pattern: /#000000|#000/i },
        { name: 'Primary Color (Cyan)', pattern: /#00FFFF/i },
        { name: 'Secondary Color (Magenta)', pattern: /#FF00FF/i },
        { name: 'Accent Color (Yellow)', pattern: /#FFFF00/i },
      ];

      const results = checks.map((check) => ({
        ...check,
        found: check.pattern.test(content),
      }));

      const allPassed = results.every((r) => r.found);

      if (allPassed) {
        console.log('✅ Theme consistency check passed');
      } else {
        console.log('❌ Theme consistency check failed');
        results.filter((r) => !r.found).forEach((r) => {
          console.log(`   Missing: ${r.name}`);
        });
      }

      return {
        passed: allPassed,
        output: JSON.stringify(results, null, 2),
      };
    } catch (error) {
      console.log('❌ Theme consistency check failed');
      return { passed: false, output: error.message };
    }
  }

  checkResponsiveLayout() {
    console.log('\n🔍 Checking responsive layout...');
    try {
      const layoutFile = path.join(__dirname, '../src/renderer/components/Layout.tsx');
      const content = fs.readFileSync(layoutFile, 'utf-8');

      const checks = [
        { name: 'Flexbox', pattern: /display:\s*['"]?flex['"]?/i },
        { name: 'Grid', pattern: /display:\s*['"]?grid['"]?/i },
        { name: 'Media Queries', pattern: /@media/i },
        { name: 'Responsive Units', pattern: /\d+(%|vw|vh|rem|em)/i },
      ];

      const results = checks.map((check) => ({
        ...check,
        found: check.pattern.test(content),
      }));

      const allPassed = results.every((r) => r.found);

      if (allPassed) {
        console.log('✅ Responsive layout check passed');
      } else {
        console.log('❌ Responsive layout check failed');
        results.filter((r) => !r.found).forEach((r) => {
          console.log(`   Missing: ${r.name}`);
        });
      }

      return {
        passed: allPassed,
        output: JSON.stringify(results, null, 2),
      };
    } catch (error) {
      console.log('❌ Responsive layout check failed');
      return { passed: false, output: error.message };
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    const categories = [
      { name: 'Unit Tests', key: 'unitTests' },
      { name: 'TypeScript Type Check', key: 'typeCheck' },
      { name: 'ESLint', key: 'lint' },
      { name: 'Production Build', key: 'build' },
      { name: 'Theme Consistency', key: 'themeConsistency' },
      { name: 'Responsive Layout', key: 'responsiveLayout' },
    ];

    let passedCount = 0;
    let totalCount = categories.length;

    categories.forEach((category) => {
      const result = this.results[category.key];
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} - ${category.name}`);
      if (result.passed) passedCount++;
    });

    console.log('='.repeat(60));
    console.log(`Total: ${passedCount}/${totalCount} checks passed`);
    console.log('='.repeat(60));

    // Save detailed report
    const reportPath = path.join(__dirname, '../test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    // Exit with appropriate code
    const allPassed = passedCount === totalCount;
    if (allPassed) {
      console.log('\n🎉 All checks passed! Application is ready for deployment.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some checks failed. Please review and fix the issues.');
      process.exit(1);
    }
  }
}

// Run tests
const runner = new TestRunner();
runner.runAllTests().catch((error) => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
