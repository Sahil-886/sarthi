from app.core.database import SessionLocal
from app.models.user import GameScore, StressLog, User
from app.models.streak import UserStreak
from app.models.xp import UserXP
from app.models.habit import UserHabit

db = SessionLocal()
users = db.query(User).all()
if not users:
    print("No users found.")
else:
    for u in users:
        print(f"User: {u.id} - {u.email}")
        scores = db.query(GameScore).filter_by(user_id=u.id).all()
        print(f"  GameScores: {len(scores)}")
        for s in scores:
            print(f"    - [{s.id}] {s.game_name}: {s.score} (created: {s.created_at})")
        logs = db.query(StressLog).filter_by(user_id=u.id).all()
        print(f"  StressLogs: {len(logs)}")
        for log in logs:
            print(f"    - [{log.id}] level: {log.stress_level} score: {log.stress_score} (created: {log.created_at})")
