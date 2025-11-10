"""
Script để generate SQL từ file data_multilabel.json
Tạo file seed_multilabel_data.sql để insert dữ liệu training vào database
"""

import json
import os
from datetime import datetime

# Paths
JSON_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'data_multilabel.json')
OUTPUT_SQL = os.path.join(os.path.dirname(__file__), 'seed_multilabel_data.sql')

# Mapping labels
LABEL_MAPPING = {
    'Bảo mật': 'Bảo mật',
    'Công việc': 'Công việc',
    'Gia đình': 'Gia đình',
    'Giao dịch': 'Giao dịch',
    'Học tập': 'Học tập',
    'Quảng cáo': 'Quảng cáo',
    'Spam': 'Spam'
}

def escape_sql_string(text):
    """Escape string for SQL insertion"""
    if not text:
        return ''
    # Replace single quotes with two single quotes for SQL
    text = text.replace("'", "''")
    # Remove any potential SQL injection characters
    text = text.replace('\\', '\\\\')
    return text

def truncate_text(text, max_length=500):
    """Truncate text to maximum length"""
    if len(text) > max_length:
        return text[:max_length]
    return text

def truncate_content(text, max_length=5000):
    """Truncate content to maximum length for database column"""
    if len(text) > max_length:
        return text[:max_length]
    return text

def generate_sql_from_json():
    """Generate SQL file from JSON data"""
    
    print(f"Reading JSON file: {JSON_FILE}")
    
    # Read JSON file
    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Loaded {len(data)} emails from JSON")
    
    # Prepare SQL content
    sql_lines = []
    
    # Header
    sql_lines.append("-- " + "=" * 60)
    sql_lines.append("-- AUTO-GENERATED SQL FROM data_multilabel.json")
    sql_lines.append(f"-- Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    sql_lines.append(f"-- Total emails: {len(data)}")
    sql_lines.append("-- " + "=" * 60)
    sql_lines.append("")
    
    # Clear existing data
    sql_lines.append("-- Clear existing data")
    sql_lines.append("SET FOREIGN_KEY_CHECKS = 0;")
    sql_lines.append("TRUNCATE TABLE tblEmailLabel;")
    sql_lines.append("TRUNCATE TABLE tblDatasetEmail;")
    sql_lines.append("TRUNCATE TABLE tblEmailSample;")
    sql_lines.append("SET FOREIGN_KEY_CHECKS = 1;")
    sql_lines.append("")
    
    # Get label IDs
    sql_lines.append("-- Get label IDs (must exist from seed_labels_and_emails.sql)")
    for label in LABEL_MAPPING.keys():
        var_name = f"@label_{label.replace(' ', '_').lower()}"
        sql_lines.append(f"SET {var_name} = (SELECT id FROM tblLabel WHERE name = '{label}' LIMIT 1);")
    sql_lines.append("")
    
    # Default receiver
    sql_lines.append("-- Default receiver")
    sql_lines.append("SET @default_receiver = 'training@dataset.com';")
    sql_lines.append("")
    
    # Insert emails and their labels
    sql_lines.append("-- " + "=" * 60)
    sql_lines.append("-- INSERT TRAINING EMAILS")
    sql_lines.append("-- " + "=" * 60)
    sql_lines.append("")
    
    # Process in batches to avoid too long SQL statements
    BATCH_SIZE = 50
    total_batches = (len(data) + BATCH_SIZE - 1) // BATCH_SIZE
    
    for batch_idx in range(total_batches):
        start_idx = batch_idx * BATCH_SIZE
        end_idx = min((batch_idx + 1) * BATCH_SIZE, len(data))
        batch_data = data[start_idx:end_idx]
        
        sql_lines.append(f"-- Batch {batch_idx + 1}/{total_batches} (Emails {start_idx + 1}-{end_idx})")
        sql_lines.append("")
        
        # Insert emails
        sql_lines.append("INSERT INTO tblEmailSample (title, content, sender, receiver) VALUES")
        
        email_values = []
        for i, item in enumerate(batch_data):
            text = escape_sql_string(truncate_content(item['Text'], 5000))  # Limit content to 5000 chars
            title = escape_sql_string(truncate_text(item['Text'], 100))
            
            # Create SQL value
            value = f"('{title}...', '{text}', 'dataset@training.com', @default_receiver)"
            email_values.append(value)
        
        sql_lines.append(",\n".join(email_values) + ";")
        sql_lines.append("")
        
        # Store first email ID of this batch
        sql_lines.append(f"SET @batch_{batch_idx}_start = LAST_INSERT_ID();")
        sql_lines.append("")
        
        # Insert email-label relationships
        sql_lines.append("-- Insert email-label relationships for this batch")
        sql_lines.append("INSERT INTO tblEmailLabel (tblEmailSampleId, tblLabelId) VALUES")
        
        label_values = []
        for i, item in enumerate(batch_data):
            email_offset = i
            labels = item.get('Labels', [])
            
            for label in labels:
                if label in LABEL_MAPPING:
                    var_name = f"@label_{label.replace(' ', '_').lower()}"
                    value = f"(@batch_{batch_idx}_start + {email_offset}, {var_name})"
                    label_values.append(value)
        
        if label_values:
            sql_lines.append(",\n".join(label_values) + ";")
        sql_lines.append("")
        
        # Progress indicator
        progress = ((batch_idx + 1) / total_batches) * 100
        sql_lines.append(f"-- Progress: {progress:.1f}%")
        sql_lines.append("")
    
    # Create dataset entry
    sql_lines.append("-- " + "=" * 60)
    sql_lines.append("-- CREATE DATASET ENTRY")
    sql_lines.append("-- " + "=" * 60)
    sql_lines.append("")
    
    sql_lines.append("-- Disable safe update mode temporarily")
    sql_lines.append("SET SQL_SAFE_UPDATES = 0;")
    sql_lines.append("")
    
    sql_lines.append("-- Delete existing dataset-email links for dataset ID = 1")
    sql_lines.append("DELETE FROM tblDatasetEmail WHERE tblDatasetId = 1;")
    sql_lines.append("")
    
    sql_lines.append("-- Re-enable safe update mode")
    sql_lines.append("SET SQL_SAFE_UPDATES = 1;")
    sql_lines.append("")
    
    sql_lines.append("-- Insert or update dataset with ID = 1")
    sql_lines.append("INSERT INTO tblDataset (id, name, path, description, quantity)")
    sql_lines.append("VALUES (")
    sql_lines.append("    1,")
    sql_lines.append("    'Training Dataset - Multi-label',")
    sql_lines.append("    'data/data_multilabel.json',")
    sql_lines.append(f"    'Auto-generated training dataset with {len(data)} emails',")
    sql_lines.append(f"    {len(data)}")
    sql_lines.append(")")
    sql_lines.append("ON DUPLICATE KEY UPDATE")
    sql_lines.append(f"    quantity = {len(data)},")
    sql_lines.append(f"    description = 'Auto-generated training dataset with {len(data)} emails',")
    sql_lines.append("    path = 'data/data_multilabel.json';")
    sql_lines.append("")
    
    sql_lines.append("SET @dataset_id = 1;")
    sql_lines.append("")
    
    # Link all emails to dataset
    sql_lines.append("-- Link all emails to dataset")
    sql_lines.append("INSERT INTO tblDatasetEmail (tblDatasetId, tblEmailSampleId)")
    sql_lines.append("SELECT @dataset_id, id FROM tblEmailSample")
    sql_lines.append("WHERE sender = 'dataset@training.com';")
    sql_lines.append("")
    
    # Verification queries
    sql_lines.append("-- " + "=" * 60)
    sql_lines.append("-- VERIFICATION QUERIES")
    sql_lines.append("-- " + "=" * 60)
    sql_lines.append("")
    
    sql_lines.append("-- Count emails by label")
    sql_lines.append("SELECT ")
    sql_lines.append("    l.name AS 'Label',")
    sql_lines.append("    COUNT(DISTINCT el.tblEmailSampleId) AS 'Email Count'")
    sql_lines.append("FROM tblLabel l")
    sql_lines.append("LEFT JOIN tblEmailLabel el ON l.id = el.tblLabelId")
    sql_lines.append("LEFT JOIN tblEmailSample e ON el.tblEmailSampleId = e.id")
    sql_lines.append("WHERE e.sender = 'dataset@training.com'")
    sql_lines.append("GROUP BY l.id, l.name")
    sql_lines.append("ORDER BY COUNT(DISTINCT el.tblEmailSampleId) DESC;")
    sql_lines.append("")
    
    sql_lines.append("-- Summary statistics")
    sql_lines.append("SELECT ")
    sql_lines.append("    'Total Training Emails' AS 'Metric',")
    sql_lines.append("    COUNT(*) AS 'Count'")
    sql_lines.append("FROM tblEmailSample")
    sql_lines.append("WHERE sender = 'dataset@training.com'")
    sql_lines.append("UNION ALL")
    sql_lines.append("SELECT ")
    sql_lines.append("    'Total Email-Label Relationships' AS 'Metric',")
    sql_lines.append("    COUNT(*) AS 'Count'")
    sql_lines.append("FROM tblEmailLabel el")
    sql_lines.append("JOIN tblEmailSample e ON el.tblEmailSampleId = e.id")
    sql_lines.append("WHERE e.sender = 'dataset@training.com'")
    sql_lines.append("UNION ALL")
    sql_lines.append("SELECT ")
    sql_lines.append("    'Dataset Entries' AS 'Metric',")
    sql_lines.append("    COUNT(*) AS 'Count'")
    sql_lines.append("FROM tblDataset")
    sql_lines.append("WHERE name = 'Training Dataset - Multi-label';")
    sql_lines.append("")
    
    sql_lines.append("-- Label distribution")
    sql_lines.append("SELECT ")
    sql_lines.append("    COUNT(DISTINCT el.tblEmailSampleId) AS 'Email Count',")
    sql_lines.append("    COUNT(el.tblLabelId) AS 'Total Labels'")
    sql_lines.append("FROM tblEmailLabel el")
    sql_lines.append("JOIN tblEmailSample e ON el.tblEmailSampleId = e.id")
    sql_lines.append("WHERE e.sender = 'dataset@training.com';")
    sql_lines.append("")
    
    # Statistics about the data
    label_stats = {}
    for item in data:
        for label in item.get('Labels', []):
            label_stats[label] = label_stats.get(label, 0) + 1
    
    sql_lines.append("-- " + "=" * 60)
    sql_lines.append("-- DATASET STATISTICS")
    sql_lines.append("-- " + "=" * 60)
    sql_lines.append(f"-- Total emails: {len(data)}")
    sql_lines.append("-- Label distribution:")
    for label, count in sorted(label_stats.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / len(data)) * 100
        sql_lines.append(f"--   {label}: {count} emails ({percentage:.1f}%)")
    sql_lines.append("")
    
    # Write to file
    sql_content = "\n".join(sql_lines)
    
    with open(OUTPUT_SQL, 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    print(f"\n{'=' * 60}")
    print(f"SQL file generated successfully!")
    print(f"{'=' * 60}")
    print(f"Output file: {OUTPUT_SQL}")
    print(f"Total emails: {len(data)}")
    print(f"\nLabel distribution:")
    for label, count in sorted(label_stats.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / len(data)) * 100
        print(f"  {label:15s}: {count:5d} emails ({percentage:5.1f}%)")
    print(f"{'=' * 60}")
    
    return True

if __name__ == "__main__":
    try:
        generate_sql_from_json()
        print("\nDone! You can now run the SQL file to import data into your database.")
        print(f"\nTo import, run in MySQL:")
        print(f"  mysql -u your_user -p your_database < {OUTPUT_SQL}")
    except FileNotFoundError as e:
        print(f"Error: File not found - {e}")
        print(f"Please make sure the JSON file exists at: {JSON_FILE}")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON format - {e}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
