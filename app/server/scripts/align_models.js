/**
 * Model Alignment Script
 * 
 * This script ensures all Sequelize models are properly aligned with 
 * the snake_case convention used in the database tables.
 * 
 * It applies the modelEnhancer utilities to standardize model definitions.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const modelsDir = path.join(__dirname, '../src/models');
const utilsTemplate = `
const { Model, DataTypes } = require('sequelize');
const { enhanceModelOptions, standardizeAttributes } = require('../utils/modelEnhancer');
`;

// Skip these files
const skipFiles = ['index.js', 'documentation.js'];

// Map of camelCase to snake_case field patterns
const fieldPatterns = [
  // Common patterns
  { from: 'orderId', to: 'order_id' },
  { from: 'userId', to: 'user_id' },
  { from: 'roleId', to: 'role_id' },
  { from: 'permissionId', to: 'permission_id' },
  { from: 'firstName', to: 'first_name' },
  { from: 'lastName', to: 'last_name' },
  { from: 'isActive', to: 'is_active' },
  { from: 'isVerified', to: 'is_verified' },
  { from: 'createdAt', to: 'created_at' },
  { from: 'updatedAt', to: 'updated_at' },
  { from: 'deletedAt', to: 'deleted_at' },
  { from: 'lastLogin', to: 'last_login' },
  { from: 'resetPasswordToken', to: 'reset_password_token' },
  { from: 'resetPasswordExpires', to: 'reset_password_expires' },
  { from: 'verificationToken', to: 'verification_token' },
  { from: 'verificationExpires', to: 'verification_expires' },
  { from: 'loginAttempts', to: 'login_attempts' },
  { from: 'lockUntil', to: 'lock_until' },
  { from: 'expiresAt', to: 'expires_at' },
  
  // Product-related
  { from: 'productId', to: 'product_id' },
  { from: 'variantId', to: 'variant_id' },
  { from: 'printifyProductId', to: 'printify_product_id' },
  { from: 'displayOrder', to: 'display_order' },
  { from: 'isFeatured', to: 'is_featured' },
  { from: 'isBestSeller', to: 'is_best_seller' },
  { from: 'createdBy', to: 'created_by' },
  { from: 'updatedBy', to: 'updated_by' },
  
  // Order-related
  { from: 'orderDate', to: 'order_date' },
  { from: 'shippingAddress', to: 'shipping_address' },
  { from: 'billingAddress', to: 'billing_address' },
  { from: 'paymentStatus', to: 'payment_status' },
  { from: 'orderStatus', to: 'order_status' },
  { from: 'unitPrice', to: 'unit_price' },
  { from: 'variantTitle', to: 'variant_title' },
  { from: 'imageUrl', to: 'image_url' },
  
  // Other fields
  { from: 'filePath', to: 'file_path' },
  { from: 'isPublic', to: 'is_public' },
  { from: 'entityType', to: 'entity_type' },
  { from: 'entityId', to: 'entity_id' },
  { from: 'actionType', to: 'action_type' },
  { from: 'cacheKey', to: 'cache_key' }
];

// Function to convert camelCase tableName to snake_case
const getSnakeTableName = (modelName) => {
  return modelName
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase();
};

// Function to update model files
const updateModelFile = (filePath) => {
  try {
    console.log(`Processing ${filePath}...`);
    
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if the file already uses enhanceModelOptions
    if (content.includes('enhanceModelOptions')) {
      console.log(`  Already updated: ${filePath}`);
      return;
    }
    
    // Add import for enhancer utils if needed
    if (!content.includes('enhanceModelOptions')) {
      // Remove any existing imports for Model and DataTypes
      content = content.replace(/const\s*{\s*Model(?:,\s*DataTypes)?\s*}\s*=\s*require\(['"]sequelize['"]\);?/g, '');
      
      // Add our template at the top of the file
      content = utilsTemplate + content;
    }
    
    // Extract the modelName if possible
    const modelNameMatch = content.match(/modelName:\s*['"]([^'"]+)['"]/);
    const modelName = modelNameMatch ? modelNameMatch[1] : null;
    
    // Update foreignKey references in associations
    fieldPatterns.forEach(pattern => {
      const foreignKeyRegex = new RegExp(`foreignKey:\\s*['"]${pattern.from}['"]`, 'g');
      content = content.replace(foreignKeyRegex, `foreignKey: '${pattern.to}'`);
    });
    
    // Update model.init with new pattern:
    // 1. Find the model.init section
    const initPattern = /(\w+)\.init\(\{([^}]*)\},\s*\{([^}]*)\}\);/s;
    const initMatch = content.match(initPattern);
    
    if (initMatch) {
      const [fullMatch, className, attributes, options] = initMatch;
      
      // Convert attributes to snake_case
      let updatedAttributes = attributes;
      fieldPatterns.forEach(pattern => {
        const attrRegex = new RegExp(`\\b${pattern.from}\\s*:\\s*\\{`, 'g');
        updatedAttributes = updatedAttributes.replace(attrRegex, `${pattern.to}: {`);
      });
      
      // Fix references in foreign keys
      updatedAttributes = updatedAttributes.replace(/model:\s*['"]([^'"]+)['"]/g, (match, tableName) => {
        // Convert PascalCase or camelCase table name to snake_case
        const snakeTableName = getSnakeTableName(tableName);
        return `model: '${snakeTableName}'`;
      });
      
      // Parse table name from options
      const tableNameMatch = options.match(/tableName:\s*['"]([^'"]+)['"]/);
      let tableName = tableNameMatch ? tableNameMatch[1] : null;
      
      // If no tableName is specified, generate from modelName
      if (!tableName && modelName) {
        tableName = getSnakeTableName(modelName);
      }
      
      // Create the new structure with standardizeAttributes and enhanceModelOptions
      const newInit = `
    const attributes = standardizeAttributes({${updatedAttributes}
    });

    const options = enhanceModelOptions({${options}
    });

    ${className}.init(attributes, options);`;
      
      content = content.replace(initPattern, newInit);
    }
    
    // Write updated content back to file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  Updated: ${filePath}`);
  } catch (error) {
    console.error(`  Error updating ${filePath}:`, error);
  }
};

// Main function to process all model files
const processModelFiles = () => {
  console.log('Starting model alignment process...');
  
  // Get all model files
  const files = fs.readdirSync(modelsDir)
    .filter(file => 
      file.endsWith('.js') && 
      !skipFiles.includes(file)
    );
  
  // Process each file
  files.forEach(file => {
    const filePath = path.join(modelsDir, file);
    updateModelFile(filePath);
  });
  
  console.log('Model alignment completed!');
};

// Run the process
processModelFiles();

// Optional: Run a command to test the models with sequelize-cli
const runModelTest = () => {
  console.log('Testing models with sequelize-cli...');
  
  exec('npx sequelize-cli db:migrate:status', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
    if (error) {
      console.error('Error testing models:', error);
      return;
    }
    
    console.log('Model test results:');
    console.log(stdout);
    
    if (stderr) {
      console.error('Stderr:', stderr);
    }
  });
};

// Uncomment to run the model test
// runModelTest();
