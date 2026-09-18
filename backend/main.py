import pickle
from pathlib import Path
from typing import List

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from tensorflow import keras
from tensorflow.keras.preprocessing.sequence import pad_sequences

# ---------------------------------------------------------------------------
# Paths — the model/tokenizer/max_len files live at the project root, one
# level above this file (backend/main.py -> ../lstm_model.h5)
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "lstm_model.h5"
TOKENIZER_PATH = BASE_DIR / "tokenizer.pkl"
MAX_LEN_PATH = BASE_DIR / "max_len.pkl"

MAX_WORDS_PER_GENERATE = 50  # sane upper bound so a bad request can't hang the server

# ---------------------------------------------------------------------------
# Load model + preprocessing artifacts once, at startup
# ---------------------------------------------------------------------------
print("Loading model, tokenizer and max_len ...")

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
if not TOKENIZER_PATH.exists():
    raise FileNotFoundError(f"Tokenizer file not found at {TOKENIZER_PATH}")
if not MAX_LEN_PATH.exists():
    raise FileNotFoundError(f"max_len file not found at {MAX_LEN_PATH}")

model = keras.models.load_model(MODEL_PATH)

with open(TOKENIZER_PATH, "rb") as f:
    tokenizer = pickle.load(f)

with open(MAX_LEN_PATH, "rb") as f:
    max_len = pickle.load(f)

print(f"Model loaded. Input length expected by the model: {max_len}")

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="NextWord AI", description="LSTM next-word prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # local/demo project — open to any origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    text: str = Field(..., description="Starting phrase to predict the next word for")


class PredictResponse(BaseModel):
    input_text: str
    predicted_word: str


class GenerateRequest(BaseModel):
    text: str = Field(..., description="Starting phrase to generate from")
    num_words: int = Field(10, ge=1, le=MAX_WORDS_PER_GENERATE, description="How many words to generate")


class GenerateResponse(BaseModel):
    input_text: str
    generated_text: str
    words_added: List[str]


# ---------------------------------------------------------------------------
# Core prediction logic — mirrors the exact preprocessing used at training
# time: tokenizer -> texts_to_sequences -> pad_sequences(maxlen=max_len,
# padding='pre') -> model.predict -> argmax -> index_word lookup.
# ---------------------------------------------------------------------------
def predict_next_word(text: str) -> str:
    sequence = tokenizer.texts_to_sequences([text])[0]

    if len(sequence) == 0:
        raise ValueError(
            "None of the words in that phrase were recognized by the tokenizer."
        )

    padded = pad_sequences([sequence], maxlen=max_len, padding="pre")

    predicted_probs = model.predict(padded, verbose=0)[0]
    predicted_index = int(np.argmax(predicted_probs))

    # index 0 is the padding token and has no associated word
    word = tokenizer.index_word.get(predicted_index)
    if not word:
        raise ValueError("The model could not produce a confident next word for this input.")

    return word


def generate_words(text: str, num_words: int) -> List[str]:
    current_text = text
    generated: List[str] = []

    for _ in range(num_words):
        try:
            next_word = predict_next_word(current_text)
        except ValueError:
            # Stop gracefully instead of erroring out if generation runs dry
            break
        generated.append(next_word)
        current_text = f"{current_text} {next_word}"

    return generated


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/")
def health_check():
    return {
        "status": "ok",
        "model": "LSTM",
        "task": "next-word-prediction",
        "expected_input_length": max_len,
    }


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Input text cannot be empty.")

    try:
        word = predict_next_word(text)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Prediction failed. Please try a different phrase.")

    return PredictResponse(input_text=text, predicted_word=word)


@app.post("/generate", response_model=GenerateResponse)
def generate(request: GenerateRequest):
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Input text cannot be empty.")

    try:
        words = generate_words(text, request.num_words)
    except Exception:
        raise HTTPException(status_code=500, detail="Text generation failed. Please try a different phrase.")

    if not words:
        raise HTTPException(
            status_code=422,
            detail="The model could not generate any words from this input.",
        )

    generated_text = f"{text} {' '.join(words)}"
    return GenerateResponse(input_text=text, generated_text=generated_text, words_added=words)
