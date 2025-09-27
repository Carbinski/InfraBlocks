export interface ServiceDefinition {
  id: string
  name: string
  icon: string
  category: string
  description: string
  terraformType: string
  defaultConfig: Record<string, any>
  configSchema: Record<string, ConfigField>
}

export interface ConfigField {
  type: "string" | "number" | "boolean" | "select" | "multiselect"
  label: string
  description?: string
  options?: string[]
  default?: any
  required?: boolean
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export const serviceDefinitions: Record<string, Record<string, ServiceDefinition>> = {
  aws: {
    ec2: {
      id: "ec2",
      name: "EC2",
      icon: "/aws/Arch_Amazon-EC2_64.svg",
      category: "Compute",
      description: "Virtual servers in the cloud",
      terraformType: "aws_instance",
      defaultConfig: {
        instance_type: "t3.micro",
        ami: "ami-0abcdef1234567890",
      },
      configSchema: {
        instance_type: {
          type: "select",
          label: "Instance Type",
          options: ["t3.micro", "t3.small", "t3.medium", "t3.large", "t3.xlarge"],
          default: "t3.micro",
          required: true,
        },
        ami: {
          type: "string",
          label: "AMI ID",
          default: "ami-0abcdef1234567890",
          required: true,
        },
        key_name: {
          type: "string",
          label: "Key Pair Name",
          description: "EC2 Key Pair for SSH access",
        },
        vpc_security_group_ids: {
          type: "multiselect",
          label: "Security Groups",
          options: [],
        },
      },
    },
    s3: {
      id: "s3",
      name: "S3",
      icon: "/aws/Arch_Amazon-S3-on-Outposts_64.svg",
      category: "Storage",
      description: "Object storage service",
      terraformType: "aws_s3_bucket",
      defaultConfig: {
        versioning: "Disabled",
        public_access: "Blocked",
      },
      configSchema: {
        bucket_name: {
          type: "string",
          label: "Bucket Name",
          required: true,
          validation: {
            pattern: "^[a-z0-9.-]*$",
          },
        },
        versioning: {
          type: "select",
          label: "Versioning",
          options: ["Enabled", "Disabled"],
          default: "Disabled",
        },
        public_access: {
          type: "select",
          label: "Public Access",
          options: ["Blocked", "Allowed"],
          default: "Blocked",
        },
      },
    },
    rds: {
      id: "rds",
      name: "RDS",
      icon: "/aws/Arch_Amazon-RDS_64.svg",
      category: "Database",
      description: "Managed relational database",
      terraformType: "aws_db_instance",
      defaultConfig: {
        engine: "mysql",
        instance_class: "db.t3.micro",
        allocated_storage: 20,
      },
      configSchema: {
        engine: {
          type: "select",
          label: "Database Engine",
          options: ["mysql", "postgres", "mariadb", "oracle-ee", "sqlserver-ex"],
          default: "mysql",
          required: true,
        },
        instance_class: {
          type: "select",
          label: "Instance Class",
          options: ["db.t3.micro", "db.t3.small", "db.t3.medium", "db.t3.large"],
          default: "db.t3.micro",
          required: true,
        },
        allocated_storage: {
          type: "number",
          label: "Storage (GB)",
          default: 20,
          validation: {
            min: 20,
            max: 65536,
          },
        },
        db_name: {
          type: "string",
          label: "Database Name",
          required: true,
        },
      },
    },
    lambda: {
      id: "lambda",
      name: "Lambda",
      icon: "/aws/Arch_AWS-Lambda_64.svg",
      category: "Compute",
      description: "Serverless compute service",
      terraformType: "aws_lambda_function",
      defaultConfig: {
        runtime: "nodejs18.x",
        memory_size: 128,
        timeout: 30,
      },
      configSchema: {
        function_name: {
          type: "string",
          label: "Function Name",
          required: true,
        },
        runtime: {
          type: "select",
          label: "Runtime",
          options: ["nodejs18.x", "nodejs16.x", "python3.9", "python3.8", "java11", "dotnet6"],
          default: "nodejs18.x",
          required: true,
        },
        memory_size: {
          type: "number",
          label: "Memory (MB)",
          default: 128,
          validation: {
            min: 128,
            max: 10240,
          },
        },
        timeout: {
          type: "number",
          label: "Timeout (seconds)",
          default: 30,
          validation: {
            min: 1,
            max: 900,
          },
        },
      },
    },
    dynamodb: {
      id: "dynamodb",
      name: "DynamoDB",
      icon: "/aws/Arch_Amazon-DynamoDB_64.svg",
      category: "Database",
      description: "NoSQL database service",
      terraformType: "aws_dynamodb_table",
      defaultConfig: {
        billing_mode: "PAY_PER_REQUEST",
        hash_key: "id",
      },
      configSchema: {
        table_name: {
          type: "string",
          label: "Table Name",
          required: true,
        },
        billing_mode: {
          type: "select",
          label: "Billing Mode",
          options: ["PAY_PER_REQUEST", "PROVISIONED"],
          default: "PAY_PER_REQUEST",
          required: true,
        },
        hash_key: {
          type: "string",
          label: "Hash Key",
          default: "id",
          required: true,
        },
      },
    },
    cognito: {
      id: "cognito",
      name: "Cognito",
      icon: "/aws/Arch_Amazon-Cognito_64.svg",
      category: "Security",
      description: "User authentication and management",
      terraformType: "aws_cognito_user_pool",
      defaultConfig: {
        name: "user-pool",
      },
      configSchema: {
        name: {
          type: "string",
          label: "User Pool Name",
          required: true,
        },
        alias_attributes: {
          type: "multiselect",
          label: "Alias Attributes",
          options: ["email", "phone_number", "preferred_username"],
        },
      },
    },
    cloudwatch: {
      id: "cloudwatch",
      name: "CloudWatch",
      icon: "/aws/Arch_Amazon-CloudWatch_64.svg",
      category: "Monitoring",
      description: "Monitoring and observability service",
      terraformType: "aws_cloudwatch_log_group",
      defaultConfig: {
        retention_in_days: 14,
      },
      configSchema: {
        name: {
          type: "string",
          label: "Log Group Name",
          required: true,
        },
        retention_in_days: {
          type: "number",
          label: "Retention (days)",
          default: 14,
          validation: {
            min: 1,
            max: 3653,
          },
        },
      },
    },
    api_gateway: {
      id: "api_gateway",
      name: "API Gateway",
      icon: "/aws/Arch_Amazon-API-Gateway_64.svg",
      category: "Network",
      description: "API management service",
      terraformType: "aws_api_gateway_rest_api",
      defaultConfig: {
        name: "api",
        description: "REST API",
      },
      configSchema: {
        name: {
          type: "string",
          label: "API Name",
          required: true,
        },
        description: {
          type: "string",
          label: "Description",
          default: "REST API",
        },
      },
    },
    fargate: {
      id: "fargate",
      name: "Fargate",
      icon: "/aws/Arch_AWS-Fargate_64.svg",
      category: "Compute",
      description: "Serverless container platform",
      terraformType: "aws_ecs_service",
      defaultConfig: {
        launch_type: "FARGATE",
        desired_count: 1,
      },
      configSchema: {
        name: {
          type: "string",
          label: "Service Name",
          required: true,
        },
        launch_type: {
          type: "select",
          label: "Launch Type",
          options: ["FARGATE", "EC2"],
          default: "FARGATE",
          required: true,
        },
        desired_count: {
          type: "number",
          label: "Desired Count",
          default: 1,
          validation: {
            min: 0,
            max: 100,
          },
        },
      },
    },
    step_functions: {
      id: "step_functions",
      name: "Step Functions",
      icon: "/aws/Arch_AWS-Step-Functions_64.svg",
      category: "Integration",
      description: "Workflow orchestration service",
      terraformType: "aws_sfn_state_machine",
      defaultConfig: {
        definition: "",
      },
      configSchema: {
        name: {
          type: "string",
          label: "State Machine Name",
          required: true,
        },
        definition: {
          type: "string",
          label: "State Machine Definition",
          required: true,
        },
      },
    },
    secrets_manager: {
      id: "secrets_manager",
      name: "Secrets Manager",
      icon: "/aws/Arch_AWS-Secrets-Manager_64.svg",
      category: "Security",
      description: "Secrets management service",
      terraformType: "aws_secretsmanager_secret",
      defaultConfig: {
        description: "Application secret",
      },
      configSchema: {
        name: {
          type: "string",
          label: "Secret Name",
          required: true,
        },
        description: {
          type: "string",
          label: "Description",
          default: "Application secret",
        },
      },
    },
  },
}
