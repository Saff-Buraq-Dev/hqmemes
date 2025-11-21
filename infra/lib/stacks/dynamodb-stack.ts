import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'

export interface DynamoDBStackProps {
  projectName: string
  environment: string
}

export class DynamoDBStack extends Construct {
  public readonly usersTable: dynamodb.Table
  public readonly memesTable: dynamodb.Table
  public readonly likesTable: dynamodb.Table
  public readonly categoriesTable: dynamodb.Table
  public readonly uploadJobsTable: dynamodb.Table

  constructor(scope: Construct, id: string, props: DynamoDBStackProps) {
    super(scope, id)

    // Users Table
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: `${props.projectName}-${props.environment}-users`,
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // Memes Table
    this.memesTable = new dynamodb.Table(this, 'MemesTable', {
      tableName: `${props.projectName}-${props.environment}-memes`,
      partitionKey: {
        name: 'memeId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // Add GSI for querying by uploader
    this.memesTable.addGlobalSecondaryIndex({
      indexName: 'uploaderId-createdAt-index',
      partitionKey: {
        name: 'uploaderId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
    })

    // GSI for recent memes
    this.memesTable.addGlobalSecondaryIndex({
      indexName: 'createdAt-index',
      partitionKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
    })

    // GSI for popular memes
    this.memesTable.addGlobalSecondaryIndex({
      indexName: 'likesCount-createdAt-index',
      partitionKey: {
        name: 'likesCount',
        type: dynamodb.AttributeType.NUMBER,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
    })

    // Likes Table
    this.likesTable = new dynamodb.Table(this, 'LikesTable', {
      tableName: `${props.projectName}-${props.environment}-likes`,
      partitionKey: {
        name: 'memeId#userId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // Add GSI for querying likes by meme
    this.likesTable.addGlobalSecondaryIndex({
      indexName: 'memeId-index',
      partitionKey: {
        name: 'memeId',
        type: dynamodb.AttributeType.STRING,
      },
    })

    // Add GSI for querying likes by user
    this.likesTable.addGlobalSecondaryIndex({
      indexName: 'userId-index',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
    })

    // Categories Table
    this.categoriesTable = new dynamodb.Table(this, 'CategoriesTable', {
      tableName: `${props.projectName}-${props.environment}-categories`,
      partitionKey: {
        name: 'categoryId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // Upload Jobs Table
    this.uploadJobsTable = new dynamodb.Table(this, 'UploadJobsTable', {
      tableName: `${props.projectName}-${props.environment}-upload-jobs`,
      partitionKey: {
        name: 'jobId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // Add GSI for querying jobs by user
    this.uploadJobsTable.addGlobalSecondaryIndex({
      indexName: 'userId-index',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
    })
  }
}
