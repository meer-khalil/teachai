#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecurityAuditor {
    constructor() {
        this.issues = [];
        this.warnings = [];
        this.suggestions = [];
        this.projectRoot = process.cwd();
    }

    log(level, message, details = null) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        
        console.log(logMessage);
        if (details) {
            console.log('  Details:', details);
        }
        
        // Store issues for reporting
        const item = { level, message, details, timestamp };
        switch(level.toLowerCase()) {
            case 'error':
            case 'critical':
                this.issues.push(item);
                break;
            case 'warning':
                this.warnings.push(item);
                break;
            case 'info':
            case 'suggestion':
                this.suggestions.push(item);
                break;
        }
    }

    // Check environment configuration
    checkEnvironmentSecurity() {
        console.log('\n🔍 Checking Environment Security...');
        
        // Check for .env files exposure
        const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
        envFiles.forEach(file => {
            const envPath = path.join(this.projectRoot, file);
            if (fs.existsSync(envPath)) {
                this.log('warning', `Environment file found: ${file}`, 
                    'Ensure this file is in .gitignore and not exposed publicly');
            }
        });

        // Check backend .env
        const backendEnvPath = path.join(this.projectRoot, 'backend', 'config', '.env');
        if (fs.existsSync(backendEnvPath)) {
            this.checkEnvFileContent(backendEnvPath);
        }

        // Check for example files
        const exampleEnvPath = path.join(this.projectRoot, 'backend', 'config', 'config.env.example');
        if (fs.existsSync(exampleEnvPath)) {
            this.checkExampleEnvFile(exampleEnvPath);
        }
    }

    checkEnvFileContent(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            lines.forEach((line, index) => {
                const lineNum = index + 1;
                
                // Check for weak JWT secrets
                if (line.includes('JWT_SECRET=')) {
                    const secret = line.split('=')[1]?.trim();
                    if (secret && secret.length < 32) {
                        this.log('critical', `Weak JWT secret detected`, 
                            `Line ${lineNum}: JWT secret should be at least 32 characters long`);
                    }
                }
                
                // Check for default passwords
                if (line.includes('password') && 
                    (line.includes('password') || line.includes('123456') || line.includes('admin'))) {
                    this.log('critical', `Default password detected`, 
                        `Line ${lineNum}: Change default passwords`);
                }
                
                // Check for exposed API keys
                if (line.includes('API_KEY=') && !line.includes('your_')) {
                    const key = line.split('=')[1]?.trim();
                    if (key && key.length > 10) {
                        this.log('critical', `Potential exposed API key`, 
                            `Line ${lineNum}: API key found in environment file`);
                    }
                }
            });
        } catch (error) {
            this.log('error', `Cannot read environment file: ${filePath}`, error.message);
        }
    }

    checkExampleEnvFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check for actual secrets in example file
            const dangerousPatterns = [
                /sk-[a-zA-Z0-9]{48}/g, // OpenAI API keys
                /[0-9a-f]{32,}/g, // Long hex strings that might be real secrets
                /@[^.]+\.[^.]+/g // Real email addresses
            ];
            
            dangerousPatterns.forEach(pattern => {
                const matches = content.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        if (!match.includes('your_') && !match.includes('example')) {
                            this.log('critical', `Potential real secret in example file`, 
                                `Found: ${match.substring(0, 10)}...`);
                        }
                    });
                }
            });
        } catch (error) {
            this.log('error', `Cannot read example environment file: ${filePath}`, error.message);
        }
    }

    // Check Node.js dependencies
    async checkDependencySecurity() {
        console.log('\n🔍 Checking Dependency Security...');
        
        // Check if npm audit is available
        try {
            const { exec } = require('child_process');
            const util = require('util');
            const execAsync = util.promisify(exec);
            
            // Run npm audit for backend
            const backendPath = path.join(this.projectRoot, 'backend');
            if (fs.existsSync(path.join(backendPath, 'package.json'))) {
                try {
                    const { stdout, stderr } = await execAsync('npm audit --json', { cwd: backendPath });
                    const auditResult = JSON.parse(stdout);
                    
                    if (auditResult.metadata) {
                        const vulnerabilities = auditResult.metadata.vulnerabilities;
                        const total = vulnerabilities.total;
                        
                        if (total > 0) {
                            this.log('critical', `Found ${total} vulnerabilities in backend dependencies`, {
                                critical: vulnerabilities.critical || 0,
                                high: vulnerabilities.high || 0,
                                moderate: vulnerabilities.moderate || 0,
                                low: vulnerabilities.low || 0
                            });
                        } else {
                            this.log('info', 'No vulnerabilities found in backend dependencies');
                        }
                    }
                } catch (auditError) {
                    this.log('warning', 'Could not run npm audit for backend', auditError.message);
                }
            }
            
            // Run npm audit for frontend
            if (fs.existsSync(path.join(this.projectRoot, 'package.json'))) {
                try {
                    const { stdout, stderr } = await execAsync('npm audit --json', { cwd: this.projectRoot });
                    const auditResult = JSON.parse(stdout);
                    
                    if (auditResult.metadata) {
                        const vulnerabilities = auditResult.metadata.vulnerabilities;
                        const total = vulnerabilities.total;
                        
                        if (total > 0) {
                            this.log('critical', `Found ${total} vulnerabilities in frontend dependencies`, {
                                critical: vulnerabilities.critical || 0,
                                high: vulnerabilities.high || 0,
                                moderate: vulnerabilities.moderate || 0,
                                low: vulnerabilities.low || 0
                            });
                        } else {
                            this.log('info', 'No vulnerabilities found in frontend dependencies');
                        }
                    }
                } catch (auditError) {
                    this.log('warning', 'Could not run npm audit for frontend', auditError.message);
                }
            }
        } catch (error) {
            this.log('warning', 'npm audit not available', 'Install npm to run security audits');
        }
    }

    // Check file permissions and structure
    checkFilePermissions() {
        console.log('\n🔍 Checking File Security...');
        
        const sensitiveFiles = [
            '.env',
            'backend/config/.env',
            'backend/config/config.env',
            'flaskApi/config.py'
        ];
        
        sensitiveFiles.forEach(file => {
            const filePath = path.join(this.projectRoot, file);
            if (fs.existsSync(filePath)) {
                try {
                    const stats = fs.statSync(filePath);
                    const mode = (stats.mode & parseInt('777', 8)).toString(8);
                    
                    if (mode !== '600' && mode !== '644') {
                        this.log('warning', `File permissions may be too permissive: ${file}`, 
                            `Current: ${mode}, Recommended: 600 or 644`);
                    }
                } catch (error) {
                    this.log('error', `Cannot check permissions for ${file}`, error.message);
                }
            }
        });
        
        // Check for sensitive files in public directories
        const publicDirs = ['public', 'build', 'dist'];
        publicDirs.forEach(dir => {
            const dirPath = path.join(this.projectRoot, dir);
            if (fs.existsSync(dirPath)) {
                this.checkPublicDirectory(dirPath);
            }
        });
    }

    checkPublicDirectory(dirPath) {
        try {
            const files = fs.readdirSync(dirPath, { withFileTypes: true });
            
            files.forEach(file => {
                if (file.isDirectory()) {
                    this.checkPublicDirectory(path.join(dirPath, file.name));
                } else {
                    // Check for sensitive file patterns
                    const sensitivePatterns = [
                        /\.env/i,
                        /\.key/i,
                        /\.pem/i,
                        /config.*\.js$/i,
                        /secret/i,
                        /password/i
                    ];
                    
                    const fileName = file.name.toLowerCase();
                    sensitivePatterns.forEach(pattern => {
                        if (pattern.test(fileName)) {
                            this.log('critical', `Sensitive file in public directory`, 
                                `File: ${path.join(dirPath, file.name)}`);
                        }
                    });
                }
            });
        } catch (error) {
            this.log('error', `Cannot scan public directory: ${dirPath}`, error.message);
        }
    }

    // Check for hardcoded secrets in code
    checkHardcodedSecrets() {
        console.log('\n🔍 Checking for Hardcoded Secrets...');
        
        const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py'];
        const secretPatterns = [
            { name: 'OpenAI API Key', pattern: /sk-[a-zA-Z0-9]{48}/g },
            { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g },
            { name: 'Stripe Secret Key', pattern: /sk_live_[0-9a-zA-Z]{24}/g },
            { name: 'JWT Secret', pattern: /jwt[_-]?secret.*[=:]\s*['\"][^'\"]{32,}['\"]/gi },
            { name: 'Database Password', pattern: /password.*[=:]\s*['\"][^'\"]{8,}['\"]/gi },
            { name: 'API Key Pattern', pattern: /api[_-]?key.*[=:]\s*['\"][^'\"]{20,}['\"]/gi }
        ];
        
        this.scanDirectory(this.projectRoot, codeExtensions, secretPatterns);
    }

    scanDirectory(dirPath, extensions, patterns) {
        try {
            const files = fs.readdirSync(dirPath, { withFileTypes: true });
            
            files.forEach(file => {
                const fullPath = path.join(dirPath, file.name);
                
                if (file.isDirectory()) {
                    // Skip node_modules, .git, and other system directories
                    if (!['node_modules', '.git', '.vscode', 'build', 'dist', '__pycache__', 'venv', '.env'].includes(file.name)) {
                        this.scanDirectory(fullPath, extensions, patterns);
                    }
                } else {
                    const ext = path.extname(file.name).toLowerCase();
                    if (extensions.includes(ext)) {
                        this.scanFileForSecrets(fullPath, patterns);
                    }
                }
            });
        } catch (error) {
            this.log('error', `Cannot scan directory: ${dirPath}`, error.message);
        }
    }

    scanFileForSecrets(filePath, patterns) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            patterns.forEach(({ name, pattern }) => {
                lines.forEach((line, index) => {
                    const matches = line.match(pattern);
                    if (matches) {
                        matches.forEach(match => {
                            // Skip obvious examples and placeholders
                            if (!match.includes('your_') && 
                                !match.includes('example') &&
                                !match.includes('placeholder') &&
                                !match.includes('test_') &&
                                !match.includes('fake_')) {
                                this.log('critical', `Potential hardcoded ${name}`, 
                                    `File: ${filePath}:${index + 1} - ${match.substring(0, 20)}...`);
                            }
                        });
                    }
                });
            });
        } catch (error) {
            this.log('error', `Cannot scan file: ${filePath}`, error.message);
        }
    }

    // Generate security report
    generateReport() {
        console.log('\n📊 Security Audit Report');
        console.log('========================');
        
        console.log(`\\n🔴 Critical Issues: ${this.issues.length}`);
        this.issues.forEach((issue, index) => {
            console.log(`  ${index + 1}. ${issue.message}`);
            if (issue.details) {
                console.log(`     ${issue.details}`);
            }
        });
        
        console.log(`\\n🟡 Warnings: ${this.warnings.length}`);
        this.warnings.forEach((warning, index) => {
            console.log(`  ${index + 1}. ${warning.message}`);
        });
        
        console.log(`\\n💡 Suggestions: ${this.suggestions.length}`);
        this.suggestions.forEach((suggestion, index) => {
            console.log(`  ${index + 1}. ${suggestion.message}`);
        });
        
        // Security score calculation
        const totalChecks = this.issues.length + this.warnings.length + this.suggestions.length;
        const criticalWeight = 3;
        const warningWeight = 2;
        const suggestionWeight = 1;
        
        const score = Math.max(0, 100 - (
            this.issues.length * criticalWeight +
            this.warnings.length * warningWeight +
            this.suggestions.length * suggestionWeight
        ));
        
        console.log(`\\n🏆 Security Score: ${score}/100`);
        
        if (score >= 90) {
            console.log('   ✅ Excellent security posture!');
        } else if (score >= 75) {
            console.log('   🟢 Good security, minor improvements needed');
        } else if (score >= 50) {
            console.log('   🟡 Moderate security, several issues to address');
        } else {
            console.log('   🔴 Poor security, immediate attention required');
        }
        
        // Save report to file
        this.saveReportToFile();
    }

    saveReportToFile() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                critical_issues: this.issues.length,
                warnings: this.warnings.length,
                suggestions: this.suggestions.length,
                security_score: Math.max(0, 100 - (this.issues.length * 3 + this.warnings.length * 2 + this.suggestions.length))
            },
            issues: this.issues,
            warnings: this.warnings,
            suggestions: this.suggestions
        };
        
        const reportPath = path.join(this.projectRoot, 'security-audit-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\\n💾 Detailed report saved to: ${reportPath}`);
    }

    // Main audit function
    async runAudit() {
        console.log('🔒 TeachAI Security Audit Starting...');
        console.log('=====================================');
        
        this.checkEnvironmentSecurity();
        await this.checkDependencySecurity();
        this.checkFilePermissions();
        this.checkHardcodedSecrets();
        
        this.generateReport();
        
        // Exit with error code if critical issues found
        if (this.issues.length > 0) {
            process.exit(1);
        }
    }
}

// Run audit if called directly
if (require.main === module) {
    const auditor = new SecurityAuditor();
    auditor.runAudit().catch(error => {
        console.error('Security audit failed:', error);
        process.exit(1);
    });
}

module.exports = SecurityAuditor;