from flask import Blueprint, request, jsonify, g
from models import db, playerStats, shopState
from backend.routes.auth import token_required

shop = Blueprint('shop', __name__)

@shop.route('/api/shop/buy', methods=['POST'])
@token_required
# deducts coins from the player's balance and appends the item to their inventory
def purchase_item():
    data      = request.get_json() or {}
    category  = data.get('category') # 'accessories' or 'screenTheme'
    item_id   = data.get('itemId')
    item_cost = data.get('itemCost')

    # reject if any required field is missing or itemCost isn't a proper integer
    if not all([category, item_id, isinstance(item_cost, int)]):
        return jsonify({"message": "Missing or invalid purchase fields."}), 400

    # guard against stale frontend requests that still use old category names
    if category not in ['accessories', 'screenTheme']:
        return jsonify({"message": f"Invalid category: {category}"}), 400

    stats     = playerStats.query.filter_by(userId=g.user_id).first()
    inventory = shopState.query.filter_by(userId=g.user_id).first()

    if not stats or not inventory:
        return jsonify({"message": "Player profile not found."}), 404

    if stats.coinBalance < item_cost:
        return jsonify({"message": f"Not enough coins. Need {item_cost}."}), 402

    # getattr pulls the list for the given category; fall back to [] if the column is null
    target_list = getattr(inventory, category, []) or []
    
    if item_id in target_list:
        return jsonify({"message": "Item already owned."}), 409

    try:
        stats.coinBalance -= item_cost

       # copy the list before mutating so SQLAlchemy detects the change on the JSON column
        updated_list = list(target_list)
        updated_list.append(item_id)
        
        setattr(inventory, category, updated_list)

        db.session.commit()
        return jsonify({
            "status":      "success",
            "coinBalance": stats.coinBalance,
            "ownedItems":  updated_list
        }), 200

    except Exception as err: 
        db.session.rollback()
        return jsonify({"message": str(err)}), 400
 
@shop.route('/api/shop/equip', methods=['POST'])
@token_required
# updates the player's equipped slot for the given category
def equip_item():
    data     = request.get_json() or {}
    category = data.get('category') # 'accessories' or 'screenTheme'
    item_id  = data.get('itemId')    

    inventory = shopState.query.filter_by(userId=g.user_id).first()
    if not inventory:
        return jsonify({"message": "Inventory not found."}), 404

    if category == 'accessories':
        db_column_target = 'equippedAccessories'
        # 'none' means unequip, so only validate ownership for real item ids
        if item_id != "none":
            owned_list = getattr(inventory, 'accessories', []) or []
            if item_id not in owned_list:
                return jsonify({"message": f"Accessory '{item_id}' is not owned."}), 400

    elif category == 'screenTheme':
        db_column_target = 'equippedScreenTheme'
        # 'default' is the built-in theme and doesn't need to be purchased
        if item_id != "default":
            owned_list = getattr(inventory, 'screenTheme', []) or []
            if item_id not in owned_list:
                return jsonify({"message": f"Theme '{item_id}' is not owned."}), 400
    else:
        return jsonify({"message": f"Invalid category: {category}"}), 400

    try:
        setattr(inventory, db_column_target, item_id)
        db.session.commit()
        return jsonify({"status": "success", "equippedItem": item_id}), 200
    except Exception as err:
        db.session.rollback()
        return jsonify({"message": str(err)}), 500