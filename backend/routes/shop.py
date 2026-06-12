from flask import Blueprint, request, jsonify
from models import db, playerStats, shopState
from routes.auth import token_required

shop = Blueprint('shop', __name__)

@shop.route('/api/shop/buy', methods=['POST'])
@token_required
def purchase_item():
    data = request.get_json() or {}
    category = data.get('category')  # options: 'accessories', 'colours', 'decor', 'screenTheme'
    item_id = data.get('itemId')
    item_cost = data.get('itemCost')

    if not all([category, item_id, isinstance(item_cost, int)]):
        return jsonify({"message": "Missing correct inventory transaction values."}), 400

    # Gather user inventory profile and currency structures simultaneously
    stats = playerStats.query.filter_by(userId=request.user_id).first()
    inventory = shopState.query.filter_by(userId=request.user_id).first()

    if not stats or not inventory:
        return jsonify({"message": "Target shopping relationship profile missing."}), 404

    # 1. Enforce balance validation rules
    if stats.coinBalance < item_cost:
        return jsonify({"message": f"Transaction denied: Insufficient coin balance. Need {item_cost} coins."}), 400

    # 2. Target destination collection block arrays dynamically
    target_inventory_list = getattr(inventory, category, None)
    if target_inventory_list is None:
        return jsonify({"message": "Invalid item catalogue category type target selection."}), 400

    if item_id in target_inventory_list:
        return jsonify({"message": "Item item tracking reference is already owned on account."}), 400

    try:
        # 3. Deduct pricing and append item records cleanly
        stats.coinBalance -= item_cost
        
        updated_list = list(target_inventory_list)
        updated_list.append(item_id)
        setattr(inventory, category, updated_list) # Re-saves matching structural list updates cleanly

        db.session.commit()
        return jsonify({
            "status": "success",
            "message": f"Purchased {item_id} successfully!",
            "coinBalance": stats.coinBalance,
            "owned_items": updated_list
        }), 200

    except ValueError as val_err:
        db.session.rollback()
        return jsonify({"message": str(val_err)}), 400

@shop.route('/api/shop/equip', methods=['POST'])
@token_required
def equip_wardrobe_item():
    data = request.get_json() or {}
    category = data.get('category') # 'equippedAccessories', 'equippedColours', 'equippedDecor', 'equippedScreenTheme'
    item_id = data.get('itemId')     # Item string code, or None to unequip completely

    inventory = shopState.query.filter_by(userId=request.user_id).first()
    if not inventory:
        return jsonify({"message": "Inventory management rows missing."}), 404

    if not hasattr(inventory, category):
        return jsonify({"message": "Invalid equipment field categorization selection."}), 400

    try:
        # Assign values directly. The internal model system catches illegal non-owned options automatically!
        setattr(inventory, category, item_id)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": f"Successfully updated clothing equipment parameter item slot to: {item_id}."
        }), 200

    except ValueError as val_err:
        db.session.rollback()
        return jsonify({"message": str(val_err)}), 400
