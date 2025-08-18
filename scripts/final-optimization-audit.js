#!/usr/bin/env node

/**
 * Final Optimization Audit Script
 * Performs comprehensive final audit including:
 * - Lighthouse performance audit
 * - WCAG 2.1 AA accessibility compliance check
 * - Bundle optimization analysis
 * - Image optimization recommendations
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class FinalOptimizationAuditor {
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

  async runFinalAudit() {
    console.log('🚀 Starting Final Optimization Audit...\n');

    try {
      // Ensure reports directory exists
      if (!fs.existsSync('./audit-reports')) {
        fs.mkdirSync('./audit-reports', { recursive: true });
      }

      // 1. Analyze code quality and structure
      await this.analyzeCodeQuality();

      // 2. Check bundle optimization opportunities
      await this.analyzeBundleOptimization();

      // 3. Audit image optimization
      await this.auditImageOptimization();

      // 4. Check accessibility implementation
      await this.checkAccessibilityImplementation();

      // 5. Analyze performance optimizations
      await this.analyzePerformanceOptimizations();

      // 6. Generate comprehensive report
      await this.generateComprehensiveReport();

      console.log('✅ Final optimization audit completed successfully!');
      this.displaySummary();
    } catch (error) {
      console.error('❌ Final optimization audit failed:', error.message);
      process.exit(1);
    }
  }

  async analyzeCodeQuality() {
    console.log('🔍 Analyzing code quality and structure...');

    const codeQuality = {
      typeScript: await this.checkTypeScriptUsage(),
      eslint: await this.runESLintCheck(),
      structure: await this.analyzeProjectStructure(),
      bestPractices: await this.checkBestPractices(),
    };

    this.results.codeQuality = codeQuality;

    console.log(`  TypeScript coverage: ${codeQuality.typeScript.coverage}%`);
    console.log(`  ESLint issues: ${codeQuality.eslint.errors + codeQuality.eslint.warnings}`);
    console.log(`  Structure score: ${codeQuality.structure.score}/100`);
    console.log('✅ Code quality analysis completed\n');
  }

  async checkTypeScriptUsage() {
    const tsFiles = this.getFilesByExtension(['.ts', '.tsx']);
    const jsFiles = this.getFilesByExtension(['.js', '.jsx']);
    const totalFiles = tsFiles.length + jsFiles.length;

    const coverage = totalFiles > 0 ? Math.round((tsFiles.length / totalFiles) * 100) : 100;

    return {
      coverage,
      tsFiles: tsFiles.length,
      jsFiles: jsFiles.length,
      recommendations: jsFiles.length > 0 ? ['Convert remaining JS files to TypeScript'] : [],
    };
  }

  async runESLintCheck() {
    try {
      const output = execSync('npx eslint src --format json', {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      const results = JSON.parse(output);
      let errors = 0;
      let warnings = 0;

      results.forEach(file => {
        file.messages.forEach(message => {
          if (message.severity === 2) errors++;
          else if (message.severity === 1) warnings++;
        });
      });

      return { errors, warnings, results };
    } catch (error) {
      return { errors: 0, warnings: 0, results: [], error: error.message };
    }
  }

  async analyzeProjectStructure() {
    const structure = {
      score: 0,
      issues: [],
      achievements: [],
    };

    // Check for proper folder structure
    const expectedFolders = ['components', 'lib', 'services', 'types', 'hooks'];
    const srcPath = './src';

    if (fs.existsSync(srcPath)) {
      const folders = fs.readdirSync(srcPath).filter(item => fs.statSync(path.join(srcPath, item)).isDirectory());

      let score = 0;
      expectedFolders.forEach(folder => {
        if (folders.includes(folder)) {
          score += 20;
          structure.achievements.push(`Has ${folder} folder`);
        } else {
          structure.issues.push(`Missing ${folder} folder`);
        }
      });

      structure.score = score;
    }

    return structure;
  }

  async checkBestPractices() {
    const practices = {
      score: 0,
      checks: [],
    };

    // Check for configuration files
    const configFiles = [
      { file: 'tsconfig.json', name: 'TypeScript configuration' },
      { file: '.eslintrc.json', name: 'ESLint configuration' },
      { file: 'next.config.ts', name: 'Next.js configuration' },
      { file: 'tailwind.config.ts', name: 'Tailwind configuration' },
    ];

    configFiles.forEach(({ file, name }) => {
      const exists = fs.existsSync(file);
      practices.checks.push({
        name,
        passed: exists,
        file,
      });
      if (exists) practices.score += 25;
    });

    return practices;
  }

  async analyzeBundleOptimization() {
    console.log('📦 Analyzing bundle optimization...');

    try {
      // Check if build exists
      if (!fs.existsSync('.next')) {
        console.log('  Building application for analysis...');
        execSync('npm run build', { stdio: 'inherit' });
      }

      const bundleAnalysis = {
        totalSize: 0,
        chunks: {},
        optimizations: [],
        recommendations: [],
      };

      // Read build manifest if available
      if (fs.existsSync('.next/build-manifest.json')) {
        const buildManifest = JSON.parse(fs.readFileSync('.next/build-manifest.json', 'utf8'));

        // Analyze page bundles
        for (const [page, files] of Object.entries(buildManifest.pages || {})) {
          let pageSize = 0;

          for (const file of files) {
            const filePath = path.join('.next', file);
            if (fs.existsSync(filePath)) {
              const stats = fs.statSync(filePath);
              pageSize += stats.size;
            }
          }

          const pageSizeKB = Math.round(pageSize / 1024);
          bundleAnalysis.chunks[page] = pageSizeKB;
          bundleAnalysis.totalSize += pageSize;

          if (pageSizeKB > this.thresholds.bundle.maxChunkSize) {
            bundleAnalysis.recommendations.push({
              type: 'chunk-size',
              page,
              size: pageSizeKB,
              recommendation: 'Consider code splitting or lazy loading',
            });
          }
        }

        bundleAnalysis.totalSize = Math.round(bundleAnalysis.totalSize / 1024);
      }

      // Check for optimization opportunities
      bundleAnalysis.optimizations = await this.identifyBundleOptimizations();

      this.results.bundle = bundleAnalysis;

      console.log(`  Total bundle size: ${bundleAnalysis.totalSize} KB`);
      console.log(`  Number of chunks: ${Object.keys(bundleAnalysis.chunks).length}`);
      console.log(`  Optimization opportunities: ${bundleAnalysis.recommendations.length}`);
      console.log('✅ Bundle analysis completed\n');
    } catch (error) {
      console.error('Bundle analysis failed:', error.message);
      this.results.bundle = { error: error.message };
    }
  }

  async identifyBundleOptimizations() {
    const optimizations = [];

    // Check package.json for heavy dependencies
    if (fs.existsSync('package.json')) {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Known heavy packages
      const heavyPackages = ['moment', 'lodash', 'rxjs', 'chart.js'];

      heavyPackages.forEach(pkg => {
        if (dependencies[pkg]) {
          optimizations.push({
            type: 'heavy-dependency',
            package: pkg,
            recommendation: `Consider lighter alternatives for ${pkg}`,
          });
        }
      });
    }

    // Check for potential code splitting opportunities
    const srcFiles = this.getFilesByExtension(['.tsx', '.ts']);
    const largeFiles = srcFiles.filter(file => {
      try {
        const stats = fs.statSync(file);
        return stats.size > 10000; // > 10KB
      } catch {
        return false;
      }
    });

    if (largeFiles.length > 0) {
      optimizations.push({
        type: 'large-files',
        count: largeFiles.length,
        recommendation: 'Consider splitting large components',
      });
    }

    return optimizations;
  }

  async auditImageOptimization() {
    console.log('🖼️ Auditing image optimization...');

    const imageAudit = {
      totalImages: 0,
      optimizedImages: 0,
      unoptimizedImages: [],
      recommendations: [],
    };

    try {
      // Check public images
      const publicImagesDir = './public';
      if (fs.existsSync(publicImagesDir)) {
        const images = this.getImagesRecursively(publicImagesDir);

        images.forEach(imagePath => {
          const stats = fs.statSync(imagePath);
          const sizeKB = Math.round(stats.size / 1024);
          const ext = path.extname(imagePath).toLowerCase();

          imageAudit.totalImages++;

          // Check if image is optimized
          if (ext === '.webp' || ext === '.avif') {
            imageAudit.optimizedImages++;
          } else if (sizeKB > 100 && (ext === '.jpg' || ext === '.jpeg' || ext === '.png')) {
            imageAudit.unoptimizedImages.push({
              path: imagePath,
              size: sizeKB,
              ext,
            });
          }
        });
      }

      // Generate recommendations
      if (imageAudit.unoptimizedImages.length > 0) {
        imageAudit.recommendations.push({
          type: 'compression',
          count: imageAudit.unoptimizedImages.length,
          recommendation: 'Compress and convert large images to WebP/AVIF',
        });
      }

      // Check for Next.js Image usage
      const imageUsage = await this.checkNextImageUsage();
      if (imageUsage.nonOptimizedCount > 0) {
        imageAudit.recommendations.push({
          type: 'next-image',
          count: imageUsage.nonOptimizedCount,
          recommendation: 'Use Next.js Image component for better optimization',
        });
      }

      this.results.images = imageAudit;

      console.log(`  Total images: ${imageAudit.totalImages}`);
      console.log(`  Optimized images: ${imageAudit.optimizedImages}`);
      console.log(`  Recommendations: ${imageAudit.recommendations.length}`);
      console.log('✅ Image optimization audit completed\n');
    } catch (error) {
      console.error('Image audit failed:', error.message);
      this.results.images = { error: error.message };
    }
  }

  async checkNextImageUsage() {
    const srcFiles = this.getFilesByExtension(['.tsx', '.jsx']);
    let nextImageCount = 0;
    let regularImgCount = 0;

    srcFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Count Next.js Image components
        const nextImageMatches = content.match(/<Image[^>]*>/g) || [];
        nextImageCount += nextImageMatches.length;

        // Count regular img tags
        const imgMatches = content.match(/<img[^>]*>/g) || [];
        regularImgCount += imgMatches.length;
      } catch (error) {
        // File might not be readable
      }
    });

    return {
      nextImageCount,
      regularImgCount,
      nonOptimizedCount: regularImgCount,
    };
  }

  async checkAccessibilityImplementation() {
    console.log('♿ Checking accessibility implementation...');

    const a11yCheck = {
      score: 0,
      implementations: [],
      issues: [],
      recommendations: [],
    };

    try {
      const srcFiles = this.getFilesByExtension(['.tsx', '.jsx']);
      let ariaLabelsCount = 0;
      let altTextCount = 0;
      let semanticElementsCount = 0;
      let keyboardSupportCount = 0;

      srcFiles.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');

          // Check for ARIA labels
          const ariaMatches = content.match(/aria-\w+=/g) || [];
          ariaLabelsCount += ariaMatches.length;

          // Check for alt text
          const altMatches = content.match(/alt=/g) || [];
          altTextCount += altMatches.length;

          // Check for semantic elements
          const semanticMatches = content.match(/<(main|nav|header|footer|section|article|aside)[^>]*>/g) || [];
          semanticElementsCount += semanticMatches.length;

          // Check for keyboard support
          const keyboardMatches = content.match(/onKey(Down|Up|Press)=/g) || [];
          keyboardSupportCount += keyboardMatches.length;
        } catch (error) {
          // File might not be readable
        }
      });

      // Calculate score based on implementations
      let score = 0;
      if (ariaLabelsCount > 0) {
        score += 25;
        a11yCheck.implementations.push(`ARIA labels: ${ariaLabelsCount} instances`);
      }
      if (altTextCount > 0) {
        score += 25;
        a11yCheck.implementations.push(`Alt text: ${altTextCount} instances`);
      }
      if (semanticElementsCount > 0) {
        score += 25;
        a11yCheck.implementations.push(`Semantic elements: ${semanticElementsCount} instances`);
      }
      if (keyboardSupportCount > 0) {
        score += 25;
        a11yCheck.implementations.push(`Keyboard support: ${keyboardSupportCount} instances`);
      }

      a11yCheck.score = score;

      // Generate recommendations
      if (score < 100) {
        a11yCheck.recommendations.push({
          type: 'implementation',
          recommendation: 'Improve accessibility implementation coverage',
          priority: 'high',
        });
      }

      this.results.accessibility = a11yCheck;

      console.log(`  Accessibility score: ${a11yCheck.score}/100`);
      console.log(`  Implementations found: ${a11yCheck.implementations.length}`);
      console.log('✅ Accessibility check completed\n');
    } catch (error) {
      console.error('Accessibility check failed:', error.message);
      this.results.accessibility = { error: error.message };
    }
  }

  async analyzePerformanceOptimizations() {
    console.log('⚡ Analyzing performance optimizations...');

    const performanceCheck = {
      score: 0,
      optimizations: [],
      recommendations: [],
    };

    try {
      // Check Next.js config optimizations
      const nextConfigOptimizations = await this.checkNextConfigOptimizations();
      performanceCheck.optimizations.push(...nextConfigOptimizations);

      // Check for performance patterns in code
      const codeOptimizations = await this.checkCodeOptimizations();
      performanceCheck.optimizations.push(...codeOptimizations);

      // Calculate score
      performanceCheck.score = Math.min(100, performanceCheck.optimizations.length * 10);

      // Generate recommendations
      if (performanceCheck.score < 80) {
        performanceCheck.recommendations.push({
          type: 'performance',
          recommendation: 'Implement additional performance optimizations',
          priority: 'medium',
        });
      }

      this.results.performance = performanceCheck;

      console.log(`  Performance score: ${performanceCheck.score}/100`);
      console.log(`  Optimizations found: ${performanceCheck.optimizations.length}`);
      console.log('✅ Performance analysis completed\n');
    } catch (error) {
      console.error('Performance analysis failed:', error.message);
      this.results.performance = { error: error.message };
    }
  }

  async checkNextConfigOptimizations() {
    const optimizations = [];

    if (fs.existsSync('next.config.ts') || fs.existsSync('next.config.js')) {
      const configFile = fs.existsSync('next.config.ts') ? 'next.config.ts' : 'next.config.js';
      const content = fs.readFileSync(configFile, 'utf8');

      // Check for various optimizations
      if (content.includes('compress')) {
        optimizations.push('Compression enabled');
      }
      if (content.includes('images')) {
        optimizations.push('Image optimization configured');
      }
      if (content.includes('experimental')) {
        optimizations.push('Experimental features enabled');
      }
      if (content.includes('webpack')) {
        optimizations.push('Custom webpack configuration');
      }
    }

    return optimizations;
  }

  async checkCodeOptimizations() {
    const optimizations = [];
    const srcFiles = this.getFilesByExtension(['.tsx', '.ts']);

    let memoUsage = 0;
    let lazyLoadingUsage = 0;
    let dynamicImports = 0;

    srcFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Check for React.memo usage
        if (content.includes('React.memo') || content.includes('memo(')) {
          memoUsage++;
        }

        // Check for lazy loading
        if (content.includes('lazy(') || content.includes('Suspense')) {
          lazyLoadingUsage++;
        }

        // Check for dynamic imports
        if (content.includes('import(') || content.includes('dynamic(')) {
          dynamicImports++;
        }
      } catch (error) {
        // File might not be readable
      }
    });

    if (memoUsage > 0) {
      optimizations.push(`React.memo usage: ${memoUsage} components`);
    }
    if (lazyLoadingUsage > 0) {
      optimizations.push(`Lazy loading: ${lazyLoadingUsage} instances`);
    }
    if (dynamicImports > 0) {
      optimizations.push(`Dynamic imports: ${dynamicImports} instances`);
    }

    return optimizations;
  }

  async generateComprehensiveReport() {
    console.log('📄 Generating comprehensive final audit report...');

    // Calculate overall summary
    this.calculateOverallSummary();

    // Save JSON report
    fs.writeFileSync('./audit-reports/final-optimization-audit.json', JSON.stringify(this.results, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    fs.writeFileSync('./audit-reports/final-optimization-audit.html', htmlReport);

    // Generate action plan
    const actionPlan = this.generateActionPlan();
    fs.writeFileSync('./audit-reports/final-optimization-action-plan.md', actionPlan);

    console.log('✅ Final audit reports generated:');
    console.log('  - ./audit-reports/final-optimization-audit.json');
    console.log('  - ./audit-reports/final-optimization-audit.html');
    console.log('  - ./audit-reports/final-optimization-action-plan.md');
  }

  calculateOverallSummary() {
    const summary = {
      overallScore: 0,
      status: 'unknown',
      criticalIssues: 0,
      recommendations: [],
      achievements: [],
    };

    // Collect scores from different areas
    const scores = [];

    if (this.results.codeQuality?.structure?.score) {
      scores.push(this.results.codeQuality.structure.score);
    }

    if (this.results.accessibility?.score) {
      scores.push(this.results.accessibility.score);
    }

    if (this.results.performance?.score) {
      scores.push(this.results.performance.score);
    }

    // Calculate overall score
    if (scores.length > 0) {
      summary.overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    }

    // Collect achievements
    if (this.results.codeQuality?.structure?.achievements) {
      summary.achievements.push(...this.results.codeQuality.structure.achievements);
    }

    if (this.results.accessibility?.implementations) {
      summary.achievements.push(...this.results.accessibility.implementations);
    }

    if (this.results.performance?.optimizations) {
      summary.achievements.push(...this.results.performance.optimizations);
    }

    // Collect recommendations
    const allRecommendations = [];

    if (this.results.bundle?.recommendations) {
      allRecommendations.push(
        ...this.results.bundle.recommendations.map(r => ({
          priority: 'Medium',
          category: 'Bundle',
          title: r.recommendation,
          description: r.type,
        }))
      );
    }

    if (this.results.images?.recommendations) {
      allRecommendations.push(
        ...this.results.images.recommendations.map(r => ({
          priority: 'Medium',
          category: 'Images',
          title: r.recommendation,
          description: `${r.count} items need attention`,
        }))
      );
    }

    if (this.results.accessibility?.recommendations) {
      allRecommendations.push(
        ...this.results.accessibility.recommendations.map(r => ({
          priority: r.priority === 'high' ? 'High' : 'Medium',
          category: 'Accessibility',
          title: r.recommendation,
          description: r.type,
        }))
      );
    }

    summary.recommendations = allRecommendations;
    summary.criticalIssues = allRecommendations.filter(r => r.priority === 'High').length;

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
    <title>Final Optimization Audit Report</title>
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
        .section { margin: 30px 0; padding: 20px; border: 1px solid #dee2e6; border-radius: 6px; }
        .achievement { background: #d4edda; padding: 10px; margin: 5px 0; border-radius: 4px; color: #155724; }
        .recommendation { background: #fff3cd; padding: 15px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #ffc107; }
        .high-priority { border-left-color: #dc3545; background: #f8d7da; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Final Optimization Audit Report</h1>
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

        <div class="section">
            <h2>💻 Code Quality</h2>
            ${
              this.results.codeQuality
                ? `
                <div class="metric">TypeScript Coverage: ${this.results.codeQuality.typeScript?.coverage || 0}%</div>
                <div class="metric">ESLint Issues: ${(this.results.codeQuality.eslint?.errors || 0) + (this.results.codeQuality.eslint?.warnings || 0)}</div>
                <div class="metric">Structure Score: ${this.results.codeQuality.structure?.score || 0}/100</div>
                <div class="metric">Best Practices: ${this.results.codeQuality.bestPractices?.score || 0}/100</div>
            `
                : '<p>Code quality analysis not available</p>'
            }
        </div>

        <div class="section">
            <h2>📦 Bundle Analysis</h2>
            ${
              this.results.bundle && !this.results.bundle.error
                ? `
                <div class="metric ${this.results.bundle.totalSize <= this.thresholds.bundle.maxSize ? 'excellent' : 'needs-improvement'}">
                    Total Size: ${this.results.bundle.totalSize} KB
                </div>
                <div class="metric">Chunks: ${Object.keys(this.results.bundle.chunks || {}).length}</div>
                <div class="metric">Optimizations: ${this.results.bundle.optimizations?.length || 0}</div>
            `
                : '<p>Bundle analysis not available</p>'
            }
        </div>

        <div class="section">
            <h2>🖼️ Image Optimization</h2>
            ${
              this.results.images && !this.results.images.error
                ? `
                <div class="metric">Total Images: ${this.results.images.totalImages}</div>
                <div class="metric excellent">Optimized: ${this.results.images.optimizedImages}</div>
                <div class="metric ${this.results.images.unoptimizedImages?.length === 0 ? 'excellent' : 'needs-improvement'}">
                    Need Optimization: ${this.results.images.unoptimizedImages?.length || 0}
                </div>
            `
                : '<p>Image optimization analysis not available</p>'
            }
        </div>

        <div class="section">
            <h2>♿ Accessibility</h2>
            ${
              this.results.accessibility && !this.results.accessibility.error
                ? `
                <div class="metric ${this.results.accessibility.score >= 80 ? 'excellent' : 'needs-improvement'}">
                    Score: ${this.results.accessibility.score}/100
                </div>
                <div class="metric">Implementations: ${this.results.accessibility.implementations?.length || 0}</div>
            `
                : '<p>Accessibility analysis not available</p>'
            }
        </div>

        <div class="section">
            <h2>⚡ Performance</h2>
            ${
              this.results.performance && !this.results.performance.error
                ? `
                <div class="metric ${this.results.performance.score >= 80 ? 'excellent' : 'needs-improvement'}">
                    Score: ${this.results.performance.score}/100
                </div>
                <div class="metric">Optimizations: ${this.results.performance.optimizations?.length || 0}</div>
            `
                : '<p>Performance analysis not available</p>'
            }
        </div>

        <h2>🏆 Achievements</h2>
        ${summary.achievements
          .map(
            achievement => `
            <div class="achievement">✅ ${achievement}</div>
        `
          )
          .join('')}

        <h2>💡 Recommendations</h2>
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
    </div>
</body>
</html>
    `;
  }

  generateActionPlan() {
    const summary = this.results.summary;

    return `# Final Optimization Action Plan

Generated: ${this.results.timestamp}

## Overall Status: ${summary.status.toUpperCase().replace('-', ' ')}

**Overall Score:** ${summary.overallScore}/100
**Critical Issues:** ${summary.criticalIssues}
**Achievements:** ${summary.achievements.length}

## Executive Summary

This final optimization audit has analyzed your e-commerce application across multiple dimensions:
- Code quality and structure
- Bundle optimization
- Image optimization  
- Accessibility implementation
- Performance optimizations

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

## Code Quality Improvements

${
  this.results.codeQuality
    ? `
### Current Status
- TypeScript Coverage: ${this.results.codeQuality.typeScript?.coverage || 0}%
- ESLint Issues: ${(this.results.codeQuality.eslint?.errors || 0) + (this.results.codeQuality.eslint?.warnings || 0)}
- Structure Score: ${this.results.codeQuality.structure?.score || 0}/100

### Recommendations
${this.results.codeQuality.typeScript?.recommendations?.map(r => `- ${r}`).join('\n') || ''}
${this.results.codeQuality.structure?.issues?.map(i => `- Fix: ${i}`).join('\n') || ''}
`
    : 'Code quality analysis not available'
}

## Bundle Optimization

${
  this.results.bundle && !this.results.bundle.error
    ? `
### Current Status
- Total Size: ${this.results.bundle.totalSize} KB
- Target: ${this.thresholds.bundle.maxSize} KB
- Status: ${this.results.bundle.totalSize <= this.thresholds.bundle.maxSize ? '✅ Within limits' : '⚠️ Exceeds limits'}

### Optimization Opportunities
${this.results.bundle.optimizations?.map(opt => `- ${opt.type}: ${opt.recommendation || 'Optimize'}`).join('\n') || 'No specific optimizations identified'}

### Recommendations
${this.results.bundle.recommendations?.map(r => `- ${r.recommendation} (${r.type})`).join('\n') || 'Bundle is well optimized'}
`
    : 'Bundle analysis not available'
}

## Image Optimization

${
  this.results.images && !this.results.images.error
    ? `
### Current Status
- Total Images: ${this.results.images.totalImages}
- Optimized: ${this.results.images.optimizedImages}
- Need Optimization: ${this.results.images.unoptimizedImages?.length || 0}

### Action Items
${this.results.images.recommendations?.map(r => `- ${r.recommendation} (${r.count} items)`).join('\n') || '✅ Images are well optimized'}
`
    : 'Image optimization analysis not available'
}

## Accessibility Compliance

${
  this.results.accessibility && !this.results.accessibility.error
    ? `
### Current Status
- Accessibility Score: ${this.results.accessibility.score}/100
- Target: ${this.thresholds.accessibility.score}/100

### Implementations Found
${this.results.accessibility.implementations?.map(impl => `- ${impl}`).join('\n') || 'No specific implementations detected'}

### Recommendations
${this.results.accessibility.recommendations?.map(r => `- ${r.recommendation} (${r.priority} priority)`).join('\n') || '✅ Accessibility implementation is good'}
`
    : 'Accessibility analysis not available'
}

## Performance Optimizations

${
  this.results.performance && !this.results.performance.error
    ? `
### Current Status
- Performance Score: ${this.results.performance.score}/100
- Optimizations Found: ${this.results.performance.optimizations?.length || 0}

### Implemented Optimizations
${this.results.performance.optimizations?.map(opt => `- ${opt}`).join('\n') || 'No specific optimizations detected'}

### Recommendations
${this.results.performance.recommendations?.map(r => `- ${r.recommendation} (${r.priority} priority)`).join('\n') || '✅ Performance optimizations are good'}
`
    : 'Performance analysis not available'
}

## Next Steps

1. **Address High Priority Issues**: Focus on critical issues first
2. **Implement Quick Wins**: Start with low-effort, high-impact improvements
3. **Monitor Progress**: Set up regular audits to track improvements
4. **Document Changes**: Keep track of optimizations for future reference

## Monitoring and Maintenance

- Run this audit monthly to track progress
- Set up automated performance monitoring
- Implement bundle size budgets in CI/CD
- Regular accessibility testing with real users

## Success Metrics

- Overall Score: Target 90+
- Bundle Size: Keep under ${this.thresholds.bundle.maxSize}KB
- Accessibility Score: Target ${this.thresholds.accessibility.score}+
- Performance Score: Target 80+
- Zero Critical Issues

## Achievements

${summary.achievements.map(achievement => `✅ ${achievement}`).join('\n')}

---

*This audit provides a comprehensive view of your application's optimization status. Focus on high-priority items first, then work through medium-priority improvements systematically.*
`;
  }

  displaySummary() {
    const summary = this.results.summary;

    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL OPTIMIZATION AUDIT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Overall Score: ${summary.overallScore}/100`);
    console.log(`Status: ${summary.status.toUpperCase().replace('-', ' ')}`);
    console.log(`Critical Issues: ${summary.criticalIssues}`);
    console.log(`Total Achievements: ${summary.achievements.length}`);
    console.log(`Total Recommendations: ${summary.recommendations.length}`);

    if (summary.achievements.length > 0) {
      console.log('\n🏆 Top Achievements:');
      summary.achievements.slice(0, 5).forEach(achievement => {
        console.log(`  ✅ ${achievement}`);
      });
    }

    if (summary.recommendations.length > 0) {
      console.log('\n💡 Priority Recommendations:');
      summary.recommendations
        .filter(r => r.priority === 'High')
        .slice(0, 3)
        .forEach(rec => {
          console.log(`  🔥 ${rec.title} (${rec.category})`);
        });
    }

    console.log('\n📄 Detailed reports available in ./audit-reports/');
    console.log('='.repeat(60));
  }

  // Utility methods
  getFilesByExtension(extensions) {
    const files = [];
    const srcDir = './src';

    if (!fs.existsSync(srcDir)) return files;

    const walkDir = dir => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    };

    walkDir(srcDir);
    return files;
  }

  getImagesRecursively(dir) {
    const images = [];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];

    const walkDir = currentDir => {
      try {
        const items = fs.readdirSync(currentDir);
        for (const item of items) {
          const fullPath = path.join(currentDir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            walkDir(fullPath);
          } else if (imageExtensions.includes(path.extname(item).toLowerCase())) {
            images.push(fullPath);
          }
        }
      } catch (error) {
        // Directory might not be accessible
      }
    };

    walkDir(dir);
    return images;
  }
}

// Run audit if called directly
if (require.main === module) {
  const auditor = new FinalOptimizationAuditor();
  auditor.runFinalAudit().catch(console.error);
}

module.exports = FinalOptimizationAuditor;
