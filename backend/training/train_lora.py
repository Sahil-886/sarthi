from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer
from peft import LoraConfig, get_peft_model
import torch
import os

# Default to TinyLlama for Mac compatibility. Switch to Mistral for high-spec hardware.
MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
# MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.2"

# Ensure we're in the training directory
if not os.path.exists("hinglish_dataset.json"):
    raise FileNotFoundError("hinglish_dataset.json not found. Run generate_dataset.py first.")

dataset = load_dataset("json", data_files="hinglish_dataset.json")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
# Set padding token
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

# Note: bitsandbytes may not work on Mac; 
# if this fails, we may need to remove load_in_8bit=True
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    load_in_8bit=True,
    device_map="auto"
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
    output_dir="./sarthi_model",
    per_device_train_batch_size=2,
    num_train_epochs=3,
    learning_rate=2e-4,
    logging_steps=10,
    save_steps=500,
    fp16=False, # Standard for Mac/MPS
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"]
)

trainer.train()

model.save_pretrained("./sarthi_model")
tokenizer.save_pretrained("./sarthi_model")
