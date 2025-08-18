#!/usr/bin/env node

/**
 * Performance Audit Script
 * Performs Lighthouse audit, accessibility checks, and bundle analysis
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const AUDIT_CONFIG = {
  lighthouse: {
    urls: [
      'http://localhost:3000',
      'http://localhost:3000/products',
      'http://localhost:3000/cart',
      'http://localhost:3000/profile',
    ],
    categories: ['performance', 'accessibility', 'best-practices', 'seo'],
    thresholds: {
      performance: 90,
      accessibility: 95,
      'best-practices': 90,
      seo: 90,
    },
  },
  bundle: {
    maxSize: 250, // KB
    maxChunks: 10,
  },
};

class PerformanceAuditor {
  constructor() {
    this.results = {
      lighthouse: {},
      bundle: {},
      accessibility: {},
      timestamp: new Date().toISOString(),
    };
  }

  async runAudit() {
    console.log('🚀 Starting Performance Audit...\n');

    try {
      // 1. Build the application
      await this.buildApplication();

      // 2. Start the application
      const serverProcess = await this.startServer();

      // 3. Run Lighthouse audits
      await this.runLighthouseAudit();

      // 4. Analyze bundle size
      await this.analyzeBundleSize();

      // 5. Check accessibility compliance
      await this.checkAccessibility();

      // 6. Generate report
      await this.generateReport();

      // Cleanup
      if (serverProcess) {
        serverProcess.kill();
      }

      console.log('✅ Audit completed successfully!');
    } catch (error) {
      console.error('❌ Audit failed:', error.message);
      process.exit(1);
    }
  }

  async buildApplication() {
    console.log('📦 Building application...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Build completed\n');
    } catch (error) {
      throw new Error('Build failed: ' + error.message);
    }
  }

  async startServer() {
    console.log('🚀 Starting server...');
    const { spawn } = require('child_process');

    const server = spawn('npm', ['start'], {
      stdio: 'pipe',
      detached: false,
    });

    // Wait for server to be ready
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 30000);

      server.stdout.on('data', data => {
        if (data.toString().includes('Ready')) {
          clearTimeout(timeout);
          resolve();
        }
      });

      server.stderr.on('data', data => {
        console.error('Server error:', data.toString());
      });
    });

    console.log('✅ Server started\n');
    return server;
  }

  async runLighthouseAudit() {
    console.log('🔍 Running Lighthouse audits...');

    for (const url of AUDIT_CONFIG.lighthouse.urls) {
      console.log(`  Auditing: ${url}`);

      try {
        const outputPath = `./audit-reports/lighthouse-${url.split('/').pop() || 'home'}.json`;

        const command = `npx lighthouse ${url} --output=json --output-path=${outputPath} --chrome-flags="--headless --no-sandbox" --quiet`;
        execSync(command, { stdio: 'pipe' });

        // Parse results
        const report = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
        const scores = {};

        for (const category of AUDIT_CONFIG.lighthouse.categories) {
          const score = Math.round(report.lhr.categories[category].score * 100);
          scores[category] = score;

          const threshold = AUDIT_CONFIG.lighthouse.thresholds[category];
          const status = score >= threshold ? '✅' : '❌';
          console.log(`    ${category}: ${score}/100 ${status}`);
        }

        this.results.lighthouse[url] = {
          scores,
          metrics: {
            fcp: report.lhr.audits['first-contentful-paint'].numericValue,
            lcp: report.lhr.audits['largest-contentful-paint'].numericValue,
            cls: report.lhr.audits['cumulative-layout-shift'].numericValue,
            fid: report.lhr.audits['max-potential-fid']?.numericValue || 0,
            tti: report.lhr.audits['interactive'].numericValue,
          },
          opportunities: report.lhr.audits['unused-javascript']?.details?.items || [],
        };
      } catch (error) {
        console.error(`    Failed to audit ${url}:`, error.message);
        this.results.lighthouse[url] = { error: error.message };
      }
    }

    console.log('✅ Lighthouse audits completed\n');
  }

  async analyzeBundleSize() {
    console.log('📊 Analyzing bundle size...');

    try {
      // Generate bundle analyzer report
      execSync('npx next build --analyze', { stdio: 'pipe' });

      // Read build manifest
      const buildManifest = JSON.parse(fs.readFileSync('.next/build-manifest.json', 'utf8'));

      // Calculate bundle sizes
      const bundleStats = {
        totalSize: 0,
        chunks: {},
        largestChunks: [],
      };

      // Analyze each page bundle
      for (const [page, files] of Object.entries(buildManifest.pages)) {
        let pageSize = 0;

        for (const file of files) {
          try {
            const filePath = path.join('.next', file);
            if (fs.existsSync(filePath)) {
              const stats = fs.statSync(filePath);
              pageSize += stats.size;
            }
          } catch (error) {
            // File might not exist, skip
          }
        }

        bundleStats.chunks[page] = Math.round(pageSize / 1024); // KB
        bundleStats.totalSize += pageSize;
      }

      bundleStats.totalSize = Math.round(bundleStats.totalSize / 1024); // KB
      bundleStats.largestChunks = Object.entries(bundleStats.chunks)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      this.results.bundle = bundleStats;

      console.log(`  Total bundle size: ${bundleStats.totalSize} KB`);
      console.log('  Largest chunks:');
      for (const [chunk, size] of bundleStats.largestChunks) {
        const status = size <= AUDIT_CONFIG.bundle.maxSize ? '✅' : '⚠️';
        console.log(`    ${chunk}: ${size} KB ${status}`);
      }

      console.log('✅ Bundle analysis completed\n');
    } catch (error) {
      console.error('Bundle analysis failed:', error.message);
      this.results.bundle = { error: error.message };
    }
  }

  async checkAccessibility() {
    console.log('♿ Checking accessibility compliance...');

    try {
      // Run axe-core accessibility tests
      const axeCommand = `npx axe http://localhost:3000 --tags wcag2a,wcag2aa,wcag21aa --reporter json --output ./audit-reports/accessibility.json`;
      execSync(axeCommand, { stdio: 'pipe' });

      const axeResults = JSON.parse(fs.readFileSync('./audit-reports/accessibility.json', 'utf8'));

      this.results.accessibility = {
        violations: axeResults.violations.length,
        passes: axeResults.passes.length,
        incomplete: axeResults.incomplete.length,
        inapplicable: axeResults.inapplicable.length,
        details: axeResults.violations.map(v => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          nodes: v.nodes.length,
        })),
      };

      const score = Math.round(
        (axeResults.passes.length / (axeResults.passes.length + axeResults.violations.length)) * 100
      );

      console.log(`  Accessibility score: ${score}/100`);
      console.log(`  Violations: ${axeResults.violations.length}`);
      console.log(`  Passes: ${axeResults.passes.length}`);

      if (axeResults.violations.length > 0) {
        console.log('  Top violations:');
        axeResults.violations.slice(0, 3).forEach(v => {
          console.log(`    - ${v.id}: ${v.description}`);
        });
      }

      console.log('✅ Accessibility check completed\n');
    } catch (error) {
      console.error('Accessibility check failed:', error.message);
      this.results.accessibility = { error: error.message };
    }
  }

  async generateReport() {
    console.log('📄 Generating audit report...');

    // Ensure reports directory exists
    if (!fs.existsSync('./audit-reports')) {
      fs.mkdirSync('./audit-reports', { recursive: true });
    }

    // Generate comprehensive report
    const report = {
      ...this.results,
      summary: this.generateSummary(),
      recommendations: this.generateRecommendations(),
    };

    // Save JSON report
    fs.writeFileSync('./audit-reports/performance-audit.json', JSON.stringify(report, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(report);
    fs.writeFileSync('./audit-reports/performance-audit.html', htmlReport);

    console.log('✅ Reports generated:');
    console.log('  - ./audit-reports/performance-audit.json');
    console.log('  - ./audit-reports/performance-audit.html');
  }

  generateSummary() {
    const summary = {
      overall: 'good',
      issues: [],
      achievements: [],
    };

    // Check Lighthouse scores
    for (const [url, results] of Object.entries(this.results.lighthouse)) {
      if (results.scores) {
        for (const [category, score] of Object.entries(results.scores)) {
          const threshold = AUDIT_CONFIG.lighthouse.thresholds[category];
          if (score < threshold) {
            summary.issues.push(`${category} score below threshold for ${url}: ${score}/100`);
            summary.overall = 'needs-improvement';
          } else {
            summary.achievements.push(`${category} score meets threshold for ${url}: ${score}/100`);
          }
        }
      }
    }

    // Check bundle size
    if (this.results.bundle.totalSize > AUDIT_CONFIG.bundle.maxSize) {
      summary.issues.push(
        `Bundle size exceeds limit: ${this.results.bundle.totalSize}KB > ${AUDIT_CONFIG.bundle.maxSize}KB`
      );
      summary.overall = 'needs-improvement';
    }

    // Check accessibility
    if (this.results.accessibility.violations > 0) {
      summary.issues.push(`${this.results.accessibility.violations} accessibility violations found`);
      summary.overall = 'needs-improvement';
    }

    return summary;
  }

  generateRecommendations() {
    const recommendations = [];

    // Performance recommendations
    if (this.results.bundle.totalSize > AUDIT_CONFIG.bundle.maxSize) {
      recommendations.push({
        category: 'Performance',
        priority: 'High',
        title: 'Reduce bundle size',
        description: 'Consider code splitting, tree shaking, and removing unused dependencies',
        impact: 'Faster page loads and better user experience',
      });
    }

    // Accessibility recommendations
    if (this.results.accessibility.violations > 0) {
      recommendations.push({
        category: 'Accessibility',
        priority: 'High',
        title: 'Fix accessibility violations',
        description: 'Address WCAG 2.1 AA compliance issues',
        impact: 'Better accessibility for users with disabilities',
      });
    }

    // Lighthouse recommendations
    for (const [url, results] of Object.entries(this.results.lighthouse)) {
      if (results.opportunities && results.opportunities.length > 0) {
        recommendations.push({
          category: 'Performance',
          priority: 'Medium',
          title: `Optimize JavaScript for ${url}`,
          description: 'Remove unused JavaScript code',
          impact: 'Reduced bundle size and faster execution',
        });
      }
    }

    return recommendations;
  }

  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Audit Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2, h3 { color: #333; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; padding: 10px 15px; background: #e9ecef; border-radius: 4px; }
        .good { background: #d4edda; color: #155724; }
        .warning { background: #fff3cd; color: #856404; }
        .error { background: #f8d7da; color: #721c24; }
        .recommendations { margin: 20px 0; }
        .recommendation { border-left: 4px solid #007bff; padding: 15px; margin: 10px 0; background: #f8f9fa; }
        .high-priority { border-left-color: #dc3545; }
        .medium-priority { border-left-color: #ffc107; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .score { font-weight: bold; padding: 4px 8px; border-radius: 4px; }
        .score.good { background: #d4edda; color: #155724; }
        .score.warning { background: #fff3cd; color: #856404; }
        .score.error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Performance Audit Report</h1>
        <p><strong>Generated:</strong> ${report.timestamp}</p>
        
        <div class="summary">
            <h2>📊 Summary</h2>
            <div class="metric ${report.summary.overall === 'good' ? 'good' : 'warning'}">
                Overall Status: ${report.summary.overall.toUpperCase()}
            </div>
            <div class="metric">
                Issues Found: ${report.summary.issues.length}
            </div>
            <div class="metric good">
                Achievements: ${report.summary.achievements.length}
            </div>
        </div>

        <h2>🔍 Lighthouse Scores</h2>
        <table>
            <thead>
                <tr>
                    <th>URL</th>
                    <th>Performance</th>
                    <th>Accessibility</th>
                    <th>Best Practices</th>
                    <th>SEO</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(report.lighthouse)
                  .map(([url, results]) => {
                    if (!results.scores) return '';
                    return `
                    <tr>
                        <td>${url}</td>
                        ${Object.entries(results.scores)
                          .map(([category, score]) => {
                            const threshold = AUDIT_CONFIG.lighthouse.thresholds[category];
                            const className =
                              score >= threshold ? 'good' : score >= threshold - 10 ? 'warning' : 'error';
                            return `<td><span class="score ${className}">${score}</span></td>`;
                          })
                          .join('')}
                    </tr>
                  `;
                  })
                  .join('')}
            </tbody>
        </table>

        <h2>📦 Bundle Analysis</h2>
        <div class="metric ${report.bundle.totalSize <= AUDIT_CONFIG.bundle.maxSize ? 'good' : 'warning'}">
            Total Size: ${report.bundle.totalSize} KB
        </div>
        
        <h3>Largest Chunks</h3>
        <table>
            <thead>
                <tr>
                    <th>Chunk</th>
                    <th>Size (KB)</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${
                  report.bundle.largestChunks
                    ? report.bundle.largestChunks
                        .map(
                          ([chunk, size]) => `
                    <tr>
                        <td>${chunk}</td>
                        <td>${size}</td>
                        <td><span class="score ${size <= AUDIT_CONFIG.bundle.maxSize ? 'good' : 'warning'}">${size <= AUDIT_CONFIG.bundle.maxSize ? 'OK' : 'Large'}</span></td>
                    </tr>
                `
                        )
                        .join('')
                    : ''
                }
            </tbody>
        </table>

        <h2>♿ Accessibility</h2>
        <div class="metric ${report.accessibility.violations === 0 ? 'good' : 'error'}">
            Violations: ${report.accessibility.violations || 0}
        </div>
        <div class="metric good">
            Passes: ${report.accessibility.passes || 0}
        </div>

        <h2>💡 Recommendations</h2>
        <div class="recommendations">
            ${report.recommendations
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
}

// Run audit if called directly
if (require.main === module) {
  const auditor = new PerformanceAuditor();
  auditor.runAudit().catch(console.error);
}

module.exports = PerformanceAuditor;
