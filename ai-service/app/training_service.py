import numpy as np
from typing import List, Tuple, Dict, Any
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.metrics import classification_report, hamming_loss, accuracy_score, f1_score
from tensorflow import keras
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    Embedding, SimpleRNN, LSTM, Bidirectional,
    Dense, Dropout, Conv1D, GlobalMaxPooling1D, MaxPooling1D
)
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import Callback
import joblib
import os
import json
import pickle

class TrainingCallback(Callback):
    def __init__(self, job_manager, job_id: str, total_epochs: int):
        super().__init__()
        self.job_manager = job_manager
        self.job_id = job_id
        self.total_epochs = total_epochs
    def on_epoch_end(self, epoch, logs=None):
        logs = logs or {}
        progress = ((epoch + 1) / self.total_epochs) * 100
        self.job_manager.update_progress(
            self.job_id,
            current_epoch=epoch + 1,  
            total_epochs=self.total_epochs,
            progress=progress,
            
            current_loss=float(logs.get('loss', 0)),
            current_accuracy=float(logs.get('accuracy', 0)),
            
            val_loss=float(logs.get('val_loss', 0)),
            val_accuracy=float(logs.get('val_accuracy', 0))
        )
class TrainingService:
    def __init__(self, job_manager):
        self.job_manager = job_manager
    def prepare_data(
        self,
        samples: List[Dict[str, Any]],
        max_words: int,
        max_len: int,
        test_size: float = 0.3
    ) -> Tuple:    
        """
        Chuẩn bị dữ liệu cho multi-label classification.
        samples: List of dicts with 'title', 'content', 'labels' (list of label names)
        """
        # Kết hợp text từ title và content
        texts = [f"{s['title']} {s['content']}" for s in samples]
        # labels là list các nhãn cho mỗi email
        labels = [s['labels'] for s in samples]
        
        # Chia train/test
        X_train_text, X_test_text, y_train_labels, y_test_labels = train_test_split(
            texts,          
            labels,          
            test_size=test_size, 
            random_state=42, 
            shuffle=True     
        )
        
        # Tokenization
        tokenizer = Tokenizer(num_words=max_words)
        tokenizer.fit_on_texts(X_train_text + X_test_text)
        
        X_train_seq = tokenizer.texts_to_sequences(X_train_text)
        X_test_seq = tokenizer.texts_to_sequences(X_test_text)
        
        X_train = pad_sequences(
            X_train_seq,          
            maxlen=max_len,      
            padding='post'       
        )

        X_test = pad_sequences(
            X_test_seq,           
            maxlen=max_len,       
            padding='post'        
        )
        
        # Multi-label encoding
        mlb = MultiLabelBinarizer()
        y_train = mlb.fit_transform(y_train_labels)
        y_test = mlb.transform(y_test_labels)
        
        num_classes = len(mlb.classes_)
        label_names = mlb.classes_
        
        return X_train, X_test, y_train, y_test, tokenizer, mlb, num_classes, label_names
    def build_rnn_model(
        self,
        max_words: int,
        max_len: int,
        num_classes: int,
        embedding_dim: int = 128,
        rnn_units: int = 128,
        learning_rate: float = 0.0001
    ) -> Sequential:
        """Build RNN model for multi-label classification"""
        model = Sequential([
            Embedding(
                input_dim=max_words,       
                output_dim=embedding_dim,  
                input_length=max_len       
            ),
            SimpleRNN(
                rnn_units,                
                return_sequences=False     
            ),
            Dense(
                num_classes,               
                activation='sigmoid'  # Sigmoid for multi-label      
            )
        ])
        optimizer = Adam(learning_rate=learning_rate)
        model.compile(
            loss='binary_crossentropy',  # Binary crossentropy for multi-label
            optimizer=optimizer,              
            metrics=[
                'binary_accuracy',
                keras.metrics.AUC(name='auc'),
                keras.metrics.Precision(name='precision'),
                keras.metrics.Recall(name='recall')
            ]              
        )
        return model
    def build_lstm_model(
        self,
        max_words: int,
        max_len: int,
        num_classes: int,
        embedding_dim: int = 128,
        lstm_units: int = 128,
        learning_rate: float = 0.0001
    ) -> Sequential:
        """Build LSTM model for multi-label classification"""
        model = Sequential([
            Embedding(
                input_dim=max_words,       
                output_dim=embedding_dim,   
                input_length=max_len        
            ),
            LSTM(
                lstm_units,                 
                dropout=0.3,                
                recurrent_dropout=0.3       
            ),
            Dense(
                128,                      
                activation='relu'           
            ),
            Dropout(0.4),                  
            Dense(
                num_classes,                
                activation='sigmoid'  # Sigmoid for multi-label       
            )
        ])
        model.compile(
            loss='binary_crossentropy',  # Binary crossentropy for multi-label   
            optimizer=Adam(learning_rate=learning_rate),  
            metrics=[
                'binary_accuracy',
                keras.metrics.AUC(name='auc'),
                keras.metrics.Precision(name='precision'),
                keras.metrics.Recall(name='recall')
            ]             
        )
        return model
    def build_bilstm_model(
        self,
        max_words: int,
        max_len: int,
        num_classes: int,
        embedding_dim: int = 128,
        rnn_units: int = 128,
        learning_rate: float = 0.0001
    ) -> Sequential:
        """Build BiLSTM model for multi-label classification"""
        model = Sequential([
            Embedding(
                input_dim=max_words,        
                output_dim=embedding_dim,   
                input_length=max_len        
            ),
            Bidirectional(
                LSTM(
                    rnn_units,              
                    dropout=0.3,            
                    recurrent_dropout=0.3   
                )
            ),
            Dense(
                128,                      
                activation='relu'          
            ),
            Dropout(0.5),                  
            Dense(
                num_classes,               
                activation='sigmoid'  # Sigmoid for multi-label      
            )
        ])
        optimizer = Adam(learning_rate=learning_rate)
        model.compile(
            loss='binary_crossentropy',  # Binary crossentropy for multi-label 
            optimizer=optimizer,             
            metrics=[
                'binary_accuracy',
                keras.metrics.AUC(name='auc'),
                keras.metrics.Precision(name='precision'),
                keras.metrics.Recall(name='recall')
            ]              
        )
        return model
    def build_cnn_model(
        self,
        max_words: int,
        max_len: int,
        num_classes: int,
        embedding_dim: int = 128,
        num_filters: int = 128,
        kernel_size: int = 5,
        learning_rate: float = 0.0001
    ) -> Sequential:
        """Build CNN model for multi-label classification"""
        model = Sequential([
            Embedding(
                input_dim=max_words,        
                output_dim=embedding_dim,  
                input_length=max_len       
            ),
            Conv1D(
                filters=num_filters,      
                kernel_size=kernel_size,   
                activation='relu'          
            ),
            GlobalMaxPooling1D(),
            Dropout(0.5),        
            Dense(
                num_classes,              
                activation='sigmoid'  # Sigmoid for multi-label    
            )
        ])
        model.compile(
            loss='binary_crossentropy',  # Binary crossentropy for multi-label           
            optimizer=Adam(learning_rate=learning_rate),  
            metrics=[
                'binary_accuracy',
                keras.metrics.AUC(name='auc'),
                keras.metrics.Precision(name='precision'),
                keras.metrics.Recall(name='recall')
            ]                          
        )
        return model
    def build_bilstm_cnn_model(
        self,
        max_words: int,
        max_len: int,
        num_classes: int,
        learning_rate: float = 0.0001
    ) -> Sequential:
        """Build BiLSTM+CNN model for multi-label classification"""
        model = Sequential([
            Embedding(
                max_words, 128,                       
                input_length=max_len        
            ),
            Conv1D(
                64, 5, activation="relu"      
            ),
            MaxPooling1D(pool_size=2),
            Bidirectional(
                LSTM(
                    128, return_sequences=True   
                )
            ),
            GlobalMaxPooling1D(),
            Dense(
                128,                     
                activation="relu"          
            ),
            Dropout(0.4),  
            Dense(
                num_classes,              
                activation="sigmoid"  # Sigmoid for multi-label     
            )
        ])
        model.compile(
            loss="binary_crossentropy",  # Binary crossentropy for multi-label  
            optimizer="adam",                   # Adam với default lr
            metrics=[
                'binary_accuracy',
                keras.metrics.AUC(name='auc'),
                keras.metrics.Precision(name='precision'),
                keras.metrics.Recall(name='recall')
            ]                # Metrics
        )
        return model
    def build_model(
        self,
        model_type: str,
        max_words: int,
        max_len: int,
        num_classes: int,
        learning_rate: float = 0.0001
    ) -> Sequential:
        if model_type == 'RNN':
            return self.build_rnn_model(max_words, max_len, num_classes, learning_rate=learning_rate)
        
        elif model_type == 'LSTM':
            return self.build_lstm_model(max_words, max_len, num_classes, learning_rate=learning_rate)
        
        elif model_type == 'BiLSTM':
            return self.build_bilstm_model(max_words, max_len, num_classes, learning_rate=learning_rate)
        
        elif model_type == 'CNN':
            return self.build_cnn_model(max_words, max_len, num_classes, learning_rate=learning_rate)
        
        elif model_type == 'BiLSTM+CNN':
            return self.build_bilstm_cnn_model(max_words, max_len, num_classes, learning_rate=learning_rate)
        
        else:
            raise ValueError(f"Unknown model type: {model_type}")
    def train_model(
        self,
        job_id: str,
        model_type: str,
        samples: List[Dict[str, Any]],
        hyperparameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        try:
            print(f" Starting training for job {job_id}")
            print(f"   Model type: {model_type}")
            print(f"   Samples: {len(samples)}")
            print(f"   Hyperparameters: {hyperparameters}")
            
            self.job_manager.update_status(job_id, 'running')
            
            epochs = hyperparameters.get('epochs', 25)
            batch_size = hyperparameters.get('batch_size', 32)
            learning_rate = hyperparameters.get('learning_rate', 0.0001)
            max_words = hyperparameters.get('max_words', 50000)
            max_len = hyperparameters.get('max_len', 256)
            
            print(" Preparing data...")
            X_train, X_test, y_train, y_test, tokenizer, mlb, num_classes, label_names = \
                self.prepare_data(samples, max_words, max_len)
            
            print(f"   Train samples: {len(X_train)}")
            print(f"   Test samples: {len(X_test)}")
            print(f"   Number of classes: {num_classes}")
            print(f"   Classes: {label_names}")
            
            print(f"Building {model_type} model...")
            model = self.build_model(model_type, max_words, max_len, num_classes, learning_rate)
            model.summary()
            
            callback = TrainingCallback(self.job_manager, job_id, epochs)
            
            print(f" Training model for {epochs} epochs...")
            history = model.fit(
                X_train, y_train,                  
                validation_data=(X_test, y_test),   
                epochs=epochs,                  
                batch_size=batch_size,         
                callbacks=[callback],           
                verbose=1                       
            )
            
            print(" Evaluating model...")
            test_results = model.evaluate(X_test, y_test, verbose=0)
            test_loss = test_results[0]
            test_accuracy = test_results[1]
            
            # Predictions
            y_pred_probs = model.predict(X_test, verbose=0) 
            y_pred_binary = (y_pred_probs > 0.5).astype(int)
            
            # Multi-label metrics
            hamming = hamming_loss(y_test, y_pred_binary)
            subset_acc = accuracy_score(y_test, y_pred_binary)
            f1_macro = f1_score(y_test, y_pred_binary, average='macro', zero_division=0)
            f1_micro = f1_score(y_test, y_pred_binary, average='micro', zero_division=0)
            f1_weighted = f1_score(y_test, y_pred_binary, average='weighted', zero_division=0)
            
            # Classification report per label
            report = classification_report(
                y_test,
                y_pred_binary,
                target_names=label_names,
                output_dict=True,
                zero_division=0
            )
            
            results = {
                'model': model,                    
                'tokenizer': tokenizer,            
                'label_binarizer': mlb,  # Changed from label_encoder to label_binarizer
                'metadata': {
                    'model_type': model_type,       
                    'max_words': max_words,         
                    'max_len': max_len,             
                    'num_classes': num_classes,      
                    'classes': label_names.tolist(),  
                    'hyperparameters': hyperparameters,
                    'is_multilabel': True  # Flag to indicate multi-label
                },
                'metrics': {
                    'testLoss': float(test_loss),               
                    'testAccuracy': float(test_accuracy),
                    'hammingLoss': float(hamming),
                    'subsetAccuracy': float(subset_acc),
                    'f1Macro': float(f1_macro),
                    'f1Micro': float(f1_micro),
                    'f1Weighted': float(f1_weighted),
                    'classificationReport': report,            
                    'confusionMatrix': None  # Confusion matrix not typically used for multi-label
                },
                'history': {
                    'loss': [float(x) for x in history.history['loss']],
                    'accuracy': [float(x) for x in history.history['binary_accuracy']],
                    'val_loss': [float(x) for x in history.history['val_loss']],
                    'val_accuracy': [float(x) for x in history.history['val_binary_accuracy']]
                }
            }
            
            self.job_manager.complete_job(job_id, results)
            print(f" Training completed for job {job_id}")
            print(f"   Test Loss: {test_loss:.4f}")
            print(f"   Test Binary Accuracy: {test_accuracy:.4f}")
            print(f"   Hamming Loss: {hamming:.4f}")
            print(f"   Subset Accuracy: {subset_acc:.4f}")
            print(f"   F1 Macro: {f1_macro:.4f}")
            
            return results
            
        except Exception as e:
            print(f" Training failed for job {job_id}: {str(e)}")
            self.job_manager.fail_job(job_id, str(e))
            raise
    def save_model(
        self,
        job_id: str,
        model_name: str,
        output_dir: str = 'ml_models'
    ) -> str:
        """
        Lưu mô hình đã huấn luyện, tokenizer, và label_binarizer
        """
        job = self.job_manager.get_job(job_id)
        if not job or job['status'] != 'completed':
            raise ValueError(f"Job {job_id} not completed")
        
        results = job.get('_full_results')
        if not results:
            raise ValueError(f"No full results found for job {job_id}")
        
        os.makedirs(output_dir, exist_ok=True)
        
        # Lưu model
        model_path = os.path.join(output_dir, f"{model_name}.h5")
        results['model'].save(model_path)
        print(f" Model saved to: {model_path}")
        
        # Lưu tokenizer
        tokenizer_path = os.path.join(output_dir, 'tokenizer.pkl')
        with open(tokenizer_path, 'wb') as f:
            pickle.dump(results['tokenizer'], f)
        print(f" Tokenizer saved to: {tokenizer_path}")
        
        # Lưu label binarizer (cho multi-label)
        label_binarizer_path = os.path.join(output_dir, 'label_binarizer.pkl')
        with open(label_binarizer_path, 'wb') as f:
            pickle.dump(results['label_binarizer'], f)
        print(f" Label binarizer saved to: {label_binarizer_path}")
        
        # Lưu metadata
        metadata = results['metadata'].copy()
        metadata['test_metrics'] = results['metrics']
        
        metadata_path = os.path.join(output_dir, 'model_metadata.json')
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        print(f" Metadata saved to: {metadata_path}")
        
        return model_path