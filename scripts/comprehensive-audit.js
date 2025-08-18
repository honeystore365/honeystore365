#!/usr/bin/env node

/**
 * Comprehensive Audit Script
 * Performs final optimization and audit including:
 * - Lighthouse performance audit
 * - WCAG 2.1 AA accessibility compliance check
 * - Bundle optimization analysis
 * - Image optimization recommendations
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ComprehensiveAuditor {
  constructor() {
    this.results = {
      performance: {},
      accessibility: {},
      bundle: {},
      images: {},
      summary: {},
      timestamp: new Date().toISOString(),
    };

    this.thresholds = {
      performance: {
        lighthouse: 90,
        fcp: 1800, // ms
        lcp: 2500, // ms
        cls: 0.1,
        fid: 100, // ms
      },
      accessibility: {
        score: 95,
        violations: 0,
      },
      bundle: {
        maxSize: 250, // KB
        maxChunkSize: 100, // KB
      },
    };
  }

  async runComprehensiveAudit() {
    console.log('🚀 Starting Comprehensive Final Audit...\n');

    try {
      // Ensure reports directory exists
      if (!fs.existsSync('./audit-reports')) {
        fs.mkdirSync('./audit-reports', { recursive: true });
      }

      // 1. Build the application
      await this.buildApplication();

      // 2. Start the application
      const serverProcess = await this.startServer();

      // 3. Run Lighthouse performance audit
      await this.runLighthouseAudit();

      // 4. Run accessibility audit
      await this.runAccessibilityAudit();

      // 5. Analyze bundle optimization
      await this.analyzeBundleOptimization();

      // 6. Check image optimization
      await this.checkImageOptimization();

      // 7. Generate comprehensive report
      await this.generateComprehensiveReport();

      // Cleanup
      if (serverProcess) {
        serverProcess.kill();
      }

      console.log('✅ Comprehensive audit completed successfully!');
      this.displaySummary();
    } catch (error) {
      console.error('❌ Comprehensive audit failed:', error.message);
      process.exit(1);
    }
  }

  async buildApplication() {
    console.log('📦 Building application for audit...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Build completed\n');
    } catch (error) {
      throw new Error('Build failed: ' + error.message);
    }
  }

  async startServer() {
    console.log('🚀 Starting server for testing...');
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
        if (data.toString().includes('Ready') || data.toString().includes('started server')) {
          clearTimeout(timeout);
          resolve();
        }
      });

      server.stderr.on('data', data => {
        const output = data.toString();
        if (output.includes('Ready') || output.includes('started server')) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    // Wait a bit more to ensure server is fully ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ Server ready\n');
    return server;
  }

  async runLighthouseAudit() {
    console.log('🔍 Running Lighthouse performance audit...');

    const urls = ['http://localhost:3000', 'http://localhost:3000/products', 'http://localhost:3000/cart'];

    this.results.performance = {};

    for (const url of urls) {
      const pageName = url.split('/').pop() || 'home';
      console.log(`  Auditing: ${url}`);

      try {
        const outputPath = `./audit-reports/lighthouse-${pageName}.json`;
        const command = `npx lighthouse ${url} --output=json --output-path=${outputPath} --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage" --quiet`;

        execSync(command, { stdio: 'pipe' });

        const report = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
        const categories = report.lhr.categories;

        const scores = {
          performance: Math.round(categories.performance.score * 100),
          accessibility: Math.round(categories.accessibility.score * 100),
          bestPractices: Math.round(categories['best-practices'].score * 100),
          seo: Math.round(categories.seo.score * 100),
        };

        const metrics = {
          fcp: report.lhr.audits['first-contentful-paint']?.numericValue || 0,
          lcp: report.lhr.audits['largest-contentful-paint']?.numericValue || 0,
          cls: report.lhr.audits['cumulative-layout-shift']?.numericValue || 0,
          fid: report.lhr.audits['max-potential-fid']?.numericValue || 0,
          tti: report.lhr.audits['interactive']?.numericValue || 0,
        };

        this.results.performance[url] = { scores, metrics };

        console.log(`    Performance: ${scores.performance}/100`);
        console.log(`    Accessibility: ${scores.accessibility}/100`);
        console.log(`    FCP: ${Math.round(metrics.fcp)}ms`);
        console.log(`    LCP: ${Math.round(metrics.lcp)}ms`);
      } catch (error) {
        console.error(`    Failed to audit ${url}:`, error.message);
        this.results.performance[url] = { error: error.message };
      }
    }

    console.log('✅ Lighthouse audit completed\n');
  }

  async runAccessibilityAudit() {
    console.log('♿ Running accessibility compliance audit...');

    try {
      // Run axe-core accessibility tests
      const command = `npx axe http://localhost:3000 --tags wcag2a,wcag2aa,wcag21aa --reporter json --output ./audit-reports/accessibility-comprehensive.json`;
      execSync(command, { stdio: 'pipe' });

      const axeResults = JSON.parse(fs.readFileSync('./audit-reports/accessibility-comprehensive.json', 'utf8'));

      this.results.accessibility = {
        violations: axeResults.violations.length,
        passes: axeResults.passes.length,
        incomplete: axeResults.incomplete.length,
        score: Math.round((axeResults.passes.length / (axeResults.passes.length + axeResults.violations.length)) * 100),
        criticalViolations: axeResults.violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length,
        details: axeResults.violations.slice(0, 5).map(v => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length,
        })),
      };

      console.log(`  Accessibility score: ${this.results.accessibility.score}/100`);
      console.log(`  Violations: ${this.results.accessibility.violations}`);
      console.log(`  Critical/Serious: ${this.results.accessibility.criticalViolations}`);

      if (this.results.accessibility.violations > 0) {
        console.log('  Top violations:');
        this.results.accessibility.details.forEach(v => {
          console.log(`    - ${v.id} (${v.impact}): ${v.nodes} elements`);
        });
      }
    } catch (error) {
      console.error('Accessibility audit failed:', error.message);
      this.results.accessibility = { error: error.message };
    }

    console.log('✅ Accessibility audit completed\n');
  }

  async analyzeBundleOptimization() {
    console.log('📊 Analyzing bundle optimization...');

    try {
      // Read build manifest
      const buildManifest = JSON.parse(fs.readFileSync('.next/build-manifest.json', 'utf8'));

      const bundleStats = {
        totalSize: 0,
        chunks: {},
        largestChunk: { name: '', size: 0 },
      };

      // Analyze page bundles
      for (const [page, files] of Object.entries(buildManifest.pages || {})) {
        let pageSize = 0;

        for (const file of files) {
          const filePath = path.join('.next', file);
          if (fs.existsSync(filePath)) {
            const fileStats = fs.statSync(filePath);
            pageSize += fileStats.size;
          }
        }

        const pageSizeKB = Math.round(pageSize / 1024);
        bundleStats.chunks[page] = pageSizeKB;
        bundleStats.totalSize += pageSize;

        if (pageSizeKB > bundleStats.largestChunk.size) {
          bundleStats.largestChunk = { name: page, size: pageSizeKB };
        }
      }

      bundleStats.totalSize = Math.round(bundleStats.totalSize / 1024);

      this.results.bundle = {
        ...bundleStats,
        optimizationOpportunities: this.identifyBundleOptimizations(bundleStats),
      };

      console.log(`  Total bundle size: ${bundleStats.totalSize} KB`);
      console.log(`  Number of chunks: ${Object.keys(bundleStats.chunks).length}`);
      console.log(`  Largest chunk: ${bundleStats.largestChunk.name} (${bundleStats.largestChunk.size} KB)`);

      const sizeStatus = bundleStats.totalSize <= this.thresholds.bundle.maxSize ? '✅' : '⚠️';
      console.log(`  Size threshold: ${sizeStatus} (${bundleStats.totalSize}/${this.thresholds.bundle.maxSize} KB)`);
    } catch (error) {
      console.error('Bundle analysis failed:', error.message);
      this.results.bundle = { error: error.message };
    }

    console.log('✅ Bundle analysis completed\n');
  }

  identifyBundleOptimizations(bundleStats) {
    const opportunities = [];

    // Check total bundle size
    if (bundleStats.totalSize > this.thresholds.bundle.maxSize) {
      opportunities.push({
        type: 'total-size',
        priority: 'high',
        description: `Total bundle size (${bundleStats.totalSize}KB) exceeds recommended limit (${this.thresholds.bundle.maxSize}KB)`,
        recommendation: 'Consider code splitting, tree shaking, and removing unused dependencies',
      });
    }

    // Check individual chunk sizes
    for (const [chunk, size] of Object.entries(bundleStats.chunks)) {
      if (size > this.thresholds.bundle.maxChunkSize) {
        opportunities.push({
          type: 'chunk-size',
          priority: size > this.thresholds.bundle.maxChunkSize * 2 ? 'high' : 'medium',
          description: `Chunk ${chunk} (${size}KB) is larger than recommended (${this.thresholds.bundle.maxChunkSize}KB)`,
          recommendation: 'Split this chunk into smaller pieces or lazy load components',
        });
      }
    }

    return opportunities;
  }

  async checkImageOptimization() {
    console.log('🖼️ Checking image optimization...');

    const imageOptimization = {
      totalImages: 0,
      optimizedImages: 0,
      unoptimizedImages: [],
      recommendations: [],
    };

    try {
      // Check public images directory
      const publicImagesDir = './public/images';
      if (fs.existsSync(publicImagesDir)) {
        const images = this.getImagesRecursively(publicImagesDir);

        for (const imagePath of images) {
          const stats = fs.statSync(imagePath);
          const sizeKB = Math.round(stats.size / 1024);
          const ext = path.extname(imagePath).toLowerCase();

          imageOptimization.totalImages++;

          // Check if image is optimized (basic heuristics)
          if (sizeKB > 500 && (ext === '.jpg' || ext === '.jpeg' || ext === '.png')) {
            imageOptimization.unoptimizedImages.push({
              path: imagePath,
              size: sizeKB,
              recommendation: 'Consider compressing or converting to WebP/AVIF',
            });
          } else if (ext === '.webp' || ext === '.avif') {
            imageOptimization.optimizedImages++;
          }
        }
      }

      // Generate recommendations
      if (imageOptimization.unoptimizedImages.length > 0) {
        imageOptimization.recommendations.push({
          type: 'compression',
          priority: 'medium',
          description: `${imageOptimization.unoptimizedImages.length} images could be optimized`,
          recommendation: 'Use Next.js Image component with optimization or compress images manually',
        });
      }

      if (imageOptimization.optimizedImages / imageOptimization.totalImages < 0.5) {
        imageOptimization.recommendations.push({
          type: 'format',
          priority: 'medium',
          description: 'Consider using modern image formats (WebP, AVIF)',
          recommendation: 'Configure Next.js to serve WebP/AVIF formats automatically',
        });
      }

      this.results.images = imageOptimization;

      console.log(`  Total images: ${imageOptimization.totalImages}`);
      console.log(`  Optimized images: ${imageOptimization.optimizedImages}`);
      console.log(`  Optimization opportunities: ${imageOptimization.unoptimizedImages.length}`);
    } catch (error) {
      console.error('Image optimization check failed:', error.message);
      this.results.images = { error: error.message };
    }

    console.log('✅ Image optimization check completed\n');
  }

  getImagesRecursively(dir) {
    const images = [];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];

    const walkDir = currentDir => {
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          walkDir(fullPath);
        } else if (imageExtensions.includes(path.extname(item).toLowerCase())) {
          images.push(fullPath);
        }
      }
    };

    walkDir(dir);
    return images;
  }

  async generateComprehensiveReport() {
    console.log('📄 Generating comprehensive audit report...');

    // Calculate overall summary
    this.calculateOverallSummary();

    // Save JSON report
    fs.writeFileSync('./audit-reports/comprehensive-audit.json', JSON.stringify(this.results, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    fs.writeFileSync('./audit-reports/comprehensive-audit.html', htmlReport);

    // Generate action plan
    const actionPlan = this.generateActionPlan();
    fs.writeFileSync('./audit-reports/optimization-action-plan.md', actionPlan);

    console.log('✅ Reports generated:');
    console.log('  - ./audit-reports/comprehensive-audit.json');
    console.log('  - ./audit-reports/comprehensive-audit.html');
    console.log('  - ./audit-reports/optimization-action-plan.md');
  }

  calculateOverallSummary() {
    const summary = {
      overallScore: 0,
      status: 'unknown',
      criticalIssues: 0,
      recommendations: [],
      achievements: [],
    };

    let totalScore = 0;
    let scoreCount = 0;

    // Performance summary
    for (const [url, results] of Object.entries(this.results.performance)) {
      if (results.scores) {
        totalScore += results.scores.performance;
        scoreCount++;

        if (results.scores.performance >= this.thresholds.performance.lighthouse) {
          summary.achievements.push(`Performance score meets threshold for ${url}`);
        } else {
          summary.criticalIssues++;
          summary.recommendations.push({
            priority: 'High',
            category: 'Performance',
            title: `Improve performance for ${url}`,
            description: `Score: ${results.scores.performance}/100`,
          });
        }
      }
    }

    // Accessibility summary
    if (this.results.accessibility.score) {
      totalScore += this.results.accessibility.score;
      scoreCount++;

      if (this.results.accessibility.violations === 0) {
        summary.achievements.push('No accessibility violations found');
      } else {
        summary.criticalIssues += this.results.accessibility.criticalViolations;
        summary.recommendations.push({
          priority: 'High',
          category: 'Accessibility',
          title: 'Fix accessibility violations',
          description: `${this.results.accessibility.violations} violations found`,
        });
      }
    }

    // Bundle summary
    if (this.results.bundle.totalSize) {
      if (this.results.bundle.totalSize <= this.thresholds.bundle.maxSize) {
        summary.achievements.push('Bundle size within recommended limits');
      } else {
        summary.criticalIssues++;
        summary.recommendations.push({
          priority: 'High',
          category: 'Bundle Size',
          title: 'Reduce bundle size',
          description: `Current: ${this.results.bundle.totalSize}KB, Target: ${this.thresholds.bundle.maxSize}KB`,
        });
      }
    }

    // Calculate overall score
    if (scoreCount > 0) {
      summary.overallScore = Math.round(totalScore / scoreCount);
    }

    // Determine status
    if (summary.criticalIssues === 0 && summary.overallScore >= 90) {
      summary.status = 'excellent';
    } else if (summary.criticalIssues <= 2 && summary.overallScore >= 80) {
      summary.status = 'good';
    } else if (summary.overallScore >= 70) {
      summary.status = 'needs-improvement';
    } else {
      summary.status = 'poor';
    }

    this.results.summary = summary;
  }

  generateHTMLReport() {
    const summary = this.results.summary;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Audit Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2, h3 { color: #333; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; padding: 10px 15px; background: #e9ecef; border-radius: 4px; }
        .excellent { background: #d4edda; color: #155724; }
        .good { background: #d1ecf1; color: #0c5460; }
        .needs-improvement { background: #fff3cd; color: #856404; }
        .poor { background: #f8d7da; color: #721c24; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .recommendation { border-left: 4px solid #007bff; padding: 15px; margin: 10px 0; background: #f8f9fa; }
        .high-priority { border-left-color: #dc3545; }
        .medium-priority { border-left-color: #ffc107; }
        .achievement { border-left: 4px solid #28a745; padding: 15px; margin: 10px 0; background: #f8f9fa; }
        .score { font-weight: bold; padding: 4px 8px; border-radius: 4px; }
        .score.excellent { background: #d4edda; color: #155724; }
        .score.good { background: #d1ecf1; color: #0c5460; }
        .score.needs-improvement { background: #fff3cd; color: #856404; }
        .score.poor { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Comprehensive Audit Report</h1>
        <p><strong>Generated:</strong> ${this.results.timestamp}</p>
        
        <div class="summary">
            <h2>📊 Overall Summary</h2>
            <div class="metric ${summary.status}">
                Overall Score: ${summary.overallScore}/100
            </div>
            <div class="metric ${summary.status}">
                Status: ${summary.status.toUpperCase().replace('-', ' ')}
            </div>
            <div class="metric ${summary.criticalIssues === 0 ? 'excellent' : 'poor'}">
                Critical Issues: ${summary.criticalIssues}
            </div>
            <div class="metric excellent">
                Achievements: ${summary.achievements.length}
            </div>
        </div>

        <h2>⚡ Performance Results</h2>
        <table>
            <thead>
                <tr>
                    <th>URL</th>
                    <th>Performance</th>
                    <th>Accessibility</th>
                    <th>FCP (ms)</th>
                    <th>LCP (ms)</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(this.results.performance)
                  .map(([url, results]) => {
                    if (results.error) return `<tr><td>${url}</td><td colspan="4">Error: ${results.error}</td></tr>`;

                    const perfClass =
                      results.scores.performance >= 90
                        ? 'excellent'
                        : results.scores.performance >= 80
                          ? 'good'
                          : results.scores.performance >= 70
                            ? 'needs-improvement'
                            : 'poor';

                    const a11yClass =
                      results.scores.accessibility >= 95
                        ? 'excellent'
                        : results.scores.accessibility >= 90
                          ? 'good'
                          : results.scores.accessibility >= 80
                            ? 'needs-improvement'
                            : 'poor';

                    return `
                    <tr>
                        <td>${url}</td>
                        <td><span class="score ${perfClass}">${results.scores.performance}</span></td>
                        <td><span class="score ${a11yClass}">${results.scores.accessibility}</span></td>
                        <td>${Math.round(results.metrics.fcp)}</td>
                        <td>${Math.round(results.metrics.lcp)}</td>
                    </tr>
                  `;
                  })
                  .join('')}
            </tbody>
        </table>

        <h2>♿ Accessibility Results</h2>
        <div class="metric ${this.results.accessibility.violations === 0 ? 'excellent' : 'poor'}">
            Score: ${this.results.accessibility.score || 0}/100
        </div>
        <div class="metric ${this.results.accessibility.violations === 0 ? 'excellent' : 'poor'}">
            Violations: ${this.results.accessibility.violations || 0}
        </div>
        <div class="metric ${this.results.accessibility.criticalViolations === 0 ? 'excellent' : 'poor'}">
            Critical: ${this.results.accessibility.criticalViolations || 0}
        </div>

        ${
          this.results.accessibility.details && this.results.accessibility.details.length > 0
            ? `
        <h3>Top Accessibility Issues</h3>
        ${this.results.accessibility.details
          .map(
            detail => `
            <div class="recommendation high-priority">
                <h4>${detail.id} (${detail.impact})</h4>
                <p>${detail.description}</p>
                <p><strong>Affected elements:</strong> ${detail.nodes}</p>
            </div>
        `
          )
          .join('')}
        `
            : ''
        }

        <h2>📦 Bundle Analysis</h2>
        <div class="metric ${this.results.bundle.totalSize <= this.thresholds.bundle.maxSize ? 'excellent' : 'needs-improvement'}">
            Total Size: ${this.results.bundle.totalSize || 0} KB
        </div>
        <div class="metric">
            Chunks: ${Object.keys(this.results.bundle.chunks || {}).length}
        </div>
        <div class="metric">
            Largest Chunk: ${this.results.bundle.largestChunk?.name || 'N/A'} (${this.results.bundle.largestChunk?.size || 0} KB)
        </div>

        <h2>🖼️ Image Optimization</h2>
        <div class="metric">
            Total Images: ${this.results.images.totalImages || 0}
        </div>
        <div class="metric excellent">
            Optimized: ${this.results.images.optimizedImages || 0}
        </div>
        <div class="metric ${(this.results.images.unoptimizedImages?.length || 0) === 0 ? 'excellent' : 'needs-improvement'}">
            Need Optimization: ${this.results.images.unoptimizedImages?.length || 0}
        </div>

        <h2>🎯 Recommendations</h2>
        ${summary.recommendations
          .map(
            rec => `
            <div class="recommendation ${rec.priority.toLowerCase()}-priority">
                <h3>${rec.title}</h3>
                <p><strong>Category:</strong> ${rec.category} | <strong>Priority:</strong> ${rec.priority}</p>
                <p>${rec.description}</p>
            </div>
        `
          )
          .join('')}

        <h2>🏆 Achievements</h2>
        ${summary.achievements
          .map(
            achievement => `
            <div class="achievement">
                <p>✅ ${achievement}</p>
            </div>
        `
          )
          .join('')}
    </div>
</body>
</html>
    `;
  }

  generateActionPlan() {
    const summary = this.results.summary;

    return `# Optimization Action Plan

Generated: ${this.results.timestamp}

## Overall Status: ${summary.status.toUpperCase().replace('-', ' ')}

**Overall Score:** ${summary.overallScore}/100
**Critical Issues:** ${summary.criticalIssues}
**Achievements:** ${summary.achievements.length}

## Immediate Actions Required

### High Priority Issues

${summary.recommendations
  .filter(r => r.priority === 'High')
  .map(
    r => `
#### ${r.title}

**Category:** ${r.category}
**Description:** ${r.description}

**Action Steps:**
1. Identify the root cause
2. Implement the recommended solution
3. Test the changes
4. Measure the improvement

`
  )
  .join('')}

## Performance Optimization

${Object.entries(this.results.performance)
  .map(([url, results]) => {
    if (results.error || !results.scores) return '';

    const issues = [];
    if (results.scores.performance < this.thresholds.performance.lighthouse) {
      issues.push(`Performance score (${results.scores.performance}) below threshold`);
    }
    if (results.metrics.fcp > this.thresholds.performance.fcp) {
      issues.push(`First Contentful Paint (${Math.round(results.metrics.fcp)}ms) too slow`);
    }
    if (results.metrics.lcp > this.thresholds.performance.lcp) {
      issues.push(`Largest Contentful Paint (${Math.round(results.metrics.lcp)}ms) too slow`);
    }

    if (issues.length === 0) return '';

    return `
### ${url}

**Issues:**
${issues.map(issue => `- ${issue}`).join('\n')}

**Recommendations:**
- Optimize images and use Next.js Image component
- Implement code splitting and lazy loading
- Minimize JavaScript bundle size
- Use CDN for static assets
- Enable compression and caching

`;
  })
  .join('')}

## Accessibility Compliance

${
  this.results.accessibility.violations > 0
    ? `
**Current Status:** ${this.results.accessibility.violations} violations found

**Critical Issues:** ${this.results.accessibility.criticalViolations}

**Top Issues to Fix:**
${
  this.results.accessibility.details
    ?.map(
      detail => `
- **${detail.id}** (${detail.impact}): ${detail.description}
  - Affected elements: ${detail.nodes}
`
    )
    .join('') || ''
}

**Action Steps:**
1. Fix critical and serious violations first
2. Add proper ARIA labels and roles
3. Ensure keyboard navigation works
4. Test with screen readers
5. Validate color contrast ratios

`
    : `
✅ **No accessibility violations found!**

Continue to maintain accessibility standards by:
- Regular testing with axe-core
- Manual keyboard navigation testing
- Screen reader testing
- Color contrast validation
`
}

## Bundle Optimization

**Current Size:** ${this.results.bundle.totalSize}KB
**Target Size:** ${this.thresholds.bundle.maxSize}KB

${
  this.results.bundle.totalSize > this.thresholds.bundle.maxSize
    ? `
**Action Required:** Bundle size exceeds recommended limit

**Optimization Steps:**
1. Analyze bundle composition with webpack-bundle-analyzer
2. Implement code splitting for large components
3. Remove unused dependencies
4. Enable tree shaking
5. Use dynamic imports for non-critical code
6. Optimize third-party libraries

**Large Chunks:**
${Object.entries(this.results.bundle.chunks || {})
  .filter(([, size]) => size > this.thresholds.bundle.maxChunkSize)
  .map(([chunk, size]) => `- ${chunk}: ${size}KB (consider splitting)`)
  .join('\n')}

`
    : `
✅ **Bundle size within recommended limits**

Continue to monitor bundle size by:
- Regular bundle analysis
- Setting up size budgets in CI/CD
- Monitoring for dependency bloat
`
}

## Image Optimization

**Total Images:** ${this.results.images.totalImages || 0}
**Optimized:** ${this.results.images.optimizedImages || 0}
**Need Optimization:** ${this.results.images.unoptimizedImages?.length || 0}

${
  this.results.images.unoptimizedImages?.length > 0
    ? `
**Images to Optimize:**
${this.results.images.unoptimizedImages
  .slice(0, 5)
  .map(
    img => `
- ${img.path} (${img.size}KB): ${img.recommendation}
`
  )
  .join('')}

**Action Steps:**
1. Compress large images
2. Convert to WebP/AVIF format
3. Use Next.js Image component
4. Implement responsive images
5. Add proper alt text for accessibility

`
    : `
✅ **Images are well optimized**

Continue to maintain image optimization by:
- Using Next.js Image component for all images
- Serving modern formats (WebP, AVIF)
- Implementing responsive images
- Regular image audit
`
}

## Monitoring and Maintenance

### Regular Audits
- Run comprehensive audit monthly
- Monitor Core Web Vitals continuously
- Set up performance budgets in CI/CD
- Track accessibility compliance

### Tools and Scripts
- \`npm run audit:all\` - Run all audits
- \`npm run audit:performance\` - Performance audit only
- \`npm run audit:accessibility\` - Accessibility audit only
- \`npm run audit:bundle\` - Bundle analysis only

### Success Metrics
- Performance score: ≥90
- Accessibility score: ≥95
- Bundle size: ≤${this.thresholds.bundle.maxSize}KB
- Zero critical accessibility violations
- Core Web Vitals in green

## Next Steps

1. **Immediate (This Week)**
   - Fix critical accessibility violations
   - Optimize largest performance bottlenecks
   - Implement high-priority recommendations

2. **Short Term (This Month)**
   - Complete all high-priority optimizations
   - Set up automated monitoring
   - Implement performance budgets

3. **Long Term (Ongoing)**
   - Regular audit schedule
   - Continuous monitoring
   - Performance culture adoption
   - Team training on best practices

---

*This action plan should be reviewed and updated regularly based on audit results and business priorities.*
`;
  }

  displaySummary() {
    const summary = this.results.summary;

    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE AUDIT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Overall Score: ${summary.overallScore}/100`);
    console.log(`Status: ${summary.status.toUpperCase().replace('-', ' ')}`);
    console.log(`Critical Issues: ${summary.criticalIssues}`);
    console.log(`Achievements: ${summary.achievements.length}`);

    if (summary.criticalIssues > 0) {
      console.log('\n🚨 CRITICAL ISSUES TO ADDRESS:');
      summary.recommendations
        .filter(r => r.priority === 'High')
        .forEach(r => {
          console.log(`  ❌ ${r.category}: ${r.title}`);
        });
    }

    if (summary.achievements.length > 0) {
      console.log('\n🏆 ACHIEVEMENTS:');
      summary.achievements.forEach(achievement => {
        console.log(`  ✅ ${achievement}`);
      });
    }

    console.log('\n📄 Detailed reports available in ./audit-reports/');
    console.log('='.repeat(60));
  }
}

// Run audit if called directly
if (require.main === module) {
  const auditor = new ComprehensiveAuditor();
  auditor.runComprehensiveAudit().catch(console.error);
}

module.exports = ComprehensiveAuditor;
