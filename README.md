# 🧠 NextWordPrediction

An **LSTM-based Next Word Prediction** web application built with Deep Learning and Natural Language Processing (NLP).

The model reads a sequence of words and predicts what word is most likely to come next. It can also generate a longer passage by repeatedly feeding each prediction back into the model.

🔗 **Live Demo:** https://nextwordprediction1.onrender.com

---

## 📌 Overview

**NextWordPrediction** demonstrates how a Recurrent Neural Network (RNN), specifically an **LSTM (Long Short-Term Memory)** network, can learn sequential patterns in text and use them to predict the next word.

The project includes an interactive web interface where users can:

* ✍️ Enter a sentence and predict the next word
* 📝 Generate multiple words from a starting phrase
* 📋 Copy generated text
* 🔄 Reset the generated passage
* 🧠 Visualize the prediction pipeline while the model is running

The application is deployed online using **Render**.

---

## 🚀 Live Demo

👉 **[Try NextWordPrediction](https://nextwordprediction1.onrender.com)**

Example:

```text
Input:
The future of

Prediction:
...

```

The model can also generate a sequence of words starting from a user-provided phrase.

---

## ✨ Features

* 🧠 LSTM-based deep learning model
* 🔤 Text tokenization
* 📏 Sequence padding
* 🔮 Single next-word prediction
* 📝 Multi-word text generation
* ⚡ FastAPI backend
* 🌐 Interactive web interface
* 📋 Copy generated text
* 🔄 Reset functionality
* ☁️ Deployed on Render
* 📱 Responsive user interface

---

## 🧠 How It Works

The prediction pipeline follows these steps:

```text
User Input
    ↓
Tokenization
    ↓
Sequence Padding
    ↓
LSTM Model
    ↓
Predicted Word
    ↓
Generated Text
```

### 1. Text Input

The user enters a starting phrase.

Example:

```text
The future of
```

### 2. Tokenization

The input text is converted into numerical tokens using the trained tokenizer.

```text
"The future of"
        ↓
[12, 45, 78]
```

### 3. Sequence Padding

The sequence is padded to match the input length expected by the trained model.

### 4. LSTM Prediction

The padded sequence is passed through the trained LSTM neural network.

The model calculates the probability of possible next words and selects a prediction.

### 5. Text Generation

For multi-word generation, the predicted word is added to the input and the process is repeated.

```text
The future of
        ↓
The future of technology
        ↓
The future of technology is
        ↓
The future of technology is changing
```

---

## 🧩 LSTM Model Architecture

The core architecture is based on an LSTM recurrent neural network:

```text
Input Text
    ↓
Tokenizer
    ↓
Sequence Padding
    ↓
Embedding
    ↓
LSTM
    ↓
Dense / Softmax
    ↓
Predicted Next Word
```

### Why LSTM?

LSTM networks are designed to process sequential data and maintain information from previous steps in a sequence.

For next-word prediction, the model uses the words that came before the prediction to learn contextual patterns.

---

## 🛠️ Tech Stack

### Machine Learning / Deep Learning

* Python
* TensorFlow
* Keras
* NumPy
* LSTM
* Recurrent Neural Networks (RNN)
* Natural Language Processing (NLP)

### Backend

* FastAPI
* Uvicorn
* Pydantic

### Frontend

* HTML
* CSS
* JavaScript

### Deployment

* Render

---

## 📂 Project Structure

```text
NextWordPrediction/
│
├── README.md
├── requirements.txt
│
├── lstm_model.h5
├── tokenizer.pkl
├── max_len.pkl
│
├── NextWordPrediction.ipynb
│
├── backend/
│   └── main.py
│
└── frontend/
    ├── index.html
    ├── style.css
    └── script.js
```

## 🎯 Learning Objectives

This project was built to practice and demonstrate:

* Natural Language Processing
* Text preprocessing
* Tokenization
* Sequence generation
* Sequence padding
* Word-level language modeling
* Recurrent Neural Networks
* LSTM architecture
* Deep learning model training
* Model serialization
* FastAPI model deployment
* Frontend/backend integration
* Machine learning deployment

---

## 🔄 Future Improvements

Possible improvements include:

* 🔹 Beam Search decoding
* 🔹 Temperature-based sampling
* 🔹 Top-K / Top-P sampling
* 🔹 GRU comparison
* 🔹 Bidirectional LSTM experiments
* 🔹 Attention mechanisms
* 🔹 Transformer-based language model
* 🔹 Larger training corpus
* 🔹 Model evaluation using perplexity
* 🔹 Improved contextual predictions

---

## ⚠️ Limitations

This project is primarily an educational demonstration of LSTM-based language modeling.

Because the model is trained on a specific text corpus and uses a relatively small architecture compared with modern language models, its predictions may sometimes be repetitive, grammatically unusual, or unrelated to the user's intended meaning.

It should therefore be viewed as a demonstration of **sequence modeling and next-word prediction**, rather than a general-purpose language model.

---


