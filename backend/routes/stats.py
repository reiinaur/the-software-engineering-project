import uuid
from flask import Blueprint, request, jsonify
from models import db, playerStats, scoreHistory
from routes.auth import token_required

stats = Blueprint('stats', __name__)

@stats.route('/api/stats/submit-score', methods=['POST'])
@token_required
def submit_level_score():
    data = request.get_json() or {}
    
    level_num = data.get('levelNumber')
    wpm = data.get('wpm')
    accuracy = data.get('accuracy')
    xp_gain = data.get('xpGain')
    coins_earned = data.get('coinsEarned')
    deadline_met = data.get('deadlineMet')

    if None in [level_num, wpm, accuracy, xp_gain, coins_earned, deadline_met]:
        return jsonify({"message": "Missing matching score telemetry metrics data."}), 400

    # 1. Fetch user profile data structures
    stats = playerStats.query.filter_by(userId=request.user_id).first()
    if not stats:
        return jsonify({"message": "Player statistics instance missing."}), 404

    try:
        # 2. Extract current personal best tracker
        current_pbs = dict(stats.PBs)
        old_pb = current_pbs.get(str(level_num), 0)
        is_new_pb = wpm > old_pb

        if is_new_pb:
            current_pbs[str(level_num)] = wpm
            stats.PBs = current_pbs # Reassigning object forces tracking map updates

        # 3. Handle list updates for completed levels tracking
        current_finished_list = list(stats.finLevels)
        if level_num not in current_finished_list:
            current_finished_list.append(level_num)
            stats.finLevels = current_finished_list

        # 4. Increment structural resources balances safely
        stats.xpTotal += xp_gain
        stats.coinBalance += coins_earned

        # 5. Log unique historical performance tracking row records
        history_entry = scoreHistory(
            scoreId=f"sc-{uuid.uuid4().hex[:8]}",
            userId=request.user_id,
            levelNumber=level_num,
            wpm=wpm,
            acc=accuracy, # Maps to the "acc%" database model key alias cleanly
            xpGain=xp_gain,
            deadlineMet=deadline_met,
            isPB=is_new_pb,
            coinsEarned=coins_earned
        )

        db.session.add(history_entry)
        db.session.commit() # Triggers models.py @validates constraint sweeps automatically!

        return jsonify({
            "status": "success",
            "message": "Match results written securely to account database logs.",
            "isPB": is_new_pb,
            "new_balances": {
                "coinBalance": stats.coinBalance,
                "xpTotal": stats.xpTotal,
                "unlockedLevels": stats.finLevels
            }
        }), 200

    except ValueError as val_err:
        db.session.rollback()
        return jsonify({"message": str(val_err)}), 400
