#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Improved JSON to Terraform converter that handles variables properly
 */
class ImprovedJsonToTerraformConverter {
  constructor() {
    this.outputDir = './terraform-improved';
    this.allVariables = new Map();
  }

  /**
   * Convert all JSON files and consolidate variables
   */
  async convertAllServices() {
    const files = fs.readdirSync('.')
      .filter(file => file.endsWith('.json'))
      .sort();
    
    // Create output directory
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir);
    }
    
    console.log('Converting JSON schemas to Terraform files...\n');
    
    // First pass: collect all variables
    for (const file of files) {
      const jsonData = fs.readFileSync(file, 'utf8');
      const serviceConfig = JSON.parse(jsonData);
      this.collectVariables(serviceConfig);
    }
    
    // Generate consolidated variables file
    this.generateVariablesFile();
    
    // Generate provider configuration
    this.generateProvidersFile();
    
    // Second pass: generate resources without variable declarations
    for (const file of files) {
      try {
        const jsonData = fs.readFileSync(file, 'utf8');
        const terraformCode = this.convertServiceResourceOnly(jsonData);
        
        const outputFile = file.replace('.json', '.tf');
        const outputPath = path.join(this.outputDir, outputFile);
        
        fs.writeFileSync(outputPath, terraformCode);
        console.log(`✅ Converted ${file} -> ${outputFile}`);
      } catch (error) {
        console.error(`❌ Error converting ${file}:`, error.message);
      }
    }
    
    // Generate example terraform.tfvars
    this.generateExampleTfvars();
    
    console.log(`\n🎉 Conversion complete! Files saved to ${this.outputDir}/`);
    console.log('\nGenerated files:');
    console.log('- providers.tf (AWS provider configuration)');
    console.log('- variables.tf (All variable definitions)');
    console.log('- terraform.tfvars.example (Example values)');
    console.log('- *.tf (Individual service resources)');
    console.log('\nTo use these files:');
    console.log(`1. cd ${this.outputDir}`);
    console.log('2. cp terraform.tfvars.example terraform.tfvars');
    console.log('3. Edit terraform.tfvars with your values');
    console.log('4. terraform init');
    console.log('5. terraform plan');
    console.log('6. terraform apply');
  }

  /**
   * Collect variables from all services
   */
  collectVariables(serviceConfig) {
    // Common variables
    this.allVariables.set('environment', {
      description: 'Environment name (dev, staging, prod)',
      type: 'string',
      default: 'dev'
    });
    
    this.allVariables.set('project_name', {
      description: 'Project name for resource naming',
      type: 'string'
    });
    
    // Service-specific variables
    switch (serviceConfig.id) {
      case 'ec2':
        this.allVariables.set('ami_id', {
          description: 'AMI ID for EC2 instance',
          type: 'string'
        });
        this.allVariables.set('instance_type', {
          description: 'EC2 instance type',
          type: 'string',
          default: 't3.micro'
        });
        this.allVariables.set('ec2_key_name', {
          description: 'EC2 Key Pair name',
          type: 'string',
          default: null
        });
        this.allVariables.set('subnet_ids', {
          description: 'List of subnet IDs',
          type: 'list(string)',
          default: []
        });
        this.allVariables.set('security_group_ids', {
          description: 'List of security group IDs',
          type: 'list(string)',
          default: []
        });
        break;
      
      case 's3':
        this.allVariables.set('s3_bucket_prefix', {
          description: 'Prefix for S3 bucket names',
          type: 'string'
        });
        break;
      
      case 'rds':
        this.allVariables.set('db_instance_class', {
          description: 'RDS instance class',
          type: 'string',
          default: 'db.t3.micro'
        });
        this.allVariables.set('db_username', {
          description: 'Database master username',
          type: 'string',
          default: 'admin'
        });
        this.allVariables.set('db_password', {
          description: 'Database master password',
          type: 'string',
          sensitive: true
        });
        break;
      
      case 'lambda':
        this.allVariables.set('lambda_runtime', {
          description: 'Lambda runtime',
          type: 'string',
          default: 'nodejs18.x'
        });
        break;
      
      case 'vpc':
        this.allVariables.set('vpc_cidr', {
          description: 'VPC CIDR block',
          type: 'string',
          default: '10.0.0.0/16'
        });
        break;
    }
  }

  /**
   * Generate variables.tf file
   */
  generateVariablesFile() {
    let content = '# Variables for all AWS resources\n\n';
    
    for (const [name, config] of this.allVariables) {
      content += `variable "${name}" {\n`;
      content += `  description = "${config.description}"\n`;
      content += `  type        = ${config.type}\n`;
      if (config.default !== undefined) {
        if (config.default === null) {
          content += '  default     = null\n';
        } else if (typeof config.default === 'string') {
          content += `  default     = "${config.default}"\n`;
        } else if (Array.isArray(config.default)) {
          content += `  default     = []\n`;
        } else {
          content += `  default     = ${config.default}\n`;
        }
      }
      if (config.sensitive) {
        content += '  sensitive   = true\n';
      }
      content += '}\n\n';
    }
    
    fs.writeFileSync(path.join(this.outputDir, 'variables.tf'), content);
    console.log('✅ Generated variables.tf');
  }

  /**
   * Generate providers.tf file
   */
  generateProvidersFile() {
    const content = `# Terraform and AWS provider configuration

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment   = var.environment
      Project       = var.project_name
      ManagedBy     = "terraform"
      CreatedBy     = "codeblocks-converter"
    }
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}
`;
    
    fs.writeFileSync(path.join(this.outputDir, 'providers.tf'), content);
    console.log('✅ Generated providers.tf');
  }

  /**
   * Generate terraform.tfvars.example
   */
  generateExampleTfvars() {
    let content = '# Example Terraform variables - copy to terraform.tfvars and customize\n\n';
    content += '# Required variables (no defaults provided)\n';
    
    const required = [];
    const optional = [];
    
    for (const [name, config] of this.allVariables) {
      if (config.default === undefined) {
        required.push([name, config]);
      } else {
        optional.push([name, config]);
      }
    }
    
    for (const [name, config] of required) {
      if (config.type === 'string') {
        content += `${name} = "your-${name}"\n`;
      } else if (config.type === 'list(string)') {
        content += `${name} = ["example-1", "example-2"]\n`;
      } else {
        content += `${name} = # ${config.description}\n`;
      }
    }
    
    content += '\n# Optional variables (uncomment and customize as needed)\n';
    for (const [name, config] of optional) {
      if (config.default === null) {
        content += `# ${name} = null\n`;
      } else if (typeof config.default === 'string') {
        content += `# ${name} = "${config.default}"\n`;
      } else if (Array.isArray(config.default)) {
        content += `# ${name} = []\n`;
      } else {
        content += `# ${name} = ${config.default}\n`;
      }
    }
    
    fs.writeFileSync(path.join(this.outputDir, 'terraform.tfvars.example'), content);
    console.log('✅ Generated terraform.tfvars.example');
  }

  /**
   * Convert service to resource only (no variables)
   */
  convertServiceResourceOnly(jsonData) {
    const serviceConfig = JSON.parse(jsonData);
    const terraformType = serviceConfig.terraformType;
    const resourceName = this.sanitizeName(serviceConfig.id);
    
    let hcl = `# ${serviceConfig.name} - ${serviceConfig.description}\n`;
    hcl += `resource "${terraformType}" "${resourceName}" {\n`;
    
    // Generate resource configuration based on service type
    const config = this.generateResourceConfig(serviceConfig);
    
    for (const [key, value] of Object.entries(config)) {
      hcl += this.formatAttribute(key, value, 2);
    }
    
    hcl += '}\n\n';
    
    // Add outputs for important resource attributes
    const outputs = this.generateOutputs(serviceConfig, resourceName, terraformType);
    if (outputs) {
      hcl += outputs;
    }
    
    return hcl;
  }

  /**
   * Generate resource configuration for each service
   */
  generateResourceConfig(serviceConfig) {
    switch (serviceConfig.id) {
      case 'ec2':
        return {
          ami: 'var.ami_id',
          instance_type: 'var.instance_type',
          key_name: 'var.ec2_key_name',
          vpc_security_group_ids: 'var.security_group_ids',
          subnet_id: 'length(var.subnet_ids) > 0 ? var.subnet_ids[0] : null',
          associate_public_ip_address: false,
          tags: {
            Name: '"${var.project_name}-${var.environment}-ec2"'
          }
        };
      
      case 's3':
        return {
          bucket: '"${var.s3_bucket_prefix}-${var.environment}-${random_string.bucket_suffix.result}"',
          tags: {
            Name: '"${var.project_name}-${var.environment}-s3"'
          }
        };
      
      case 'rds':
        return {
          identifier: '"${var.project_name}-${var.environment}-db"',
          engine: '"mysql"',
          engine_version: '"8.0"',
          instance_class: 'var.db_instance_class',
          allocated_storage: 20,
          db_name: '"${replace(var.project_name, "-", "_")}_${var.environment}"',
          username: 'var.db_username',
          password: 'var.db_password',
          vpc_security_group_ids: 'var.security_group_ids',
          skip_final_snapshot: true,
          tags: {
            Name: '"${var.project_name}-${var.environment}-rds"'
          }
        };
      
      case 'lambda':
        return {
          function_name: '"${var.project_name}-${var.environment}-lambda"',
          runtime: 'var.lambda_runtime',
          handler: '"index.handler"',
          filename: '"lambda_function.zip"',
          source_code_hash: 'filebase64sha256("lambda_function.zip")',
          memory_size: 128,
          timeout: 30,
          role: 'aws_iam_role.lambda_execution_role.arn',
          tags: {
            Name: '"${var.project_name}-${var.environment}-lambda"'
          }
        };
      
      case 'dynamodb':
        return {
          name: '"${var.project_name}-${var.environment}-table"',
          billing_mode: '"PAY_PER_REQUEST"',
          hash_key: '"id"',
          attribute: [
            {
              name: '"id"',
              type: '"S"'
            }
          ],
          tags: {
            Name: '"${var.project_name}-${var.environment}-dynamodb"'
          }
        };
      
      case 'vpc':
        return {
          cidr_block: 'var.vpc_cidr',
          enable_dns_hostnames: true,
          enable_dns_support: true,
          tags: {
            Name: '"${var.project_name}-${var.environment}-vpc"'
          }
        };
      
      default:
        return {
          tags: {
            Name: '"${var.project_name}-${var.environment}-${serviceConfig.id}"'
          }
        };
    }
  }

  /**
   * Generate outputs for resources
   */
  generateOutputs(serviceConfig, resourceName, terraformType) {
    let outputs = '';
    
    switch (serviceConfig.id) {
      case 'ec2':
        outputs += `output "${resourceName}_id" {\n`;
        outputs += `  description = "ID of the EC2 instance"\n`;
        outputs += `  value       = ${terraformType}.${resourceName}.id\n`;
        outputs += '}\n\n';
        outputs += `output "${resourceName}_public_ip" {\n`;
        outputs += `  description = "Public IP of the EC2 instance"\n`;
        outputs += `  value       = ${terraformType}.${resourceName}.public_ip\n`;
        outputs += '}\n\n';
        break;
      
      case 's3':
        outputs += `output "${resourceName}_bucket_name" {\n`;
        outputs += `  description = "Name of the S3 bucket"\n`;
        outputs += `  value       = ${terraformType}.${resourceName}.id\n`;
        outputs += '}\n\n';
        outputs += `output "${resourceName}_arn" {\n`;
        outputs += `  description = "ARN of the S3 bucket"\n`;
        outputs += `  value       = ${terraformType}.${resourceName}.arn\n`;
        outputs += '}\n\n';
        break;
      
      case 'rds':
        outputs += `output "${resourceName}_endpoint" {\n`;
        outputs += `  description = "RDS instance endpoint"\n`;
        outputs += `  value       = ${terraformType}.${resourceName}.endpoint\n`;
        outputs += '}\n\n';
        break;
      
      case 'lambda':
        outputs += `output "${resourceName}_arn" {\n`;
        outputs += `  description = "ARN of the Lambda function"\n`;
        outputs += `  value       = ${terraformType}.${resourceName}.arn\n`;
        outputs += '}\n\n';
        break;
    }
    
    return outputs;
  }

  /**
   * Format Terraform attributes
   */
  formatAttribute(key, value, indent = 0) {
    const spaces = ' '.repeat(indent);
    
    if (value === null) {
      return `${spaces}${key} = null\n`;
    }
    
    if (typeof value === 'string') {
      // Handle Terraform expressions (don't quote them)
      if (value.startsWith('var.') || 
          value.startsWith('aws_') || 
          value.startsWith('data.') ||
          value.startsWith('local.') ||
          value.startsWith('random_') ||
          value.includes('${') ||
          value.startsWith('length(') ||
          value.startsWith('filebase64sha256(')) {
        return `${spaces}${key} = ${value}\n`;
      }
      return `${spaces}${key} = ${value}\n`;
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
      return `${spaces}${key} = ${value}\n`;
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return `${spaces}${key} = []\n`;
      }
      
      let result = `${spaces}${key} = [\n`;
      for (const item of value) {
        if (typeof item === 'object') {
          result += `${spaces}  {\n`;
          for (const [subKey, subValue] of Object.entries(item)) {
            result += this.formatAttribute(subKey, subValue, indent + 4);
          }
          result += `${spaces}  },\n`;
        } else {
          result += `${spaces}  ${item},\n`;
        }
      }
      result += `${spaces}]\n`;
      return result;
    }
    
    if (typeof value === 'object') {
      let result = `${spaces}${key} {\n`;
      for (const [subKey, subValue] of Object.entries(value)) {
        result += this.formatAttribute(subKey, subValue, indent + 2);
      }
      result += `${spaces}}\n`;
      return result;
    }
    
    return `${spaces}${key} = ${value}\n`;
  }

  /**
   * Sanitize names for Terraform
   */
  sanitizeName(name) {
    return name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  }
}

// CLI interface
if (require.main === module) {
  const converter = new ImprovedJsonToTerraformConverter();
  converter.convertAllServices();
}

module.exports = ImprovedJsonToTerraformConverter;