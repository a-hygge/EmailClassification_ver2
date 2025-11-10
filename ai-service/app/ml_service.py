import json
import os
from typing import Tuple, Dict, Any, List
import joblib 
import numpy as np 
import pickle
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
from .db_helper import get_active_model
class MLService:
    _instance = None
    _model = None
    _tokenizer = None
    _label_binarizer = None  # Changed from _label_encoder to _label_binarizer
    _metadata = None
    _model_loaded = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MLService, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._model_loaded:
            self.load_model()
            
    def load_model(self) -> None:
        """Load model, tokenizer, and label binarizer for multi-label classification"""
        try:
            model_path_from_db = get_active_model()
            if model_path_from_db:
                print(f"Using model from db: {model_path_from_db}")
                model_path = model_path_from_db
            else:
                print("No active model in db")
                model_path = os.getenv('MODEL_PATH','ml_models/email_cnn_model.h5')
            
            tokenizer_path = os.getenv('TOKENIZER_PATH','ml_models/tokenizer.pkl')
            label_binarizer_path = os.getenv('LABEL_BINARIZER_PATH','ml_models/label_binarizer.pkl')
            metadata_path = os.getenv('METADATA_PATH','ml_models/model_metadata.json')
            
            print(f"Loading model from: {model_path}")
            self._model = load_model(model_path)
            
            # Load tokenizer
            with open(tokenizer_path, 'rb') as f:
                self._tokenizer = pickle.load(f)
            
            # Load label binarizer (for multi-label)
            with open(label_binarizer_path, 'rb') as f:
                self._label_binarizer = pickle.load(f)
            
            # Load metadata with UTF-8 encoding
            with open(metadata_path, 'r', encoding='utf-8') as f:
                self._metadata = json.load(f)
            
            self._model_loaded = True
            print("Model loaded successfully")
            print(f"Labels: {self._label_binarizer.classes_}")
            
        except Exception as e:
            print(f"Error: {str(e)}")
            raise RuntimeError(f"Failed to load model: {str(e)}")
    def is_model_loaded(self) -> bool:
        return self._model_loaded
    def preprocass_text(self, text: str) -> np.ndarray:
        sequence = self._tokenizer.texts_to_sequences([text])
        max_len = self._metadata.get('max_len', 256)
        padded = pad_sequences(
            sequence,
            maxlen=max_len,
            padding = 'post',
            truncating = 'post'
        )
        return padded
    def predict(self, title: str, content: str, threshold: float = 0.5) -> List[Dict[str, Any]]:
        """
        Predict labels for multi-label classification
        Returns: List of predicted labels with confidence scores
        """
        if not self._model_loaded:
            raise RuntimeError("Model not loaded")
        
        try:
            combined_text = f"{title} {content}"
            preprocessed = self.preprocass_text(combined_text)
            
            # Get probabilities for all labels
            probabilities = self._model.predict(preprocessed, verbose=0)[0]
            
            # Get all labels with confidence above threshold
            predicted_labels = []
            for idx, prob in enumerate(probabilities):
                if prob >= threshold:
                    label_name = self._label_binarizer.classes_[idx]
                    predicted_labels.append({
                        'label': label_name,
                        'confidence': float(prob)
                    })
            
            # Sort by confidence (highest first)
            predicted_labels.sort(key=lambda x: x['confidence'], reverse=True)
            
            # If no labels above threshold, return top label
            if len(predicted_labels) == 0:
                top_idx = np.argmax(probabilities)
                predicted_labels.append({
                    'label': self._label_binarizer.classes_[top_idx],
                    'confidence': float(probabilities[top_idx])
                })
            
            return predicted_labels
            
        except Exception as e:
            raise RuntimeError(f"Prediction failed: {str(e)}")
    def get_model_info(self) -> Dict[str, Any]:
        """Get model information including multi-label specific info"""
        if not self._model_loaded:
            return {"loaded": False}
        
        return {
            "loaded": True,
            "max_len": self._metadata.get('max_len'),
            "num_classes": self._metadata.get('num_classes'),
            "classes": self._metadata.get('classes', []),
            "is_multilabel": self._metadata.get('is_multilabel', True),
            "model_type": self._metadata.get('model_type', 'Unknown')
        }