// Bicep template for Moto Trip Organizer - koristi POSTOJEĆI SQL Server
// Creates: App Service, Storage Account, Key Vault, Application Insights
// Uses: Existing SQL Server (motomanager)

@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('Azure region for resources')
param location string = resourceGroup().location

@description('Base name for all resources')
param baseName string = 'mototriporg'

@description('Existing SQL Server name')
param existingSqlServerName string = 'motomanager'

@description('Existing SQL Server Resource Group')
param existingSqlServerResourceGroup string = 'rg-shared-dev'

@description('SQL Database name (already created)')
param sqlDatabaseName string = 'MotoTripOrganizer'

@description('SQL admin username for connection string')
@secure()
param sqlAdminLogin string

@description('SQL admin password for connection string')
@secure()
param sqlAdminPassword string

@description('Auth0 tenant domain (e.g., your-tenant.auth0.com)')
param auth0Domain string

@description('Auth0 API audience')
param auth0Audience string

@description('Your Azure AD Object ID for Key Vault access')
param keyVaultAdminObjectId string

@description('Frontend URL for CORS')
param frontendUrl string = 'http://localhost:3000'

// Variables
var resourceNamePrefix = '${baseName}-${environment}'
var appServicePlanName = '${resourceNamePrefix}-asp'
var webAppName = '${resourceNamePrefix}-api'
var storageAccountName = replace('${baseName}${environment}st', '-', '')
var keyVaultName = '${resourceNamePrefix}-kv'
var appInsightsName = '${resourceNamePrefix}-ai'
var logAnalyticsName = '${resourceNamePrefix}-log'

var tags = {
  Environment: environment
  Application: 'MotoTripOrganizer'
  ManagedBy: 'Bicep'
}

// Reference existing SQL Server
resource existingSqlServer 'Microsoft.Sql/servers@2023-05-01-preview' existing = {
  name: existingSqlServerName
  scope: resourceGroup(existingSqlServerResourceGroup)
}

// ===== Log Analytics Workspace =====
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// ===== Application Insights =====
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    RetentionInDays: 30
  }
}

// ===== Storage Account (for Blob Storage) =====
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
    accessTier: 'Hot'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// Blob Service
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    cors: {
      corsRules: []
    }
    deleteRetentionPolicy: {
      enabled: true
      days: 7
    }
  }
}

// Blob container for trip attachments
resource attachmentsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'trip-attachments'
  properties: {
    publicAccess: 'None'
  }
}

// ===== Key Vault =====
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: false
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: keyVaultAdminObjectId
        permissions: {
          secrets: ['all']
          keys: ['all']
          certificates: ['all']
        }
      }
    ]
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// Store SQL connection string in Key Vault
resource sqlConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'SqlConnectionString'
  properties: {
    value: 'Server=tcp:${existingSqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=${sqlDatabaseName};Persist Security Info=False;User ID=${sqlAdminLogin};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
  }
}

// Store storage connection string in Key Vault
resource storageConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'StorageConnectionString'
  properties: {
    value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${az.environment().suffixes.storage}'
  }
}

// Store Application Insights connection string
resource appInsightsConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'ApplicationInsightsConnectionString'
  properties: {
    value: appInsights.properties.ConnectionString
  }
}

// ===== App Service Plan =====
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: 'S1'
    tier: 'Standard'
    capacity: 1
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// ===== Web App (API) =====
resource webApp 'Microsoft.Web/sites@2023-01-01' = {
  name: webAppName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|8.0'
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      healthCheckPath: '/health'
      appSettings: [
        {
          name: 'ASPNETCORE_ENVIRONMENT'
          value: 'Development'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=ApplicationInsightsConnectionString)'
        }
        {
          name: 'Auth0__Authority'
          value: 'https://${auth0Domain}/'
        }
        {
          name: 'Auth0__Audience'
          value: auth0Audience
        }
        {
          name: 'ConnectionStrings__DefaultConnection'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=SqlConnectionString)'
        }
        {
          name: 'AzureStorage__ConnectionString'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=StorageConnectionString)'
        }
        {
          name: 'Cors__AllowedOrigins__0'
          value: frontendUrl
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
      ]
    }
  }
}

// Grant Web App access to Key Vault
resource keyVaultAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2023-07-01' = {
  parent: keyVault
  name: 'add'
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: webApp.identity.principalId
        permissions: {
          secrets: ['get', 'list']
        }
      }
    ]
  }
}

// ===== Outputs =====
output webAppName string = webApp.name
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output sqlServerFqdn string = existingSqlServer.properties.fullyQualifiedDomainName
output sqlDatabaseName string = sqlDatabaseName
output storageAccountName string = storageAccount.name
output keyVaultName string = keyVault.name
output appInsightsName string = appInsights.name
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey
output resourceGroupName string = resourceGroup().name
