import boto3
from boto3.dynamodb.conditions import Key, Attr
from typing import Dict, List, Optional, Any
from ..config import settings

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name=settings.aws_region)


def get_table(table_name: str):
    """Get DynamoDB table"""
    return dynamodb.Table(table_name)


def put_item(table_name: str, item: Dict[str, Any]) -> Dict[str, Any]:
    """Put item in DynamoDB"""
    table = get_table(table_name)
    table.put_item(Item=item)
    return item


def get_item(table_name: str, key: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Get item from DynamoDB"""
    table = get_table(table_name)
    response = table.get_item(Key=key)
    return response.get('Item')


def update_item(
    table_name: str,
    key: Dict[str, Any],
    updates: Dict[str, Any],
    return_values: str = 'ALL_NEW'
) -> Dict[str, Any]:
    """Update item in DynamoDB"""
    table = get_table(table_name)

    update_expression = 'SET ' + \
        ', '.join([f'#{k} = :{k}' for k in updates.keys()])
    expression_attribute_names = {f'#{k}': k for k in updates.keys()}
    expression_attribute_values = {f':{k}': v for k, v in updates.items()}

    response = table.update_item(
        Key=key,
        UpdateExpression=update_expression,
        ExpressionAttributeNames=expression_attribute_names,
        ExpressionAttributeValues=expression_attribute_values,
        ReturnValues=return_values
    )
    return response.get('Attributes', {})


def delete_item(table_name: str, key: Dict[str, Any]) -> None:
    """Delete item from DynamoDB"""
    table = get_table(table_name)
    table.delete_item(Key=key)


def query_items(
    table_name: str,
    key_condition_expression: Any,
    index_name: Optional[str] = None,
    filter_expression: Optional[Any] = None,
    limit: Optional[int] = None,
    scan_index_forward: bool = True,
    exclusive_start_key: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Query items from DynamoDB"""
    table = get_table(table_name)

    query_kwargs = {
        'KeyConditionExpression': key_condition_expression,
        'ScanIndexForward': scan_index_forward,
    }

    if index_name:
        query_kwargs['IndexName'] = index_name
    if filter_expression:
        query_kwargs['FilterExpression'] = filter_expression
    if limit:
        query_kwargs['Limit'] = limit
    if exclusive_start_key:
        query_kwargs['ExclusiveStartKey'] = exclusive_start_key

    response = table.query(**query_kwargs)
    return response


def scan_items(
    table_name: str,
    filter_expression: Optional[Any] = None,
    limit: Optional[int] = None,
    exclusive_start_key: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Scan items from DynamoDB"""
    table = get_table(table_name)

    scan_kwargs = {}
    if filter_expression:
        scan_kwargs['FilterExpression'] = filter_expression
    if limit:
        scan_kwargs['Limit'] = limit
    if exclusive_start_key:
        scan_kwargs['ExclusiveStartKey'] = exclusive_start_key

    response = table.scan(**scan_kwargs)
    return response
