from pymongo import MongoClient

uri = "mongodb+srv://shubhamredkar2605:shubham123@patientmonitoring.oza6lvp.mongodb.net/?appName=patientmonitoring"

client = MongoClient(uri)

try:
    print(client.admin.command("ping"))
    print("Connected!")
except Exception as e:
    print(e)
