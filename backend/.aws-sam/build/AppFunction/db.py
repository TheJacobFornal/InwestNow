import os
import boto3

rds = boto3.client("rds-data")

CLUSTER_ARN = os.environ["DB_CLUSTER_ARN"]
SECRET_ARN  = os.environ["DB_SECRET_ARN"]
DB_NAME     = os.environ["DB_NAME"]

def exec_sql(sql: str, parameters: list | None = None):
    return rds.execute_statement(
        resourceArn=CLUSTER_ARN,
        secretArn=SECRET_ARN,
        database=DB_NAME,
        sql=sql,
        parameters=parameters or [],
    )

def rows_from(resp):
    # Convert Data API format -> list[dict] (simple positional names c0, c1, …)
    out = []
    for rec in resp.get("records", []):
        row = {}
        for i, cell in enumerate(rec):
            row[f"c{i}"] = next(iter(cell.values()))
        out.append(row)
    return out
