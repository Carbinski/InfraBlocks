import type { TerraformResource } from '@/components/terraform-generator'

export interface NetworkRequirements {
  hasEC2: boolean
  hasRDS: boolean
  hasLambda: boolean
  hasALB: boolean
  hasExistingVPC: boolean
}

export class NetworkInfrastructureGenerator {
  /**
   * Determines if VPC infrastructure is needed based on the services
   */
  static needsVPCInfrastructure(nodes: any[]): boolean {
    const requirements = this.analyzeNetworkRequirements(nodes)
    
    // Need VPC infrastructure if we have services that require it but no existing VPC
    return (requirements.hasEC2 || requirements.hasRDS || requirements.hasLambda || requirements.hasALB) 
           && !requirements.hasExistingVPC
  }

  /**
   * Analyzes the network requirements based on the services
   */
  static analyzeNetworkRequirements(nodes: any[]): NetworkRequirements {
    return {
      hasEC2: nodes.some(node => node.data.id === 'ec2'),
      hasRDS: nodes.some(node => node.data.id === 'rds'),
      hasLambda: nodes.some(node => node.data.id === 'lambda'),
      hasALB: nodes.some(node => node.data.id === 'alb'),
      hasExistingVPC: nodes.some(node => node.data.id === 'vpc'),
    }
  }

  /**
   * Generates the required VPC infrastructure resources
   */
  static generateVPCInfrastructure(): TerraformResource[] {
    return [
      // VPC
      {
        type: 'aws_vpc',
        name: 'main',
        config: {
          cidr_block: '10.0.0.0/16',
          enable_dns_hostnames: true,
          enable_dns_support: true,
          tags: {
            Name: 'main-vpc',
            Environment: 'terraform-generated',
          },
        },
        dependencies: [],
      },

      // Internet Gateway
      {
        type: 'aws_internet_gateway',
        name: 'main',
        config: {
          vpc_id: 'aws_vpc.main.id',
          tags: {
            Name: 'main-igw',
            Environment: 'terraform-generated',
          },
        },
        dependencies: ['aws_vpc.main'],
      },

      // Public Subnet
      {
        type: 'aws_subnet',
        name: 'public',
        config: {
          vpc_id: 'aws_vpc.main.id',
          cidr_block: '10.0.1.0/24',
          availability_zone: 'us-east-1a',
          map_public_ip_on_launch: true,
          tags: {
            Name: 'public-subnet',
            Environment: 'terraform-generated',
          },
        },
        dependencies: ['aws_vpc.main'],
      },

      // Private Subnet
      {
        type: 'aws_subnet',
        name: 'private',
        config: {
          vpc_id: 'aws_vpc.main.id',
          cidr_block: '10.0.2.0/24',
          availability_zone: 'us-east-1b',
          map_public_ip_on_launch: false,
          tags: {
            Name: 'private-subnet',
            Environment: 'terraform-generated',
          },
        },
        dependencies: ['aws_vpc.main'],
      },

      // Route Table for Public Subnet
      {
        type: 'aws_route_table',
        name: 'public',
        config: {
          vpc_id: 'aws_vpc.main.id',
          tags: {
            Name: 'public-rt',
            Environment: 'terraform-generated',
          },
        },
        dependencies: ['aws_vpc.main', 'aws_internet_gateway.main'],
      },

      // Route Table for Private Subnet
      {
        type: 'aws_route_table',
        name: 'private',
        config: {
          vpc_id: 'aws_vpc.main.id',
          tags: {
            Name: 'private-rt',
            Environment: 'terraform-generated',
          },
        },
        dependencies: ['aws_vpc.main'],
      },

      // Route for Public Subnet to Internet Gateway
      {
        type: 'aws_route',
        name: 'public_internet_gateway',
        config: {
          route_table_id: 'aws_route_table.public.id',
          destination_cidr_block: '0.0.0.0/0',
          gateway_id: 'aws_internet_gateway.main.id',
        },
        dependencies: ['aws_route_table.public', 'aws_internet_gateway.main'],
      },

      // Route Table Association for Public Subnet
      {
        type: 'aws_route_table_association',
        name: 'public',
        config: {
          subnet_id: 'aws_subnet.public.id',
          route_table_id: 'aws_route_table.public.id',
        },
        dependencies: ['aws_subnet.public', 'aws_route_table.public'],
      },

      // Route Table Association for Private Subnet
      {
        type: 'aws_route_table_association',
        name: 'private',
        config: {
          subnet_id: 'aws_subnet.private.id',
          route_table_id: 'aws_route_table.private.id',
        },
        dependencies: ['aws_subnet.private', 'aws_route_table.private'],
      },
    ]
  }

  /**
   * Generates default security group for VPC
   */
  static generateDefaultSecurityGroup(): TerraformResource {
    return {
      type: 'aws_security_group',
      name: 'default',
      config: {
        name_prefix: 'default-sg-',
        vpc_id: 'aws_vpc.main.id',
        tags: {
          Name: 'default-security-group',
        },
      },
      dependencies: ['aws_vpc.main'],
    }
  }

  /**
   * Generates security group rules as separate resources
   */
  static generateSecurityGroupRules(): TerraformResource[] {
    return [
      // SSH access
      {
        type: 'aws_security_group_rule',
        name: 'default_ssh',
        config: {
          type: 'ingress',
          from_port: 22,
          to_port: 22,
          protocol: 'tcp',
          cidr_blocks: ['0.0.0.0/0'],
          security_group_id: 'aws_security_group.default.id',
        },
        dependencies: ['aws_security_group.default'],
      },
      // HTTP access
      {
        type: 'aws_security_group_rule',
        name: 'default_http',
        config: {
          type: 'ingress',
          from_port: 80,
          to_port: 80,
          protocol: 'tcp',
          cidr_blocks: ['0.0.0.0/0'],
          security_group_id: 'aws_security_group.default.id',
        },
        dependencies: ['aws_security_group.default'],
      },
      // HTTPS access
      {
        type: 'aws_security_group_rule',
        name: 'default_https',
        config: {
          type: 'ingress',
          from_port: 443,
          to_port: 443,
          protocol: 'tcp',
          cidr_blocks: ['0.0.0.0/0'],
          security_group_id: 'aws_security_group.default.id',
        },
        dependencies: ['aws_security_group.default'],
      },
      // All outbound traffic
      {
        type: 'aws_security_group_rule',
        name: 'default_egress_all',
        config: {
          type: 'egress',
          from_port: 0,
          to_port: 0,
          protocol: '-1',
          cidr_blocks: ['0.0.0.0/0'],
          security_group_id: 'aws_security_group.default.id',
        },
        dependencies: ['aws_security_group.default'],
      },
    ]
  }

  /**
   * Gets the appropriate subnet reference based on service type
   */
  static getSubnetReference(serviceId: string): string {
    switch (serviceId) {
      case 'ec2':
        // EC2 instances typically go in public subnet for easier access
        return 'aws_subnet.public.id'
      case 'rds':
        // RDS instances should go in private subnet for security
        return 'aws_subnet.private.id'
      case 'lambda':
        // Lambda functions don't need subnet specification by default
        return 'aws_subnet.private.id'
      case 'alb':
        // ALBs typically use public subnets
        return 'aws_subnet.public.id'
      default:
        return 'aws_subnet.public.id'
    }
  }

  /**
   * Gets the default security group reference
   */
  static getSecurityGroupReference(): string {
    return 'aws_security_group.default.id'
  }
}
