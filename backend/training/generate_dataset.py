import json
import random

emotions = ["sad", "happy", "stressed", "angry", "lonely", "anxious", "neutral"]

user_templates = [
    "Mujhe aaj bahut {emotion} feel ho raha hai",
    "Mera mood off hai",
    "Aaj ka din thoda tough tha",
    "Mujhe samajh nahi aa raha kya karu",
    "Main thoda pressure feel kar raha hu",
    "Kisi se baat karne ka mann nahi kar raha",
    "Sab kuch overwhelming lag raha hai"
]

assistant_templates = [
    "Hmm… main samajh sakti hoon. Kya hua exactly?",
    "Arey… kabhi kabhi aisa feel hona normal hai.",
    "Tum share karna chaho toh main sun rahi hoon.",
    "It sounds heavy… thoda detail me bataoge?",
    "Main yahin hoon. Tum akela nahi ho.",
    "Chalo slowly baat karte hain… kya chal raha hai mind me?"
]

dataset = []

for _ in range(5000):
    emotion = random.choice(emotions)
    user = random.choice(user_templates).format(emotion=emotion)
    assistant = random.choice(assistant_templates)

    dataset.append({
        "emotion": emotion,
        "conversations": [
            {"role": "user", "content": user},
            {"role": "assistant", "content": assistant}
        ]
    })

with open("hinglish_dataset.json", "w") as f:
    json.dump(dataset, f, indent=2, ensure_ascii=False)

print("Dataset created: hinglish_dataset.json")
