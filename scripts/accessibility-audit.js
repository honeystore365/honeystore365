#!/usr/bin/env node

/**
 * Accessibility Audit Script
 * Comprehensive WCAG 2.1 AA compliance checker
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class AccessibilityAuditor {
  constructor() {
    this.results = {
      axe: {},
      lighthouse: {},
      manual: {},
      summary: {},
      timestamp: new Date().toISOString(),
    };

    this.testUrls = [
      'http://localhost:3000',
      'http://localhost:3000/products',
      'http://localhost:3000/cart',
      'http://localhost:3000/profile',
      'http://localhost:3000/auth/login',
    ];

    this.wcagLevels = ['wcag2a', 'wcag2aa', 'wcag21aa'];
  }

  async runAudit() {
    console.log('♿ Starting Accessibility Audit...\n');

    try {
      // Ensure reports directory exists
      if (!fs.existsSync('./audit-reports')) {
        fs.mkdirSync('./audit-reports', { recursive: true });
      }

      // 1. Build and start application
      await this.buildAndStart();

      // 2. Run axe-core tests
      await this.runAxeTests();

      // 3. Run Lighthouse accessibility audit
      await this.runLighthouseAccessibility();

      // 4. Perform manual checks
      await this.performManualChecks();

      // 5. Generate comprehensive report
      await this.generateReport();

      console.log('✅ Accessibility audit completed!');
    } catch (error) {
      console.error('❌ Accessibility audit failed:', error.message);
      process.exit(1);
    }
  }

  async buildAndStart() {
    console.log('🏗️ Building application...');
    execSync('npm run build', { stdio: 'inherit' });

    console.log('🚀 Starting server...');
    this.serverProcess = spawn('npm', ['start'], {
      stdio: 'pipe',
      detached: false,
    });

    // Wait for server to be ready
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 30000);

      this.serverProcess.stdout.on('data', data => {
        if (data.toString().includes('Ready')) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    console.log('✅ Server ready\n');
  }

  async runAxeTests() {
    console.log('🔍 Running axe-core accessibility tests...');

    for (const url of this.testUrls) {
      const pageName = url.split('/').pop() || 'home';
      console.log(`  Testing: ${url}`);

      try {
        // Run axe-core with comprehensive rules
        const outputFile = `./audit-reports/axe-${pageName}.json`;
        const command = `npx axe ${url} --tags ${this.wcagLevels.join(',')} --reporter json --output ${outputFile}`;

        execSync(command, { stdio: 'pipe' });

        const results = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

        this.results.axe[url] = {
          violations: results.violations,
          passes: results.passes,
          incomplete: results.incomplete,
          inapplicable: results.inapplicable,
          summary: {
            violationCount: results.violations.length,
            passCount: results.passes.length,
            incompleteCount: results.incomplete.length,
            score: this.calculateAxeScore(results),
          },
        };

        console.log(`    Violations: ${results.violations.length}`);
        console.log(`    Passes: ${results.passes.length}`);
        console.log(`    Score: ${this.calculateAxeScore(results)}/100`);

        // Log critical violations
        const criticalViolations = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');

        if (criticalViolations.length > 0) {
          console.log(`    ⚠️ Critical/Serious violations: ${criticalViolations.length}`);
          criticalViolations.slice(0, 3).forEach(v => {
            console.log(`      - ${v.id}: ${v.description}`);
          });
        }
      } catch (error) {
        console.error(`    Failed to test ${url}:`, error.message);
        this.results.axe[url] = { error: error.message };
      }
    }

    console.log('✅ axe-core tests completed\n');
  }

  async runLighthouseAccessibility() {
    console.log('🔍 Running Lighthouse accessibility audit...');

    for (const url of this.testUrls) {
      const pageName = url.split('/').pop() || 'home';
      console.log(`  Auditing: ${url}`);

      try {
        const outputFile = `./audit-reports/lighthouse-a11y-${pageName}.json`;
        const command = `npx lighthouse ${url} --only-categories=accessibility --output=json --output-path=${outputFile} --chrome-flags="--headless --no-sandbox" --quiet`;

        execSync(command, { stdio: 'pipe' });

        const report = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        const accessibilityScore = Math.round(report.lhr.categories.accessibility.score * 100);

        // Extract accessibility audits
        const accessibilityAudits = {};
        for (const [auditId, audit] of Object.entries(report.lhr.audits)) {
          if (
            (audit.scoreDisplayMode && auditId.includes('color-contrast')) ||
            auditId.includes('aria') ||
            auditId.includes('label') ||
            auditId.includes('heading') ||
            auditId.includes('landmark')
          ) {
            accessibilityAudits[auditId] = {
              score: audit.score,
              displayValue: audit.displayValue,
              description: audit.description,
              title: audit.title,
            };
          }
        }

        this.results.lighthouse[url] = {
          score: accessibilityScore,
          audits: accessibilityAudits,
        };

        console.log(`    Accessibility Score: ${accessibilityScore}/100`);
      } catch (error) {
        console.error(`    Failed to audit ${url}:`, error.message);
        this.results.lighthouse[url] = { error: error.message };
      }
    }

    console.log('✅ Lighthouse accessibility audit completed\n');
  }

  async performManualChecks() {
    console.log('🔍 Performing manual accessibility checks...');

    // Check for common accessibility patterns in the codebase
    const manualChecks = {
      semanticHTML: await this.checkSemanticHTML(),
      ariaLabels: await this.checkAriaLabels(),
      keyboardNavigation: await this.checkKeyboardNavigation(),
      colorContrast: await this.checkColorContrast(),
      focusManagement: await this.checkFocusManagement(),
      imageAltText: await this.checkImageAltText(),
      formLabels: await this.checkFormLabels(),
      headingStructure: await this.checkHeadingStructure(),
    };

    this.results.manual = manualChecks;

    // Log results
    for (const [check, result] of Object.entries(manualChecks)) {
      const status = result.passed ? '✅' : '❌';
      console.log(`  ${check}: ${status} (${result.issues.length} issues)`);

      if (result.issues.length > 0) {
        result.issues.slice(0, 3).forEach(issue => {
          console.log(`    - ${issue}`);
        });
      }
    }

    console.log('✅ Manual checks completed\n');
  }

  async checkSemanticHTML() {
    const issues = [];
    const srcFiles = this.getSourceFiles();

    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for div soup (too many nested divs)
      const divMatches = content.match(/<div[^>]*>/g) || [];
      if (divMatches.length > 10) {
        issues.push(`${file}: Excessive div usage (${divMatches.length} divs)`);
      }

      // Check for missing semantic elements
      const hasMain = content.includes('<main') || content.includes('role="main"');
      const hasNav = content.includes('<nav') || content.includes('role="navigation"');
      const hasHeader = content.includes('<header') || content.includes('role="banner"');

      if (content.includes('return') && !hasMain && file.includes('page.')) {
        issues.push(`${file}: Missing main element`);
      }
    }

    return {
      passed: issues.length === 0,
      issues,
      description: 'Checks for proper semantic HTML structure',
    };
  }

  async checkAriaLabels() {
    const issues = [];
    const srcFiles = this.getSourceFiles();

    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for buttons without accessible names
      const buttonMatches = content.match(/<button[^>]*>/g) || [];
      for (const button of buttonMatches) {
        if (!button.includes('aria-label') && !button.includes('aria-labelledby')) {
          // Check if button has text content (simplified check)
          if (button.includes('/>') || button.includes('></button>')) {
            issues.push(`${file}: Button without accessible name`);
          }
        }
      }

      // Check for images without alt text
      const imgMatches = content.match(/<img[^>]*>/g) || [];
      for (const img of imgMatches) {
        if (!img.includes('alt=')) {
          issues.push(`${file}: Image without alt text`);
        }
      }

      // Check for form inputs without labels
      const inputMatches = content.match(/<input[^>]*>/g) || [];
      for (const input of inputMatches) {
        if (!input.includes('aria-label') && !input.includes('aria-labelledby')) {
          issues.push(`${file}: Input without accessible label`);
        }
      }
    }

    return {
      passed: issues.length === 0,
      issues,
      description: 'Checks for proper ARIA labels and accessible names',
    };
  }

  async checkKeyboardNavigation() {
    const issues = [];
    const srcFiles = this.getSourceFiles();

    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for onClick handlers without keyboard support
      const onClickMatches = content.match(/onClick={[^}]*}/g) || [];
      for (const onClick of onClickMatches) {
        const context = this.getContextAroundMatch(content, onClick);
        if (!context.includes('onKeyDown') && !context.includes('onKeyPress')) {
          issues.push(`${file}: onClick without keyboard support`);
        }
      }

      // Check for custom interactive elements without proper roles
      const customInteractive = content.match(/<div[^>]*onClick/g) || [];
      for (const element of customInteractive) {
        if (!element.includes('role=') && !element.includes('tabIndex')) {
          issues.push(`${file}: Custom interactive element without proper accessibility`);
        }
      }
    }

    return {
      passed: issues.length === 0,
      issues,
      description: 'Checks for proper keyboard navigation support',
    };
  }

  async checkColorContrast() {
    const issues = [];
    const cssFiles = this.getCSSFiles();

    for (const file of cssFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for potential low contrast combinations (simplified)
      const colorMatches = content.match(/color:\s*#[a-fA-F0-9]{6}/g) || [];
      const backgroundMatches = content.match(/background-color:\s*#[a-fA-F0-9]{6}/g) || [];

      // This is a simplified check - in practice, you'd want to use a proper contrast checker
      if (colorMatches.length > 0 && backgroundMatches.length > 0) {
        issues.push(`${file}: Manual color contrast verification needed`);
      }
    }

    return {
      passed: issues.length === 0,
      issues,
      description: 'Checks for potential color contrast issues',
    };
  }

  async checkFocusManagement() {
    const issues = [];
    const srcFiles = this.getSourceFiles();

    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for focus management in modals/dialogs
      if (content.includes('Dialog') || content.includes('Modal')) {
        if (!content.includes('autoFocus') && !content.includes('focus()')) {
          issues.push(`${file}: Modal/Dialog without focus management`);
        }
      }

      // Check for skip links
      if (file.includes('layout') || file.includes('header')) {
        if (!content.includes('skip') && !content.includes('Skip')) {
          issues.push(`${file}: Missing skip navigation links`);
        }
      }
    }

    return {
      passed: issues.length === 0,
      issues,
      description: 'Checks for proper focus management',
    };
  }

  async checkImageAltText() {
    const issues = [];
    const srcFiles = this.getSourceFiles();

    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Check Next.js Image components
      const nextImageMatches = content.match(/<Image[^>]*>/g) || [];
      for (const image of nextImageMatches) {
        if (!image.includes('alt=')) {
          issues.push(`${file}: Next.js Image without alt text`);
        } else {
          // Check for empty or generic alt text
          const altMatch = image.match(/alt="([^"]*)"/);
          if (altMatch && (altMatch[1] === '' || altMatch[1] === 'image')) {
            issues.push(`${file}: Image with empty or generic alt text`);
          }
        }
      }
    }

    return {
      passed: issues.length === 0,
      issues,
      description: 'Checks for proper image alt text',
    };
  }

  async checkFormLabels() {
    const issues = [];
    const srcFiles = this.getSourceFiles();

    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for form inputs with proper labels
      const inputMatches = content.match(/<input[^>]*>/g) || [];
      for (const input of inputMatches) {
        if (input.includes('type="text"') || input.includes('type="email"') || input.includes('type="password"')) {
          if (!input.includes('aria-label') && !input.includes('id=')) {
            issues.push(`${file}: Form input without proper labeling`);
          }
        }
      }

      // Check for fieldsets in complex forms
      const formMatches = content.match(/<form[^>]*>/g) || [];
      if (formMatches.length > 0 && !content.includes('<fieldset')) {
        const inputCount = (content.match(/<input/g) || []).length;
        if (inputCount > 3) {
          issues.push(`${file}: Complex form without fieldset grouping`);
        }
      }
    }

    return {
      passed: issues.length === 0,
      issues,
      description: 'Checks for proper form labeling and structure',
    };
  }

  async checkHeadingStructure() {
    const issues = [];
    const srcFiles = this.getSourceFiles();

    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Extract heading levels
      const headings = [];
      for (let i = 1; i <= 6; i++) {
        const matches = content.match(new RegExp(`<h${i}[^>]*>`, 'g')) || [];
        matches.forEach(() => headings.push(i));
      }

      // Check heading hierarchy
      if (headings.length > 1) {
        for (let i = 1; i < headings.length; i++) {
          const current = headings[i];
          const previous = headings[i - 1];

          if (current > previous + 1) {
            issues.push(`${file}: Heading hierarchy skip (h${previous} to h${current})`);
          }
        }
      }

      // Check for missing h1
      if (file.includes('page.') && !content.includes('<h1')) {
        issues.push(`${file}: Page missing h1 heading`);
      }
    }

    return {
      passed: issues.length === 0,
      issues,
      description: 'Checks for proper heading structure and hierarchy',
    };
  }

  getSourceFiles() {
    const files = [];
    const srcDir = './src';

    const walkDir = dir => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (item.endsWith('.tsx') || item.endsWith('.jsx')) {
          files.push(fullPath);
        }
      }
    };

    if (fs.existsSync(srcDir)) {
      walkDir(srcDir);
    }

    return files;
  }

  getCSSFiles() {
    const files = [];
    const dirs = ['./src', './styles'];

    for (const dir of dirs) {
      if (fs.existsSync(dir)) {
        const walkDir = currentDir => {
          const items = fs.readdirSync(currentDir);
          for (const item of items) {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
              walkDir(fullPath);
            } else if (item.endsWith('.css') || item.endsWith('.scss')) {
              files.push(fullPath);
            }
          }
        };
        walkDir(dir);
      }
    }

    return files;
  }

  getContextAroundMatch(content, match) {
    const index = content.indexOf(match);
    const start = Math.max(0, index - 200);
    const end = Math.min(content.length, index + match.length + 200);
    return content.substring(start, end);
  }

  calculateAxeScore(results) {
    const total = results.violations.length + results.passes.length;
    if (total === 0) return 100;
    return Math.round((results.passes.length / total) * 100);
  }

  async generateReport() {
    console.log('📄 Generating accessibility report...');

    // Calculate overall summary
    const summary = this.calculateOverallSummary();
    this.results.summary = summary;

    // Save JSON report
    fs.writeFileSync('./audit-reports/accessibility-audit.json', JSON.stringify(this.results, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    fs.writeFileSync('./audit-reports/accessibility-audit.html', htmlReport);

    // Generate remediation guide
    const remediationGuide = this.generateRemediationGuide();
    fs.writeFileSync('./audit-reports/accessibility-remediation.md', remediationGuide);

    console.log('✅ Reports generated:');
    console.log('  - ./audit-reports/accessibility-audit.json');
    console.log('  - ./audit-reports/accessibility-audit.html');
    console.log('  - ./audit-reports/accessibility-remediation.md');

    // Cleanup
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
  }

  calculateOverallSummary() {
    let totalViolations = 0;
    let totalPasses = 0;
    let criticalIssues = 0;
    const issuesByCategory = {};

    // Aggregate axe results
    for (const [url, results] of Object.entries(this.results.axe)) {
      if (results.violations) {
        totalViolations += results.violations.length;

        results.violations.forEach(violation => {
          if (violation.impact === 'critical' || violation.impact === 'serious') {
            criticalIssues++;
          }

          const category = violation.tags[0] || 'other';
          issuesByCategory[category] = (issuesByCategory[category] || 0) + 1;
        });
      }

      if (results.passes) {
        totalPasses += results.passes.length;
      }
    }

    // Aggregate manual check results
    let manualIssues = 0;
    for (const [check, result] of Object.entries(this.results.manual)) {
      manualIssues += result.issues.length;
    }

    const overallScore =
      totalPasses + totalViolations > 0 ? Math.round((totalPasses / (totalPasses + totalViolations)) * 100) : 100;

    return {
      overallScore,
      totalViolations,
      totalPasses,
      criticalIssues,
      manualIssues,
      issuesByCategory,
      wcagCompliance: this.assessWCAGCompliance(),
      recommendations: this.generateRecommendations(),
    };
  }

  assessWCAGCompliance() {
    const compliance = {
      'WCAG 2.1 A': 'unknown',
      'WCAG 2.1 AA': 'unknown',
    };

    // Simple compliance assessment based on violation count
    const totalViolations = this.results.summary?.totalViolations || 0;
    const criticalIssues = this.results.summary?.criticalIssues || 0;

    if (totalViolations === 0) {
      compliance['WCAG 2.1 A'] = 'compliant';
      compliance['WCAG 2.1 AA'] = 'compliant';
    } else if (criticalIssues === 0) {
      compliance['WCAG 2.1 A'] = 'mostly-compliant';
      compliance['WCAG 2.1 AA'] = 'needs-review';
    } else {
      compliance['WCAG 2.1 A'] = 'non-compliant';
      compliance['WCAG 2.1 AA'] = 'non-compliant';
    }

    return compliance;
  }

  generateRecommendations() {
    const recommendations = [];

    // Based on axe results
    const commonViolations = {};
    for (const [url, results] of Object.entries(this.results.axe)) {
      if (results.violations) {
        results.violations.forEach(violation => {
          commonViolations[violation.id] = (commonViolations[violation.id] || 0) + 1;
        });
      }
    }

    // Top 5 most common violations
    const topViolations = Object.entries(commonViolations)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    topViolations.forEach(([violationId, count]) => {
      recommendations.push({
        priority: 'High',
        category: 'Accessibility',
        title: `Fix ${violationId} violations`,
        description: `Found ${count} instances across pages`,
        impact: 'Improves accessibility for users with disabilities',
      });
    });

    // Based on manual checks
    for (const [check, result] of Object.entries(this.results.manual)) {
      if (!result.passed && result.issues.length > 0) {
        recommendations.push({
          priority: 'Medium',
          category: 'Code Quality',
          title: `Improve ${check}`,
          description: `${result.issues.length} issues found`,
          impact: result.description,
        });
      }
    }

    return recommendations;
  }

  generateHTMLReport() {
    const summary = this.results.summary;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Audit Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2, h3 { color: #333; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; padding: 10px 15px; background: #e9ecef; border-radius: 4px; }
        .good { background: #d4edda; color: #155724; }
        .warning { background: #fff3cd; color: #856404; }
        .error { background: #f8d7da; color: #721c24; }
        .compliance { margin: 20px 0; }
        .compliance-item { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .compliant { background: #d4edda; color: #155724; }
        .mostly-compliant { background: #fff3cd; color: #856404; }
        .non-compliant { background: #f8d7da; color: #721c24; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .violation { margin: 10px 0; padding: 15px; border-left: 4px solid #dc3545; background: #f8f9fa; }
        .violation.critical { border-left-color: #dc3545; }
        .violation.serious { border-left-color: #fd7e14; }
        .violation.moderate { border-left-color: #ffc107; }
        .violation.minor { border-left-color: #28a745; }
        .recommendations { margin: 20px 0; }
        .recommendation { border-left: 4px solid #007bff; padding: 15px; margin: 10px 0; background: #f8f9fa; }
        .high-priority { border-left-color: #dc3545; }
        .medium-priority { border-left-color: #ffc107; }
    </style>
</head>
<body>
    <div class="container">
        <h1>♿ Accessibility Audit Report</h1>
        <p><strong>Generated:</strong> ${this.results.timestamp}</p>
        
        <div class="summary">
            <h2>📊 Overall Summary</h2>
            <div class="metric ${summary.overallScore >= 90 ? 'good' : summary.overallScore >= 70 ? 'warning' : 'error'}">
                Overall Score: ${summary.overallScore}/100
            </div>
            <div class="metric ${summary.totalViolations === 0 ? 'good' : 'error'}">
                Total Violations: ${summary.totalViolations}
            </div>
            <div class="metric ${summary.criticalIssues === 0 ? 'good' : 'error'}">
                Critical Issues: ${summary.criticalIssues}
            </div>
            <div class="metric good">
                Passes: ${summary.totalPasses}
            </div>
        </div>

        <div class="compliance">
            <h2>📋 WCAG Compliance Status</h2>
            ${Object.entries(summary.wcagCompliance)
              .map(
                ([level, status]) => `
                <div class="compliance-item ${status}">
                    <strong>${level}:</strong> ${status.replace('-', ' ').toUpperCase()}
                </div>
            `
              )
              .join('')}
        </div>

        <h2>🔍 Detailed Results by Page</h2>
        ${Object.entries(this.results.axe)
          .map(([url, results]) => {
            if (results.error) return `<p>Error testing ${url}: ${results.error}</p>`;

            return `
            <h3>${url}</h3>
            <div class="metric ${results.summary.violationCount === 0 ? 'good' : 'error'}">
                Violations: ${results.summary.violationCount}
            </div>
            <div class="metric good">
                Passes: ${results.summary.passCount}
            </div>
            <div class="metric">
                Score: ${results.summary.score}/100
            </div>
            
            ${
              results.violations.length > 0
                ? `
              <h4>Violations:</h4>
              ${results.violations
                .map(
                  violation => `
                <div class="violation ${violation.impact}">
                    <h5>${violation.id} (${violation.impact})</h5>
                    <p>${violation.description}</p>
                    <p><strong>Help:</strong> ${violation.help}</p>
                    <p><strong>Affected elements:</strong> ${violation.nodes.length}</p>
                </div>
              `
                )
                .join('')}
            `
                : '<p>✅ No violations found!</p>'
            }
          `;
          })
          .join('')}

        <h2>🔧 Manual Check Results</h2>
        ${Object.entries(this.results.manual)
          .map(
            ([check, result]) => `
            <h3>${check} ${result.passed ? '✅' : '❌'}</h3>
            <p>${result.description}</p>
            ${
              result.issues.length > 0
                ? `
                <ul>
                    ${result.issues.map(issue => `<li>${issue}</li>`).join('')}
                </ul>
            `
                : '<p>✅ No issues found!</p>'
            }
        `
          )
          .join('')}

        <h2>💡 Recommendations</h2>
        <div class="recommendations">
            ${summary.recommendations
              .map(
                rec => `
                <div class="recommendation ${rec.priority.toLowerCase()}-priority">
                    <h3>${rec.title}</h3>
                    <p><strong>Category:</strong> ${rec.category} | <strong>Priority:</strong> ${rec.priority}</p>
                    <p>${rec.description}</p>
                    <p><em>Impact:</em> ${rec.impact}</p>
                </div>
            `
              )
              .join('')}
        </div>
    </div>
</body>
</html>
    `;
  }

  generateRemediationGuide() {
    return `# Accessibility Remediation Guide

Generated: ${this.results.timestamp}

## Overview

This guide provides step-by-step instructions to fix the accessibility issues found in your application.

## Priority Issues

### Critical Issues (${this.results.summary.criticalIssues})

${this.results.summary.recommendations
  .filter(r => r.priority === 'High')
  .map(
    r => `
#### ${r.title}

**Description:** ${r.description}
**Impact:** ${r.impact}

**How to fix:**
1. Identify all instances of this issue
2. Apply the recommended solution
3. Test with screen readers
4. Verify with axe-core

`
  )
  .join('')}

## Manual Check Issues

${Object.entries(this.results.manual)
  .filter(([, result]) => !result.passed)
  .map(
    ([check, result]) => `
### ${check}

**Issues found:** ${result.issues.length}
**Description:** ${result.description}

**Specific issues:**
${result.issues.map(issue => `- ${issue}`).join('\n')}

**Remediation steps:**
1. Review each issue location
2. Apply semantic HTML best practices
3. Add appropriate ARIA attributes
4. Test keyboard navigation
5. Verify with accessibility tools

`
  )
  .join('')}

## Testing Checklist

After implementing fixes, verify:

- [ ] All axe-core violations resolved
- [ ] Keyboard navigation works properly
- [ ] Screen reader announces content correctly
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus management is appropriate
- [ ] Form labels are properly associated
- [ ] Images have meaningful alt text
- [ ] Heading structure is logical

## Tools for Ongoing Testing

1. **axe DevTools** - Browser extension for quick checks
2. **WAVE** - Web accessibility evaluation tool
3. **Lighthouse** - Built into Chrome DevTools
4. **Screen readers** - NVDA (Windows), VoiceOver (Mac), Orca (Linux)
5. **Keyboard testing** - Tab through your entire application

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Rules](https://dequeuniversity.com/rules/axe/)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
`;
  }
}

// Run audit if called directly
if (require.main === module) {
  const auditor = new AccessibilityAuditor();
  auditor.runAudit().catch(console.error);
}

module.exports = AccessibilityAuditor;
