#!/usr/bin/env node
/**
 * LinkedIn Automation Tools - GitHub Repository Generator
 * Generates SEO-optimized markdown files for backlink building
 * 
 * Usage: node generate-repo.js
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://linkedautomation.org';
const REPO_NAME = 'linkedin-automation-tools';

// Category configurations with SEO metadata
const categories = [
  {
    file: 'category-automation-workflows.json',
    folder: 'automation-workflows',
    title: 'LinkedIn Automation Workflows',
    description: 'Tools for automating LinkedIn workflows, sequences, and multi-step processes',
    keywords: 'linkedin automation, workflow automation, linkedin sequences, automation tools'
  },
  {
    file: 'category-content-generation.json',
    folder: 'content-generation',
    title: 'LinkedIn Content Generation Tools',
    description: 'AI-powered tools for creating LinkedIn posts, articles, and content',
    keywords: 'linkedin content, ai content generator, linkedin posts, social media content'
  },
  {
    file: 'category-data-intelligence.json',
    folder: 'data-intelligence',
    title: 'LinkedIn Data Intelligence & Analytics',
    description: 'Tools for LinkedIn data extraction, analytics, and intelligence gathering',
    keywords: 'linkedin analytics, data extraction, linkedin intelligence, social selling'
  },
  {
    file: 'category-full-stack-solutions.json',
    folder: 'full-stack-solutions',
    title: 'Full-Stack LinkedIn Solutions',
    description: 'Complete LinkedIn automation and management platforms',
    keywords: 'linkedin platform, full stack linkedin, linkedin management, sales automation'
  },
  {
    file: 'category-profile-optimization.json',
    folder: 'profile-optimization',
    title: 'LinkedIn Profile Optimization Tools',
    description: 'Tools to optimize LinkedIn profiles for better visibility and engagement',
    keywords: 'linkedin profile, profile optimization, linkedin headline, personal branding'
  },
  {
    file: 'category-prospecting-outreach.json',
    folder: 'prospecting-outreach',
    title: 'LinkedIn Prospecting & Outreach Tools',
    description: 'Tools for LinkedIn lead generation, prospecting, and outreach campaigns',
    keywords: 'linkedin prospecting, lead generation, linkedin outreach, sales prospecting'
  }
];

// Generate markdown content for a single tool
function generateToolMarkdown(tool, category) {
  const toolUrl = `${BASE_URL}/tools/${tool.slug}`;
  const featuresList = tool.features ? tool.features.map(f => `- ${f}`).join('\n') : '';
  
  return `# ${tool.name}

**${tool.bestFor}**

${tool.description}

---

## Overview

| Attribute | Details |
|-----------|---------|
| **Website** | [${tool.website}](${tool.website}) |
| **Pricing** | ${tool.pricing} (${tool.pricingModel}) |
| **Rating** | ⭐ ${tool.rating}/5.0 |
| **Safety Score** | ${'🛡️'.repeat(tool.safetyScore)} ${tool.safetyScore}/5 |
| **Best For** | ${tool.bestFor} |
| **Founded** | ${tool.founded} |

---

## Key Features

${featuresList}

---

## About ${tool.name}

${tool.name} is a ${tool.pricingModel.toLowerCase()} LinkedIn automation tool designed for ${tool.bestFor.toLowerCase()}. 
With a safety score of ${tool.safetyScore}/5 and user rating of ${tool.rating}/5, it's a ${tool.safetyScore >= 4 ? 'trusted' : 'popular'} choice in the LinkedIn automation space.

Founded in ${tool.founded}, ${tool.name} has become a go-to solution for professionals looking to ${category.description.toLowerCase().replace('tools for ', '').replace('ai-powered ', '')}.

---

## Learn More

📖 [Read Full Review on LinkedAutomation](${toolUrl})

💰 [View Pricing Details](${toolUrl}#pricing)

⭐ [Compare with Similar Tools](${BASE_URL}/compare)

---

*Last updated: ${new Date().toISOString().split('T')[0]}*

*This entry is part of the [LinkedIn Automation Tools Directory](${BASE_URL}) - the most comprehensive resource for LinkedIn automation software.*
`;
}

// Generate category README
function generateCategoryREADME(category, tools) {
  const toolLinks = tools.map(t => `- [${t.name}](./${t.slug}.md) - ${t.description.substring(0, 80)}...`).join('\n');
  
  return `# ${category.title}

${category.description}

---

## Tools in this Category (${tools.length} total)

${toolLinks}

---

## About This Category

${category.description}. These tools help professionals and businesses streamline their LinkedIn activities while maintaining compliance with LinkedIn's terms of service.

### Common Use Cases

- Automating repetitive LinkedIn tasks
- Creating multi-step outreach sequences
- Managing LinkedIn connections at scale
- Tracking engagement and performance metrics

---

## Safety First

When using LinkedIn automation tools, always prioritize:

1. **Gradual Ramp-up** - Start with low activity levels
2. **Personalization** - Avoid generic messages
3. **Compliance** - Follow LinkedIn's terms of service
4. **Monitoring** - Watch for connection limit warnings

---

📊 [View All Categories](../README.md)

🏠 [Back to Main Directory](${BASE_URL})

---

*Part of the [LinkedIn Automation Tools Repository](${BASE_URL}) - Curated resources for LinkedIn growth.*
`;
}

// Generate main README
function generateMainREADME(categoriesData) {
  const totalTools = categoriesData.reduce((sum, cat) => sum + cat.tools.length, 0);
  const categoryList = categoriesData.map(cat => 
    `| [${cat.category.title}](./${cat.category.folder}/) | ${cat.tools.length} | ${cat.category.description.substring(0, 60)}... |`
  ).join('\n');

  return `# LinkedIn Automation Tools Directory

[![Tools](https://img.shields.io/badge/Tools-${totalTools}-blue)](./)
[![Categories](https://img.shields.io/badge/Categories-${categoriesData.length}-green)](./)
[![Last Updated](https://img.shields.io/badge/Last%20Updated-${new Date().toISOString().split('T')[0]}-orange)](./)

> The most comprehensive, unbiased directory of LinkedIn automation tools on the internet.

---

## 🚀 About This Repository

This repository serves as an open archive of LinkedIn automation tools, featuring detailed information, reviews, and comparisons for **${totalTools}+ tools** across **${categoriesData.length} categories**.

Each tool has its own dedicated page with:
- ✅ Detailed descriptions and use cases
- ✅ Pricing information and models
- ✅ Safety scores and ratings
- ✅ Feature breakdowns
- ✅ Direct links to official websites

---

## 📂 Categories

| Category | Tools | Description |
|----------|-------|-------------|
${categoryList}

---

## 🔍 Quick Navigation

### By Use Case

- **Sales Teams** → [Prospecting & Outreach](./prospecting-outreach/)
- **Marketing** → [Content Generation](./content-generation/)
- **Recruiters** → [Data Intelligence](./data-intelligence/)
- **Agencies** → [Full-Stack Solutions](./full-stack-solutions/)
- **Job Seekers** → [Profile Optimization](./profile-optimization/)
- **Power Users** → [Automation Workflows](./automation-workflows/)

### By Pricing Model

- **Free Tools** - Filter by Freemium options
- **Subscription** - Monthly/Annual pricing
- **Enterprise** - Custom pricing for teams
- **Pay-as-you-go** - Usage-based pricing

---

## ⭐ Featured Tools

${categoriesData.slice(0, 3).map(cat => {
  const featured = cat.tools.slice(0, 2);
  return featured.map(t => `- **[${t.name}](${BASE_URL}/tools/${t.slug})** - ${t.description.substring(0, 100)}...`).join('\n');
}).join('\n')}

---

## 🛡️ Safety & Compliance

All tools in this directory are evaluated based on:

- **Safety Score** (1-5): Risk level for LinkedIn account safety
- **Compliance**: Adherence to LinkedIn's Terms of Service
- **User Reviews**: Real user experiences and ratings

⚠️ **Disclaimer**: Always use automation tools responsibly. Excessive automation may violate LinkedIn's terms of service.

---

## 🔄 Repository Structure

\`\`\`
linkedin-automation-tools/
├── README.md                 # This file
├── automation-workflows/     # Workflow automation tools
│   ├── README.md
│   └── [tool-name].md
├── content-generation/       # AI content tools
│   ├── README.md
│   └── [tool-name].md
├── data-intelligence/        # Analytics tools
│   ├── README.md
│   └── [tool-name].md
├── full-stack-solutions/     # Complete platforms
│   ├── README.md
│   └── [tool-name].md
├── profile-optimization/     # Profile tools
│   ├── README.md
│   └── [tool-name].md
└── prospecting-outreach/     # Outreach tools
    ├── README.md
    └── [tool-name].md
\`\`\`

---

## 🤝 Contributing

This repository is automatically synced with the main [LinkedAutomation](${BASE_URL}) directory. 

To suggest updates or corrections:
1. Open an issue with the tool name and details
2. Submit a PR with updated information
3. Contact us through the main website

---

## 📊 Stats

- **Total Tools**: ${totalTools}
- **Categories**: ${categoriesData.length}
- **Last Sync**: ${new Date().toISOString().split('T')[0]}
- **Average Rating**: ${(categoriesData.reduce((sum, cat) => sum + cat.tools.reduce((s, t) => s + t.rating, 0), 0) / totalTools).toFixed(1)}/5.0

---

## 🔗 Links

- 🌐 **Main Website**: [${BASE_URL}](${BASE_URL})
- 📧 **Contact**: Through website contact form
- ⭐ **GitHub Stars**: If you find this useful, please star the repo!

---

## 📜 License

This repository is for informational purposes only. All tool names, logos, and trademarks belong to their respective owners.

---

*Curated with ❤️ by the [LinkedAutomation](${BASE_URL}) team*

*© ${new Date().getFullYear()} LinkedAutomation - All rights reserved*
`;
}

// Main execution
async function main() {
  console.log('🚀 LinkedIn Automation Tools - GitHub Repository Generator\n');
  
  const categoriesData = [];
  
  for (const category of categories) {
    console.log(`📁 Processing ${category.folder}...`);
    
    // Read source data
    const sourcePath = path.join('/root/directories/directories/linkedgen-dir-main/app/data', category.file);
    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ Source file not found: ${sourcePath}`);
      continue;
    }
    
    const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    const tools = data.tools || [];
    
    categoriesData.push({ category, tools });
    
    // Create tool markdown files
    for (const tool of tools) {
      const markdown = generateToolMarkdown(tool, category);
      const filePath = path.join(category.folder, `${tool.slug}.md`);
      fs.writeFileSync(filePath, markdown);
    }
    
    // Create category README
    const categoryREADME = generateCategoryREADME(category, tools);
    fs.writeFileSync(path.join(category.folder, 'README.md'), categoryREADME);
    
    console.log(`   ✅ Created ${tools.length} tool files`);
  }
  
  // Generate main README
  console.log('\n📄 Generating main README...');
  const mainREADME = generateMainREADME(categoriesData);
  fs.writeFileSync('README.md', mainREADME);
  
  console.log('\n✨ Repository generation complete!');
  console.log(`📊 Total tools: ${categoriesData.reduce((sum, cat) => sum + cat.tools.length, 0)}`);
  console.log(`📁 Total categories: ${categoriesData.length}`);
}

main().catch(console.error);
