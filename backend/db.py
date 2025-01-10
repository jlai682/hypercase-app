import sqlite3

# Connect to database
conn = sqlite3.connect("/Users/surajkumar/Desktop2/10_HyperCASE/hypercase-app/backend/db.sqlite3")

# Add a cursor
cur = conn.cursor()

# Close db objects
cur.close()
conn.close()