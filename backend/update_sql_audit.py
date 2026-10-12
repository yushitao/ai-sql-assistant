import sqlite3

conn = sqlite3.connect(
    "data/ai_sql_assistant.db"
)

conn.execute(
    """
    ALTER TABLE sql_audits
    ADD COLUMN question
    VARCHAR(1000)
    """
)

conn.commit()

conn.close()

print("OK")

