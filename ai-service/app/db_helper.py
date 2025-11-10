import pymysql
import os
from typing import Optional

def get_active_model() -> Optional[str]:
    connection = None
    try:
        connection = pymysql.connect (
            host=os.getenv('DB_HOST','localhost'),
            port=int(os.getenv('DB_PORT',3306)),
            user=os.getenv('DB_USER','root'),
            passwd=os.getenv('DB_PASSWORD',''),
            database=os.getenv('DB_NAME','email_classification'),
            charset='utf8mb4'
        )
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = """
                SELECT path
                FROM tblModel
                WHERE isActive = 1
                LIMIT 1
            """
            cursor.execute(sql)
            result = cursor.fetchone()
            if result:
                return result['path']
            return None
    except Exception as e:
        print(f"Database error: {str(e)}")
        print(f"Falling back to env")
        return None
    finally:
        if 'connection' in locals() and connection:
            connection.close()
        