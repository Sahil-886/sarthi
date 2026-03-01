from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
import torch

MODEL_PATH = "./sarthi_model"
BASE_MODEL = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"

try:
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    print(f"Loading Base Model: {BASE_MODEL}...")
    base_model = AutoModelForCausalLM.from_pretrained(BASE_MODEL, device_map="auto")
    print(f"Loading Adapter: {MODEL_PATH}...")
    
    # If the root folder doesn't have the config, try searching checkpoints
    adapter_path = MODEL_PATH
    if not os.path.exists(os.path.join(adapter_path, "adapter_config.json")):
        checkpoints = [d for d in os.listdir(adapter_path) if d.startswith("checkpoint-")]
        if checkpoints:
            latest = sorted(checkpoints, key=lambda x: int(x.split("-")[-1]))[-1]
            adapter_path = os.path.join(adapter_path, latest)
            
    model = PeftModel.from_pretrained(base_model, adapter_path)
    print(f"Model loaded successfully from: {adapter_path}")
except Exception as e:
    print(f"Error loading model: {e}")
    exit(1)

def chat(message):
    prompt = f"User: {message}\nAssistant:"
    inputs = tokenizer(prompt, return_tensors="pt")
    
    # Check if GPU/CUDA or MPS (Mac) is available
    if torch.cuda.is_available():
        inputs = inputs.to("cuda")
    elif torch.backends.mps.is_available():
        inputs = inputs.to("mps")

    output = model.generate(
        **inputs,
        max_new_tokens=150,
        temperature=0.7
    )

    response = tokenizer.decode(output[0], skip_special_tokens=True)
    # Extract only the assistant's part
    if "Assistant:" in response:
        response = response.split("Assistant:")[-1].strip()
    return response

if __name__ == "__main__":
    print("Sarthi AI (Hinglish) is ready! Type 'exit' to quit.")
    while True:
        msg = input("You: ")
        if msg.lower() == 'exit':
            break
        print(f"Assistant: {chat(msg)}")
