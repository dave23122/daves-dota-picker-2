import requests
import json
import os
from collections import defaultdict

URL = "https://api.stratz.com/graphql"
API_TOKEN = os.environ["STRATZ_API_TOKEN"]

DATA_DIR = "../data"
os.makedirs(DATA_DIR, exist_ok=True)

headers = {
    "Authorization": f"Bearer {API_TOKEN}",
    "User-Agent": "STRATZ_API",
    "Content-Type": "application/json"
}

print("Fetching hero list...")

heroes_query = """
{
  constants {
    heroes {
      id
      shortName
      displayName
    }
  }
}
"""

response = requests.post(URL, headers=headers, json={"query": heroes_query})
heroes_data = response.json()["data"]["constants"]["heroes"]

heroes = []

for h in heroes_data:
    heroes.append({
        "hero_id": h["id"],
        "name": h["shortName"],
        "displayName": h["displayName"]
    })

print("Downloading hero matchups...")

matchup_query = """
query Matchups($heroId: Short!) {
  heroStats {
    heroVsHeroMatchup(heroId: $heroId, matchLimit: 0) {
      advantage {
        vs {
          heroId1
          heroId2
          matchCount
          winCount
        }
        with {
          heroId1
          heroId2
          matchCount
          winCount
        }
      }
    }
  }
}
"""

winrates = {}

for hero in heroes:

    hero_id = hero["hero_id"]
    print("Processing hero", hero_id)

    payload = {
        "query": matchup_query,
        "variables": {"heroId": hero_id}
    }

    response = requests.post(URL, headers=headers, json=payload)
    data = response.json()

    vs_list = data["data"]["heroStats"]["heroVsHeroMatchup"]["advantage"][0]["vs"]
    with_list = data["data"]["heroStats"]["heroVsHeroMatchup"]["advantage"][0]["with"]

    winrates[str(hero_id)] = {}

    for entry in vs_list:

        if entry["matchCount"] == 0:
            continue

        enemy = str(entry["heroId2"])
        vs_wr = entry["winCount"] / entry["matchCount"] - 0.5

        winrates[str(hero_id)][enemy] = {
            "vs": vs_wr,
            "with": 0
        }

    for entry in with_list:

        if entry["matchCount"] == 0:
            continue

        ally = str(entry["heroId2"])
        with_wr = entry["winCount"] / entry["matchCount"] - 0.5

        if ally not in winrates[str(hero_id)]:
            winrates[str(hero_id)][ally] = {}

        winrates[str(hero_id)][ally]["with"] = with_wr


print("Downloading role statistics...")

roles_query = """
{
 heroStats {
  stats(
   positionIds: [POSITION_1, POSITION_2, POSITION_3, POSITION_4, POSITION_5]
   groupByPosition: true
  ) {
   heroId
   matchCount
   position
  }
 }
}
"""

response = requests.post(URL, headers=headers, json={"query": roles_query})
role_data = response.json()["data"]["heroStats"]["stats"]

print("Calculating hero roles...")

for hero in heroes:

    hero_id = hero["hero_id"]

    positions = [r for r in role_data if r["heroId"] == hero_id]

    positions.sort(key=lambda x: x["matchCount"], reverse=True)

    hero["roles"] = [
        int(positions[0]["position"][-1]),
        int(positions[1]["position"][-1])
    ]


print("Grouping heroes alphabetically...")

grouped_heroes = defaultdict(list)

for hero in heroes:

    first_letter = hero["displayName"][0].upper()

    grouped_heroes[first_letter].append({
        "hero_id": hero["hero_id"],
        "name": hero["name"],
        "displayName": hero["displayName"],
        "roles": hero["roles"]
    })

# sort heroes inside each letter group
for letter in grouped_heroes:
    grouped_heroes[letter] = sorted(
        grouped_heroes[letter],
        key=lambda h: h["displayName"]
    )


print("Writing heroes.json")

with open(f"{DATA_DIR}/heroes.json", "w") as f:
    json.dump(grouped_heroes, f, indent=2)


print("Writing winrates.json")

with open(f"{DATA_DIR}/winrates.json", "w") as f:
    json.dump(winrates, f)


print("Done.")