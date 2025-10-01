from flask import Flask, render_template, request, jsonify
import json

app = Flask(__name__)

# Load dataset
with open('data/house_data.json', 'r') as f:
    houses = json.load(f)

# Furnishing priority for sorting
furnishing_order = {"Furnished": 3, "Semi-Furnished": 2, "Unfurnished": 1}

# Calculate rough price estimate
def estimate_price(user_criteria):
    area = user_criteria.get("Area")
    bhk = int(user_criteria.get("BHK"))
    prop_type = user_criteria.get("PropertyType")
    furnishing = user_criteria.get("Furnishing")
    facilities = user_criteria.get("PremiumFacilities", [])

    # Find houses in the same area and type
    candidates = [h for h in houses if h["Area"] == area and h["PropertyType"] == prop_type]

    # If none, relax criteria
    if not candidates:
        candidates = [h for h in houses if h["Area"] == area]

    if not candidates:
        candidates = houses

    prices = []
    for h in candidates:
        prange = h.get("PriceRange") if user_criteria.get("BuyRent")=="Buy" else h.get("RentRange")
        if prange:
            try:
                # Convert "25L–32L" or "₹7,559–₹9,215" to numbers
                if "–" in prange:
                    parts = prange.replace("₹","").replace("L","").replace(",","").split("–")
                    low = float(parts[0].strip())
                    high = float(parts[1].strip())
                    prices.append((low+high)/2)
                else:
                    prices.append(float(prange.replace("₹","").replace("L","").replace(",","")))
            except:
                continue

    if prices:
        return round(sum(prices)/len(prices),1)
    else:
        return 0

# Similarity for facilities
def get_similarity(user_facilities, house_facilities):
    return len(set(user_facilities) & set(house_facilities))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chatbot', methods=['POST'])
def chatbot():
    data = request.json
    criteria = data.get("criteria")
    model = data.get("model")

    if model == "price":
        # Rough price estimate
        price_est = estimate_price(criteria)
        price_html = f"<div class='bot-message fade-in'>💰 Estimated Price: {price_est}L</div>"

    # --- Filter houses ---
    filtered = [h for h in houses if h["Area"] == criteria.get("Area")]
    if not filtered:
        filtered = houses

    # Sorting priorities: area → BHK → type → furnishing → facilities → price
    def sort_key(h):
        return (
            0 if h["Area"] == criteria.get("Area") else 1,
            abs(int(h.get("BHK",0)) - int(criteria.get("BHK",0))),
            0 if h.get("PropertyType") == criteria.get("PropertyType") else 1,
            -furnishing_order.get(h.get("Furnishing",""),0),
            -get_similarity(criteria.get("PremiumFacilities",[]), h.get("PremiumFacilities",[])),
            h.get("PriceMin",0)
        )

    filtered.sort(key=sort_key)

    # --- Render houses ---
    html_cards = ""
    for h in filtered[:5]:
        facilities = ", ".join(h.get("PremiumFacilities", []))
        price_field = h.get("PriceRange") if criteria.get("BuyRent")=="Buy" else h.get("RentRange")
        price_field = f"💰 {price_field}" if price_field else "N/A"

        card = f"""
        <div class='house-card'>
            <h3>{h.get('BHK','')} BHK {h.get('PropertyType','')}</h3>
            <p><b>Area:</b> {h.get('Area','')}</p>
            <p><b>Society:</b> {h.get('Society','')}</p>
            <p><b>Furnishing:</b> {h.get('Furnishing','')}</p>
            <p><b>Facilities:</b> {facilities}</p>
            <p><b>Price:</b> {price_field}</p>
            <p><b>Contact:</b> {h.get('Contact','')}</p>
        </div>
        """
        html_cards += card

    # Combine price estimate + house cards
    if model=="price":
        response_html = price_html + html_cards
    else:
        response_html = html_cards

    return jsonify({"response": response_html})

if __name__ == "__main__":
    app.run(debug=True)
