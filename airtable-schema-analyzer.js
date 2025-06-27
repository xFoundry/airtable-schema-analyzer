/**
 * Advanced Airtable Schema Analyzer
 * A comprehensive tool for analyzing and documenting your Airtable base structure
 * 
 * Features:
 * - Complete table analysis with descriptions
 * - Field type detection with all options
 * - View analysis
 * - Relationship mapping
 * - Interactive navigation
 * - Export functionality
 * - Statistics and insights
 */

// Configuration
const CONFIG = {
    MAX_SAMPLE_RECORDS: 5,
    SHOW_FIELD_IDS: true,
    SHOW_RELATIONSHIPS: true,
    SHOW_STATISTICS: true,
    EXPORT_FORMAT: 'json' // 'json', 'markdown', or 'csv'
};

// Field type mapping for better categorization
const FIELD_TYPE_CATEGORIES = {
    TEXT: ['singleLineText', 'multilineText', 'richText', 'email', 'url', 'phoneNumber'],
    NUMERIC: ['number', 'percent', 'currency', 'rating', 'duration'],
    DATE: ['date', 'dateTime', 'createdTime', 'lastModifiedTime'],
    SELECT: ['singleSelect', 'multipleSelects'],
    RELATIONAL: ['multipleRecordLinks', 'lookup', 'rollup', 'count'],
    ATTACHMENT: ['multipleAttachments'],
    CHECKBOX: ['checkbox'],
    USER: ['singleCollaborator', 'multipleCollaborators', 'createdBy', 'lastModifiedBy'],
    COMPUTED: ['formula', 'autoNumber', 'button', 'aiText'],
    OTHER: ['barcode', 'externalSyncSource']
};

// Main analyzer class
class AirtableSchemaAnalyzer {
    constructor() {
        this.schema = {
            baseName: base.name,
            baseId: base.id,
            tables: [],
            relationships: [],
            statistics: {},
            generatedAt: new Date().toISOString()
        };
    }

    // Main analysis function
    async analyze() {
        output.markdown('# 🔍 Airtable Schema Analyzer');
        output.markdown(`Analyzing base: **${this.schema.baseName}**\n`);
        
        try {
            // Get all tables
            const tables = base.tables;
            
            if (!tables || tables.length === 0) {
                output.markdown('❌ **No tables found in this base.**');
                return;
            }
            
            this.schema.statistics.totalTables = tables.length;
            
            // Analyze each table
            for (let i = 0; i < tables.length; i++) {
                await this.analyzeTable(tables[i], i);
            }
            
            // Analyze relationships
            if (CONFIG.SHOW_RELATIONSHIPS) {
                this.analyzeRelationships();
            }
            
            // Calculate statistics
            if (CONFIG.SHOW_STATISTICS) {
                this.calculateStatistics();
            }
            
            // Display results
            await this.displayResults();
            
        } catch (error) {
            output.markdown(`❌ **Error during analysis:** ${error.message}`);
            console.error('Full error:', error);
        }
    }

    // Analyze individual table
    async analyzeTable(table, index) {
        output.markdown(`\n## 📊 Analyzing table ${index + 1}/${base.tables.length}: **${table.name}**`);
        
        // Get primary field safely
        let primaryFieldId = null;
        let primaryFieldName = null;
        
        try {
            if (table.fields && table.fields.length > 0) {
                primaryFieldId = table.fields[0].id;
                primaryFieldName = table.fields[0].name;
            }
        } catch (e) {
            console.log(`Could not determine primary field for ${table.name}`);
        }
        
        const tableInfo = {
            id: table.id,
            name: table.name,
            description: table.description || 'No description',
            primaryFieldId: primaryFieldId,
            primaryFieldName: primaryFieldName || 'Unknown',
            fields: [],
            views: [],
            recordCount: 0,
            sampleRecords: []
        };

        // Get record count
        try {
            const query = await table.selectRecordsAsync({ fields: [] });
            tableInfo.recordCount = query.records.length;
            
            // Get sample records if needed
            if (CONFIG.MAX_SAMPLE_RECORDS > 0 && query.records.length > 0) {
                const sampleSize = Math.min(CONFIG.MAX_SAMPLE_RECORDS, query.records.length);
                for (let i = 0; i < sampleSize; i++) {
                    const record = query.records[i];
                    tableInfo.sampleRecords.push({
                        id: record.id,
                        name: record.name || `Record ${i + 1}`
                    });
                }
            }
        } catch (error) {
            console.error(`Could not query records for ${table.name}:`, error);
        }

        // Analyze fields
        if (table.fields && table.fields.length > 0) {
            for (const field of table.fields) {
                try {
                    const fieldInfo = await this.analyzeField(field, table);
                    tableInfo.fields.push(fieldInfo);
                } catch (error) {
                    console.error(`Error analyzing field ${field.name}:`, error);
                }
            }
        }

        // Analyze views
        if (table.views && table.views.length > 0) {
            for (const view of table.views) {
                try {
                    const viewInfo = this.analyzeView(view);
                    tableInfo.views.push(viewInfo);
                } catch (error) {
                    console.error(`Error analyzing view ${view.name}:`, error);
                }
            }
        }

        this.schema.tables.push(tableInfo);
        output.markdown(`✅ Completed analysis of **${table.name}**`);
    }

    // Analyze individual field
    async analyzeField(field, table) {
        if (!field || !field.id || !field.name || !field.type) {
            throw new Error('Field missing required properties');
        }
        
        const fieldInfo = {
            id: field.id,
            name: field.name,
            type: field.type,
            description: field.description || '',
            category: this.getFieldCategory(field.type),
            options: {}
        };

        // Extract field-specific options
        if (field.options) {
            try {
                fieldInfo.options = this.extractFieldOptions(field);
            } catch (error) {
                console.error(`Error extracting options for field ${field.name}:`, error);
            }
        }

        // Check if field is computed
        fieldInfo.isComputed = field.isComputed || false;

        // For relational fields, store additional info
        if (field.type === 'multipleRecordLinks' && field.options) {
            fieldInfo.linkedTableId = field.options.linkedTableId || null;
            fieldInfo.inverseLinkFieldId = field.options.inverseLinkFieldId || null;
            fieldInfo.prefersSingleRecordLink = field.options.prefersSingleRecordLink || false;
        }

        return fieldInfo;
    }

    // Extract field options based on type
    extractFieldOptions(field) {
        const options = {};
        
        if (!field.options) {
            return options;
        }
        
        try {
            switch (field.type) {
                case 'singleSelect':
                case 'multipleSelects':
                    if (field.options.choices) {
                        options.choices = field.options.choices.map(choice => ({
                            id: choice.id || 'unknown',
                            name: choice.name || 'Unnamed',
                            color: choice.color || 'default'
                        }));
                    }
                    break;
                    
                case 'number':
                case 'percent':
                case 'currency':
                    if (field.options.precision !== undefined) {
                        options.precision = field.options.precision;
                    }
                    if (field.type === 'currency' && field.options.symbol) {
                        options.symbol = field.options.symbol;
                    }
                    break;
                    
                case 'date':
                case 'dateTime':
                    if (field.options.dateFormat) {
                        options.dateFormat = field.options.dateFormat;
                    }
                    if (field.type === 'dateTime') {
                        if (field.options.timeFormat) {
                            options.timeFormat = field.options.timeFormat;
                        }
                        if (field.options.timeZone) {
                            options.timeZone = field.options.timeZone;
                        }
                    }
                    break;
                    
                case 'checkbox':
                    if (field.options.icon) {
                        options.icon = field.options.icon;
                    }
                    if (field.options.color) {
                        options.color = field.options.color;
                    }
                    break;
                    
                case 'rating':
                    if (field.options.icon) {
                        options.icon = field.options.icon;
                    }
                    if (field.options.max) {
                        options.max = field.options.max;
                    }
                    if (field.options.color) {
                        options.color = field.options.color;
                    }
                    break;
                    
                case 'lookup':
                    if (field.options.recordLinkFieldId) {
                        options.recordLinkFieldId = field.options.recordLinkFieldId;
                    }
                    if (field.options.fieldIdInLinkedTable) {
                        options.fieldIdInLinkedTable = field.options.fieldIdInLinkedTable;
                    }
                    break;
                    
                case 'rollup':
                    if (field.options.recordLinkFieldId) {
                        options.recordLinkFieldId = field.options.recordLinkFieldId;
                    }
                    if (field.options.fieldIdInLinkedTable) {
                        options.fieldIdInLinkedTable = field.options.fieldIdInLinkedTable;
                    }
                    if (field.options.referencedFieldIds) {
                        options.referencedFieldIds = field.options.referencedFieldIds;
                    }
                    break;
                    
                case 'count':
                    if (field.options.recordLinkFieldId) {
                        options.recordLinkFieldId = field.options.recordLinkFieldId;
                    }
                    break;
                    
                case 'formula':
                    if (field.options.isValid !== undefined) {
                        options.isValid = field.options.isValid;
                    }
                    break;
            }
        } catch (error) {
            console.error(`Error processing options for field ${field.name}:`, error);
        }
        
        return options;
    }

    // Analyze view
    analyzeView(view) {
        if (!view || !view.id || !view.name) {
            throw new Error('View missing required properties');
        }
        
        return {
            id: view.id,
            name: view.name,
            type: view.type || 'Unknown'
        };
    }

    // Get field category
    getFieldCategory(fieldType) {
        for (const [category, types] of Object.entries(FIELD_TYPE_CATEGORIES)) {
            if (types.includes(fieldType)) {
                return category;
            }
        }
        return 'OTHER';
    }

    // Analyze relationships between tables
    analyzeRelationships() {
        output.markdown('\n## 🔗 Analyzing Relationships...');
        
        for (const table of this.schema.tables) {
            for (const field of table.fields) {
                if (field.type === 'multipleRecordLinks' && field.linkedTableId) {
                    const linkedTable = this.schema.tables.find(t => t.id === field.linkedTableId);
                    if (linkedTable) {
                        this.schema.relationships.push({
                            fromTable: table.name,
                            fromTableId: table.id,
                            fromField: field.name,
                            fromFieldId: field.id,
                            toTable: linkedTable.name,
                            toTableId: linkedTable.id,
                            type: 'linkedRecord',
                            prefersSingleLink: field.prefersSingleRecordLink || false
                        });
                    }
                }
            }
        }
        
        output.markdown(`Found **${this.schema.relationships.length}** relationships`);
    }

    // Calculate statistics
    calculateStatistics() {
        try {
            const stats = this.schema.statistics;
            
            // Basic counts
            stats.totalFields = this.schema.tables.reduce((sum, table) => sum + (table.fields ? table.fields.length : 0), 0);
            stats.totalViews = this.schema.tables.reduce((sum, table) => sum + (table.views ? table.views.length : 0), 0);
            stats.totalRecords = this.schema.tables.reduce((sum, table) => sum + (table.recordCount || 0), 0);
            
            // Field type distribution
            stats.fieldTypeDistribution = {};
            for (const table of this.schema.tables) {
                if (table.fields) {
                    for (const field of table.fields) {
                        stats.fieldTypeDistribution[field.type] = (stats.fieldTypeDistribution[field.type] || 0) + 1;
                    }
                }
            }
            
            // Field category distribution
            stats.fieldCategoryDistribution = {};
            for (const table of this.schema.tables) {
                if (table.fields) {
                    for (const field of table.fields) {
                        stats.fieldCategoryDistribution[field.category] = 
                            (stats.fieldCategoryDistribution[field.category] || 0) + 1;
                    }
                }
            }
            
            // Table size distribution
            stats.tableSizes = this.schema.tables.map(t => ({
                name: t.name,
                recordCount: t.recordCount || 0,
                fieldCount: t.fields ? t.fields.length : 0
            })).sort((a, b) => b.recordCount - a.recordCount);
        } catch (error) {
            console.error('Error calculating statistics:', error);
            this.schema.statistics.error = 'Could not calculate all statistics';
        }
    }

    // Display results
    async displayResults() {
        output.clear();
        
        // Header
        output.markdown(`# 📋 Airtable Schema Analysis Report`);
        output.markdown(`**Base:** ${this.schema.baseName}`);
        output.markdown(`**Generated:** ${new Date(this.schema.generatedAt).toLocaleString()}\n`);
        
        // Summary statistics
        if (CONFIG.SHOW_STATISTICS) {
            this.displayStatistics();
        }
        
        // Interactive menu
        const choice = await input.buttonsAsync(
            'What would you like to view?',
            [
                { label: '📊 Tables Overview', value: 'tables' },
                { label: '🔗 Relationships', value: 'relationships' },
                { label: '📈 Detailed Statistics', value: 'stats' },
                { label: '📝 Full Schema', value: 'full' },
                { label: '💾 Export Data', value: 'export' }
            ]
        );
        
        switch (choice) {
            case 'tables':
                await this.displayTablesOverview();
                break;
            case 'relationships':
                this.displayRelationships();
                break;
            case 'stats':
                this.displayDetailedStatistics();
                break;
            case 'full':
                await this.displayFullSchema();
                break;
            case 'export':
                await this.exportSchema();
                break;
        }
        
        // Offer to continue exploring
        const continueChoice = await input.buttonsAsync(
            '\nWould you like to explore more?',
            [
                { label: '🔄 Back to Menu', value: 'menu' },
                { label: '✅ Done', value: 'done' }
            ]
        );
        
        if (continueChoice === 'menu') {
            await this.displayResults();
        }
    }

    // Display summary statistics
    displayStatistics() {
        const stats = this.schema.statistics;
        
        output.markdown('## 📊 Summary Statistics');
        output.markdown(`- **Tables:** ${stats.totalTables || 0}`);
        output.markdown(`- **Fields:** ${stats.totalFields || 0}`);
        output.markdown(`- **Views:** ${stats.totalViews || 0}`);
        output.markdown(`- **Records:** ${(stats.totalRecords || 0).toLocaleString()}`);
        output.markdown(`- **Relationships:** ${this.schema.relationships.length}\n`);
    }

    // Display tables overview
    async displayTablesOverview() {
        output.clear();
        output.markdown('# 📊 Tables Overview\n');
        
        for (const table of this.schema.tables) {
            output.markdown(`## ${table.name}`);
            if (table.description && table.description !== 'No description') {
                output.markdown(`*${table.description}*`);
            }
            
            output.markdown(`- **Records:** ${table.recordCount.toLocaleString()}`);
            output.markdown(`- **Fields:** ${table.fields.length}`);
            output.markdown(`- **Views:** ${table.views.length}`);
            output.markdown(`- **Primary Field:** ${table.primaryFieldName}`);
            
            // Field breakdown by category
            const categoryCount = {};
            for (const field of table.fields) {
                categoryCount[field.category] = (categoryCount[field.category] || 0) + 1;
            }
            
            output.markdown('\n**Field Categories:**');
            for (const [category, count] of Object.entries(categoryCount)) {
                output.markdown(`- ${category}: ${count}`);
            }
            
            output.markdown('---\n');
        }
        
        // Option to view detailed table info
        const tableNames = this.schema.tables.map(t => ({
            label: t.name,
            value: t.id
        }));
        tableNames.push({ label: '← Back', value: 'back' });
        
        const selectedTable = await input.buttonsAsync(
            'Select a table for detailed field information:',
            tableNames
        );
        
        if (selectedTable !== 'back') {
            await this.displayTableDetails(selectedTable);
        }
    }

    // Display detailed table information
    async displayTableDetails(tableId) {
        const table = this.schema.tables.find(t => t.id === tableId);
        if (!table) return;
        
        output.clear();
        output.markdown(`# Table: ${table.name}\n`);
        
        if (table.description && table.description !== 'No description') {
            output.markdown(`*${table.description}*\n`);
        }
        
        if (table.fields && table.fields.length > 0) {
            output.markdown('## Fields\n');
            
            for (const field of table.fields) {
                output.markdown(`### ${field.name}`);
                if (CONFIG.SHOW_FIELD_IDS) {
                    output.markdown(`*ID: ${field.id}*`);
                }
                
                output.markdown(`- **Type:** ${field.type} (${field.category})`);
                
                if (field.description) {
                    output.markdown(`- **Description:** ${field.description}`);
                }
                
                if (field.isComputed) {
                    output.markdown(`- **Computed Field**`);
                }
                
                // Display field options
                if (field.options && Object.keys(field.options).length > 0) {
                    output.markdown('- **Options:**');
                    
                    // Special handling for select fields
                    if (field.options.choices) {
                        output.markdown(`  - Choices (${field.options.choices.length}):`);
                        for (const choice of field.options.choices.slice(0, 10)) {
                            output.markdown(`    - ${choice.name} (${choice.color})`);
                        }
                        if (field.options.choices.length > 10) {
                            output.markdown(`    - ... and ${field.options.choices.length - 10} more`);
                        }
                    } else {
                        for (const [key, value] of Object.entries(field.options)) {
                            output.markdown(`  - ${key}: ${JSON.stringify(value)}`);
                        }
                    }
                }
                
                output.markdown('');
            }
        } else {
            output.markdown('## Fields\n*No fields found in this table*\n');
        }
        
        // Views
        if (table.views && table.views.length > 0) {
            output.markdown('## Views\n');
            for (const view of table.views) {
                output.markdown(`- **${view.name}** (${view.type})`);
            }
        } else {
            output.markdown('## Views\n*No views found in this table*');
        }
    }

    // Display relationships
    displayRelationships() {
        output.clear();
        output.markdown('# 🔗 Table Relationships\n');
        
        if (this.schema.relationships.length === 0) {
            output.markdown('*No linked record relationships found*');
            return;
        }
        
        // Group relationships by table
        const relationshipsByTable = {};
        for (const rel of this.schema.relationships) {
            if (!relationshipsByTable[rel.fromTable]) {
                relationshipsByTable[rel.fromTable] = [];
            }
            relationshipsByTable[rel.fromTable].push(rel);
        }
        
        for (const [tableName, relationships] of Object.entries(relationshipsByTable)) {
            output.markdown(`## ${tableName}`);
            
            for (const rel of relationships) {
                const linkType = rel.prefersSingleLink ? 'One-to-One/Many' : 'Many-to-Many';
                output.markdown(`- **${rel.fromField}** → **${rel.toTable}** (${linkType})`);
            }
            
            output.markdown('');
        }
    }

    // Display detailed statistics
    displayDetailedStatistics() {
        output.clear();
        output.markdown('# 📈 Detailed Statistics\n');
        
        const stats = this.schema.statistics;
        
        if (stats.error) {
            output.markdown(`⚠️ Note: ${stats.error}\n`);
        }
        
        // Field type distribution
        if (stats.fieldTypeDistribution && Object.keys(stats.fieldTypeDistribution).length > 0) {
            output.markdown('## Field Type Distribution');
            const sortedTypes = Object.entries(stats.fieldTypeDistribution)
                .sort((a, b) => b[1] - a[1]);
            
            for (const [type, count] of sortedTypes) {
                const percentage = stats.totalFields > 0 ? ((count / stats.totalFields) * 100).toFixed(1) : '0';
                output.markdown(`- **${type}**: ${count} (${percentage}%)`);
            }
        }
        
        // Field category distribution
        if (stats.fieldCategoryDistribution && Object.keys(stats.fieldCategoryDistribution).length > 0) {
            output.markdown('\n## Field Category Distribution');
            const sortedCategories = Object.entries(stats.fieldCategoryDistribution)
                .sort((a, b) => b[1] - a[1]);
            
            for (const [category, count] of sortedCategories) {
                const percentage = stats.totalFields > 0 ? ((count / stats.totalFields) * 100).toFixed(1) : '0';
                output.markdown(`- **${category}**: ${count} (${percentage}%)`);
            }
        }
        
        // Table sizes
        if (stats.tableSizes && stats.tableSizes.length > 0) {
            output.markdown('\n## Table Sizes');
            output.markdown('| Table | Records | Fields |');
            output.markdown('|-------|---------|--------|');
            for (const table of stats.tableSizes) {
                output.markdown(`| ${table.name} | ${table.recordCount.toLocaleString()} | ${table.fieldCount} |`);
            }
        }
    }

    // Display full schema
    async displayFullSchema() {
        output.clear();
        output.markdown('# 📝 Full Schema Export\n');
        
        const formattedSchema = JSON.stringify(this.schema, null, 2);
        
        output.markdown('```json');
        output.text(formattedSchema.substring(0, 10000));
        if (formattedSchema.length > 10000) {
            output.text('\n... (truncated - use export function for full schema)');
        }
        output.markdown('```');
    }

    // Export schema
    async exportSchema() {
        output.clear();
        output.markdown('# 💾 Export Schema\n');
        
        const format = await input.buttonsAsync(
            'Select export format:',
            [
                { label: '📄 JSON', value: 'json' },
                { label: '📝 Markdown', value: 'markdown' },
                { label: '📊 CSV', value: 'csv' }
            ]
        );
        
        let exportData = '';
        
        switch (format) {
            case 'json':
                exportData = JSON.stringify(this.schema, null, 2);
                break;
            case 'markdown':
                exportData = this.generateMarkdownExport();
                break;
            case 'csv':
                exportData = this.generateCSVExport();
                break;
        }
        
        output.markdown(`## Export Generated (${format.toUpperCase()})\n`);
        output.markdown('Copy the data below:\n');
        output.markdown('```');
        output.text(exportData.substring(0, 50000));
        if (exportData.length > 50000) {
            output.text('\n... (truncated)');
        }
        output.markdown('```');
    }

    // Generate Markdown export
    generateMarkdownExport() {
        let md = `# Airtable Base Schema: ${this.schema.baseName}\n\n`;
        md += `Generated: ${new Date(this.schema.generatedAt).toLocaleString()}\n\n`;
        
        // Summary
        md += '## Summary\n\n';
        md += `- Tables: ${this.schema.statistics.totalTables}\n`;
        md += `- Fields: ${this.schema.statistics.totalFields}\n`;
        md += `- Records: ${this.schema.statistics.totalRecords}\n\n`;
        
        // Tables
        md += '## Tables\n\n';
        for (const table of this.schema.tables) {
            md += `### ${table.name}\n\n`;
            if (table.description && table.description !== 'No description') {
                md += `> ${table.description}\n\n`;
            }
            
            md += '#### Fields\n\n';
            md += '| Field | Type | Category | Description |\n';
            md += '|-------|------|----------|-------------|\n';
            
            for (const field of table.fields) {
                md += `| ${field.name} | ${field.type} | ${field.category} | ${field.description || '-'} |\n`;
            }
            
            md += '\n';
        }
        
        // Relationships
        if (this.schema.relationships.length > 0) {
            md += '## Relationships\n\n';
            md += '| From Table | From Field | To Table | Type |\n';
            md += '|------------|------------|----------|------|\n';
            
            for (const rel of this.schema.relationships) {
                const type = rel.prefersSingleLink ? 'One-to-One/Many' : 'Many-to-Many';
                md += `| ${rel.fromTable} | ${rel.fromField} | ${rel.toTable} | ${type} |\n`;
            }
        }
        
        return md;
    }

    // Generate CSV export
    generateCSVExport() {
        let csv = 'Table,Field,Type,Category,Description,Options\n';
        
        for (const table of this.schema.tables) {
            for (const field of table.fields) {
                const options = JSON.stringify(field.options).replace(/"/g, '""');
                csv += `"${table.name}","${field.name}","${field.type}","${field.category}","${field.description || ''}","${options}"\n`;
            }
        }
        
        return csv;
    }
}

// Main execution function
async function main() {
    try {
        output.clear();
        
        output.markdown('# 🚀 Airtable Advanced Schema Analyzer');
        output.markdown(`Base: **${base.name}** (${base.tables.length} tables)\n`);
        
        const startAnalysis = await input.buttonsAsync(
            'Ready to analyze your base?',
            [
                { label: '▶️ Start Analysis', value: 'start' },
                { label: '⚙️ Configure Settings', value: 'settings' },
                { label: '❓ Help', value: 'help' }
            ]
        );
        
        if (startAnalysis === 'settings') {
            await configureSettings();
        } else if (startAnalysis === 'help') {
            await showHelp();
        } else if (startAnalysis === 'start') {
            const analyzer = new AirtableSchemaAnalyzer();
            await analyzer.analyze();
        }
    } catch (error) {
        output.markdown(`\n❌ **Error:** ${error.message}`);
        console.error('Error:', error);
    }
}

// Configure settings
async function configureSettings() {
    output.clear();
    output.markdown('# ⚙️ Configuration Settings\n');
    
    const sampleRecordsInput = await input.textAsync(
        'Maximum sample records per table (0-10):',
        { placeholder: CONFIG.MAX_SAMPLE_RECORDS.toString() }
    );
    
    CONFIG.MAX_SAMPLE_RECORDS = parseInt(sampleRecordsInput) || CONFIG.MAX_SAMPLE_RECORDS;
    
    CONFIG.SHOW_FIELD_IDS = await input.buttonsAsync(
        'Show field IDs?',
        [
            { label: 'Yes', value: true },
            { label: 'No', value: false }
        ]
    );
    
    CONFIG.SHOW_RELATIONSHIPS = await input.buttonsAsync(
        'Analyze table relationships?',
        [
            { label: 'Yes', value: true },
            { label: 'No', value: false }
        ]
    );
    
    CONFIG.SHOW_STATISTICS = await input.buttonsAsync(
        'Calculate statistics?',
        [
            { label: 'Yes', value: true },
            { label: 'No', value: false }
        ]
    );
    
    output.markdown('\n✅ Settings updated!');
    
    // Return to main menu
    await main();
}

// Show help
async function showHelp() {
    output.clear();
    output.markdown(`# ❓ Airtable Schema Analyzer Help

## What does this tool do?

This advanced schema analyzer provides a comprehensive analysis of your Airtable base structure, including:

- **Table Analysis**: All tables with descriptions, record counts, and primary fields
- **Field Analysis**: Complete field information including types, options, and configurations
- **View Analysis**: All views in each table
- **Relationship Mapping**: Visual representation of linked record relationships
- **Statistics**: Distribution of field types, table sizes, and more
- **Export Options**: Export your schema in JSON, Markdown, or CSV format

## Features:

1. **Interactive Navigation**: Browse through your schema with an intuitive menu system
2. **Detailed Field Options**: See all configuration options for select fields, formulas, lookups, etc.
3. **Relationship Visualization**: Understand how your tables are connected
4. **Multiple Export Formats**: Choose the format that works best for your documentation needs
5. **Configurable Settings**: Customize the analysis to your needs

## How to use:

1. Click "Start Analysis" to begin
2. Wait for the analysis to complete (larger bases may take longer)
3. Use the interactive menu to explore different aspects of your schema
4. Export the results in your preferred format

## Tips:

- For large bases, consider reducing the sample record count in settings
- Use the export feature to create documentation for your team
- The relationship view helps identify your data model structure
- Field statistics can help optimize your base design

Press any button to return to the main menu.`);
    
    await input.buttonsAsync('', [{ label: '← Back to Start', value: 'back' }]);
    await main();
}

// Start the analyzer
output.clear();
output.markdown('# 🚀 Airtable Schema Analyzer');
output.markdown('Initializing...\n');

// Run main function
await main();
