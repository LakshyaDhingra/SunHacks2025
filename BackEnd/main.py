from fastapi import FastAPI

app = FastAPI()

@app.get("/recommend")
def recommend(ingredients: str, location: str):
    return {
        "recipes": [
            {"name": "Tomato Rice", "have": ["tomato", "rice"], "missing": ["onion"]},
            {"name": "Chicken Curry", "have": ["chicken", "tomato"], "missing": ["spices", "onion"]}
        ],
        "stores": [
            {"name": "Fry's Food & Drug", "address": "123 Main St"},
            {"name": "Safeway", "address": "456 College Ave"}
        ]
    }
