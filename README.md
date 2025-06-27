# Airtable Schema Analyzer 🔍

A powerful and comprehensive Airtable Script Extension that analyzes your entire base structure and provides detailed insights about tables, fields, relationships, and more. Perfect for documentation, auditing, migration planning, and understanding complex Airtable bases.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Airtable](https://img.shields.io/badge/Airtable-Script%20Extension-18BFFF.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### 📊 Complete Base Analysis
- **Table Inspection**: Analyzes all tables with record counts, descriptions, and primary fields
- **Field Deep Dive**: Extracts complete field information including types, configurations, and options
- **View Discovery**: Lists all views in each table
- **Relationship Mapping**: Automatically detects and visualizes linked record relationships

### 🎯 Advanced Field Analysis
The analyzer recognizes and extracts options for all Airtable field types:

- **Text Fields**: Single line, multiline, rich text, email, URL, phone number
- **Numeric Fields**: Number, percent, currency (with precision and symbols), rating, duration
- **Date Fields**: Date and datetime (with format preferences and timezones)
- **Select Fields**: Single and multiple select (with all choices and colors)
- **Relational Fields**: Linked records, lookups, rollups, count fields
- **User Fields**: Collaborator fields, created by, last modified by
- **Computed Fields**: Formulas, autonumber, buttons
- **Media Fields**: Attachments
- **Special Fields**: Checkbox, barcode, external sync source

### 📈 Comprehensive Statistics
- Field type distribution analysis
- Field category breakdown
- Table size rankings
- Total counts for tables, fields, views, and records
- Relationship statistics

### 🚀 Interactive Navigation
- Menu-driven interface for easy exploration
- Drill-down capability for detailed table inspection
- Separate views for relationships and statistics
- Back navigation at every level

### 💾 Multiple Export Formats

#### JSON Export
- Complete schema data in structured format
- Perfect for programmatic processing
- Includes all metadata and relationships

#### Markdown Export
- Well-formatted documentation
- Tables with field information
- Relationship mappings
- Ready for wikis or documentation sites

#### CSV Export
- Field-level data export
- Easy import into spreadsheets
- Includes all field options as JSON

## 📋 Prerequisites

- Airtable Pro or Enterprise account (required for Scripting Extension)
- A base with at least one table
- Edit permissions on the base

## 🛠️ Installation

1. Open your Airtable base
2. Click the "Extensions" button in the top-right corner
3. Click "+ Add an extension"
4. Search for and select "Scripting"
5. Click "Add extension"
6. In the code editor, delete any existing code
7. Copy the entire contents of `airtable-schema-analyzer.js`
8. Paste into the Scripting extension editor
9. Click "Run" to start the analyzer

## 📖 Usage

### Quick Start

1. **Run the Script**: Click the "Run" button in the Scripting extension
2. **Choose Action**: Select from the main menu:
   - ▶️ **Start Analysis** - Begin analyzing your base
   - ⚙️ **Configure Settings** - Customize analysis options
   - ❓ **Help** - View detailed help information

### Main Menu Options

After analysis completes, you'll see a summary and can choose:

- **📊 Tables Overview** - View all tables with field counts and categories
- **🔗 Relationships** - See all linked record relationships
- **📈 Detailed Statistics** - View field type distributions and table sizes
- **📝 Full Schema** - See the complete schema in JSON format
- **💾 Export Data** - Export in your preferred format

### Configuration Options

Access settings before running analysis:

- **Sample Records**: Number of sample records to collect (0-10)
- **Show Field IDs**: Include Airtable field IDs in output
- **Analyze Relationships**: Map linked record relationships
- **Calculate Statistics**: Generate distribution statistics

## 🔧 Configuration

The script includes a `CONFIG` object with default settings:

```javascript
const CONFIG = {
    MAX_SAMPLE_RECORDS: 5,      // Sample records per table
    SHOW_FIELD_IDS: true,       // Display field IDs
    SHOW_RELATIONSHIPS: true,   // Analyze relationships
    SHOW_STATISTICS: true,      // Calculate statistics
    EXPORT_FORMAT: 'json'       // Default export format
};
```

## 📊 Output Examples

### Table Overview
```
## Customers
- Records: 1,234
- Fields: 15
- Views: 4
- Primary Field: Name

Field Categories:
- TEXT: 5
- NUMERIC: 3
- DATE: 2
- SELECT: 2
- RELATIONAL: 3
```

### Field Details
```
### Email
ID: fldXXXXXXXXXXXXXX
- Type: email (TEXT)
- Description: Customer contact email
- Options: {}
```

### Relationships
```
## Orders
- Customer → Customers (Many-to-Many)
- Products → Products (Many-to-Many)
```

## 🎯 Use Cases

### Documentation
Generate comprehensive documentation for your base structure. Export to Markdown for wikis or knowledge bases.

### Auditing
Review field usage, identify unused fields, and optimize your base structure using the statistics.

### Migration Planning
Export complete schema information when planning to migrate data between bases or to external systems.

### Onboarding
Help new team members understand your base structure quickly with exported documentation.

### Development
Use JSON export for programmatic base recreation or automated testing scenarios.

## ⚠️ Limitations

- **View Configurations**: Detailed view configurations (filters, sorts) are not accessible via the Scripting API
- **Formula Details**: Formula expressions are not exposed through the API
- **Field Permissions**: Field-level permissions are not included in the analysis
- **Performance**: Large bases with many tables/fields may take longer to analyze
- **Attachment Contents**: The analyzer does not access actual file contents

## 🏗️ Technical Details

### Architecture

The analyzer uses a class-based structure:

```javascript
class AirtableSchemaAnalyzer {
    constructor()           // Initialize schema object
    analyze()              // Main analysis function
    analyzeTable()         // Analyze individual table
    analyzeField()         // Extract field information
    analyzeView()          // Process view data
    analyzeRelationships() // Map linked records
    calculateStatistics()  // Generate statistics
    displayResults()       // Show interactive results
    exportSchema()         // Handle exports
}
```

### Field Categories

Fields are automatically categorized for better organization:

- **TEXT**: Text-based fields
- **NUMERIC**: Number-based fields
- **DATE**: Date and time fields
- **SELECT**: Choice-based fields
- **RELATIONAL**: Fields linking to other records
- **ATTACHMENT**: File attachment fields
- **CHECKBOX**: Boolean fields
- **USER**: Collaborator fields
- **COMPUTED**: Calculated fields
- **OTHER**: Special field types

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

1. Maintain the existing code style
2. Add comments for complex logic
3. Test with various base configurations
4. Update README for new features
5. Ensure backward compatibility

### Feature Requests

Have an idea for improvement? Please open an issue with:
- Clear description of the feature
- Use case examples
- Any relevant mockups or specifications

## 🐛 Known Issues

- Some field types introduced after 2024 may not have full option extraction
- Very large bases (>100 tables) may experience timeout issues
- Complex formula fields show only validation status, not the actual formula

## 📝 Changelog

### Version 1.0.0 (2024)
- Initial release
- Complete base analysis functionality
- Multiple export formats
- Interactive navigation
- Relationship mapping
- Statistics generation

## 📄 License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2024 [Alex Onufrak]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- Built for the Airtable community
- Inspired by the need for better base documentation tools
- Thanks to all contributors and users

## 📞 Support

- **Issues**: Please use the GitHub issue tracker
- **Questions**: Open a discussion in the GitHub Discussions tab
- **Email**: [aonufrak@umd.edu]

---

**Note**: This script requires Airtable Pro or Enterprise plan for access to the Scripting Extension.

Made with ❤️ for the Airtable community
