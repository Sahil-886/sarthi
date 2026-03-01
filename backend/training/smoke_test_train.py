from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer
from peft import LoraConfig, get_peft_model
import torch
import os

MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"

# Ensure we're in the training directory
if not os.path.exists("hinglish_dataset.json"):
    raise FileNotFoundError("hinglish_dataset.json not found. Run generate_dataset.py first.")

# SMOKE TEST: Load only first 10 examples
dataset = load_dataset("json", data_files="hinglish_dataset.json", split='train[:10]')

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

print("Attempting to load model (8-bit)...")
try:
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        load_in_8bit=True,
        device_map="auto"
    )
except Exception as e:
    print(f"8-bit load failed: {e}. Trying standard load...")
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        device_map="auto",
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
    )

def format_example(example):
    text = ""
    for turn in example["conversations"]:
        if turn["role"] == "user":
            text += f"User: {turn['content']}\n"
        else:
            text += f"Assistant: {turn['content']}\n"
    return {"text": text}

dataset = dataset.map(format_example)

def tokenize(example):
    result = tokenizer(
        example["text"],
        truncation=True,
        padding="max_length",
        max_length=512
    )
    result["labels"] = result["input_ids"].copy()
    return result

dataset = dataset.map(tokenize, batched=True)

lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)

model = get_peft_model(model, lora_config)

training_args = TrainingArguments(
    output_dir="./sarthi_model_smoke",
    per_device_train_batch_size=1,
    num_train_epochs=1,
    learning_rate=2e-4,
    logging_steps=1,
    max_steps=5, # ONLY 5 STEPS FOR SMOKE TEST
    fp16=True if torch.cuda.is_available() else False,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset
)

print("Starting smoke test training...")
trainer.train()
print("Smoke test successful!")
