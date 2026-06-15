from flask import Blueprint, request, jsonify, g
from models import db, playerStats, shopState
from routes.auth import token_required
 
shop = Blueprint('shop', __name__)
 
 
@shop.route('/api/shop/buy', methods=['POST'])
@token_required
def purchase_item():
    data      = request.get_json() or {}
    category  = data.get('category') # 'accessories', 'colours', 'decor', 'screenTheme'
    item_id   = data.get('itemId')
    item_cost = data.get('itemCost')
 
    if not all([category, item_id, isinstance(item_cost, int)]):
        return jsonify({"message": "Missing or invalid purchase fields."}), 400
 
    stats     = playerStats.query.filter_by(userId=g.user_id).first()
    inventory = shopState.query.filter_by(userId=g.user_id).first()
 
    if not stats or not inventory:
        return jsonify({"message": "Player profile not found."}), 404
 
    if stats.coinBalance < item_cost:
        return jsonify({"message": f"Not enough coins. Need {item_cost}."}), 402
 
    target_list = getattr(inventory, category, None)
    if target_list is None:
        return jsonify({"message": "Invalid item category."}), 400
 
    if item_id in target_list:
        return jsonify({"message": "Item already owned."}), 409
 
    try:
        stats.coinBalance -= item_cost
 
        updated_list = list(target_list)
        updated_list.append(item_id)
        setattr(inventory, category, updated_list)
 
        db.session.commit()
        return jsonify({
            "status":      "success",
            "coinBalance": stats.coinBalance,
            "ownedItems":  updated_list
        }), 200
 
    except ValueError as val_err:
        db.session.rollback()
        return jsonify({"message": str(val_err)}), 400
 
 
@shop.route('/api/shop/equip', methods=['POST'])
@token_required
def equip_item():
    data     = request.get_json() or {}
    category = data.get('category') # 'equippedAccessories', 'equippedColours', etc.
    item_id  = data.get('itemId')    
 
    inventory = shopState.query.filter_by(userId=g.user_id).first()
    if not inventory:
        return jsonify({"message": "Inventory not found."}), 404
 
    if not hasattr(inventory, category):
        return jsonify({"message": "Invalid equipment category."}), 400
 
    try:
        setattr(inventory, category, item_id)
        db.session.commit()
        return jsonify({"status": "success", "equippedItem": item_id}), 200
 
    except ValueError as val_err:
        db.session.rollback()
        return jsonify({"message": str(val_err)}), 400