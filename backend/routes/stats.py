import uuid
from flask import Blueprint, request, jsonify, g
from models import db, playerStats, scoreHistory
from backend.routes.auth import token_required
 
statsBP = Blueprint('stats', __name__)
 
# xp required to have reached each rank level.
# a player's rankLevel equals the count of thresholds they've passed, capped at 5.
RANK_THRESHOLDS = [0, 100, 300, 600, 1000, 1500]
 
 
@statsBP.route('/api/stats/submit-score', methods=['POST'])
@token_required
# receives the result of a completed level and updates all affected player fields
def submit_level_score():
    data = request.get_json() or {}
 
    level_num = data.get('levelNumber')
    wpm = data.get('wpm')
    accuracy = data.get('accuracy')
    xp_gain = data.get('xpGain')
    coins_earned = data.get('coinsEarned')
    deadline_met = data.get('deadlineMet')
 
    # all fields are required 
    # None in the list means the client sent an incomplete payload
    if None in [level_num, wpm, accuracy, xp_gain, coins_earned, deadline_met]:
        return jsonify({"message": "Missing score data fields."}), 400
 
    player = playerStats.query.filter_by(userId=g.user_id).first()
    if not player:
        return jsonify({"message": "Player statistics not found."}), 404
 
    try:
        # check whether this wpm beats the stored personal best for this level
        current_pbs = dict(player.PBs)
        old_pb      = current_pbs.get(str(level_num), 0)
        is_new_pb   = wpm > old_pb
 
        if is_new_pb:
            current_pbs[str(level_num)] = wpm
            player.PBs = current_pbs
 
        # record a first-completion if the player hasn't beaten this level before
        current_finished = list(player.finLevels)
        if level_num not in current_finished:
            current_finished.append(level_num)
            player.finLevels = current_finished
 
        # apply xp and coin rewards from this run
        player.xpTotal     += xp_gain
        player.coinBalance += coins_earned
 
        # walk through thresholds to find the highest rank the player has now unlocked
        new_rank = 1
        for i, threshold in enumerate(RANK_THRESHOLDS):
            if player.xpTotal >= threshold:
                new_rank = i + 1
        player.rankLevel = min(new_rank, 5)  # Cap at 5
 
        # write score history so past runs can be shown on the results/level select screens
        history_entry = scoreHistory(
            scoreId = f"sc-{uuid.uuid4().hex[:8]}",
            userId = g.user_id,
            levelNumber = level_num,
            wpm = wpm,
            acc = accuracy,
            xpGain = xp_gain,
            deadlineMet = deadline_met,
            isPB = is_new_pb,
            coinsEarned = coins_earned
        )
        db.session.add(history_entry)
        db.session.commit()
 
        return jsonify({
            "status":   "success",
            "isPB":     is_new_pb,
            "newRank":  player.rankLevel,
            "new_balances": {
                "coinBalance":     player.coinBalance,
                "xpTotal":         player.xpTotal,
                "unlockedLevels":  player.finLevels,
                "PBs":             player.PBs
            }
        }), 200
 
    except ValueError as val_err:
        db.session.rollback()
        return jsonify({"message": str(val_err)}), 400