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
    def __init__(self, job_manager, job_id: str, total_epochs: int, update_freq: int = 10):
        super().__init__()
        self.job_manager = job_manager
        self.job_id = job_id
        self.total_epochs = total_epochs
        self.update_freq = update_freq
        self.current_epoch = 0
        self.total_batches = 0
        
    def on_epoch_begin(self, epoch, logs=None):
        self.current_epoch = epoch
        
    def on_train_batch_end(self, batch, logs=None):
        if self.total_batches == 0:
            self.total_batches = self.params['steps']
        
        if batch % self.update_freq == 0 or batch == self.total_batches - 1:
            logs = logs or {}
            epoch_progress = (batch + 1) / self.total_batches
            total_progress = ((self.current_epoch + epoch_progress) / self.total_epochs) * 100
            
            log_message = (
                f"{batch + 1}/{self.total_batches} "
                f"- auc: {logs.get('auc', 0):.4f} "
                f"- binary_accuracy: {logs.get('binary_accuracy', 0):.4f} "
                f"- loss: {logs.get('loss', 0):.4f}"
            )
            
            if logs.get('precision') is not None:
                log_message += f" - precision: {logs.get('precision', 0):.4f}"
            if logs.get('recall') is not None:
                log_message += f" - recall: {logs.get('recall', 0):.4f}"
            
            self.job_manager.update_progress(
                self.job_id,
                current_epoch=self.current_epoch + 1,
                total_epochs=self.total_epochs,
                current_batch=batch + 1,
                total_batches=self.total_batches,
                progress=total_progress,
                current_loss=float(logs.get('loss', 0)),
                current_accuracy=float(logs.get('binary_accuracy', 0)),
                current_auc=float(logs.get('auc', 0)),
                current_precision=float(logs.get('precision', 0)),
                current_recall=float(logs.get('recall', 0)),
                log_message=log_message
            )
    
    def on_epoch_end(self, epoch, logs=None):
        logs = logs or {}
        progress = ((epoch + 1) / self.total_epochs) * 100
        
        log_message = (
            f"Epoch {epoch + 1}/{self.total_epochs} "
            f"- loss: {logs.get('loss', 0):.4f} "
            f"- binary_accuracy: {logs.get('binary_accuracy', 0):.4f} "
            f"- auc: {logs.get('auc', 0):.4f} "
            f"- precision: {logs.get('precision', 0):.4f} "
            f"- recall: {logs.get('recall', 0):.4f} "
            f"- val_loss: {logs.get('val_loss', 0):.4f} "
            f"- val_binary_accuracy: {logs.get('val_binary_accuracy', 0):.4f} "
            f"- val_auc: {logs.get('val_auc', 0):.4f} "
            f"- val_precision: {logs.get('val_precision', 0):.4f} "
            f"- val_recall: {logs.get('val_recall', 0):.4f}"
        )
        
        self.job_manager.update_progress(
            self.job_id,
            current_epoch=epoch + 1,
            total_epochs=self.total_epochs,
            progress=progress,
            current_loss=float(logs.get('loss', 0)),
            current_accuracy=float(logs.get('binary_accuracy', 0)),
            current_auc=float(logs.get('auc', 0)),
            current_precision=float(logs.get('precision', 0)),
            current_recall=float(logs.get('recall', 0)),
            val_loss=float(logs.get('val_loss', 0)),
            val_accuracy=float(logs.get('val_binary_accuracy', 0)),
            val_auc=float(logs.get('val_auc', 0)),
            val_precision=float(logs.get('val_precision', 0)),
            val_recall=float(logs.get('val_recall', 0)),
            log_message=log_message
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
        texts = [f"{s['title']} {s['content']}" for s in samples]
        labels = [s['labels'] for s in samples]
        
        X_train_text, X_test_text, y_train_labels, y_test_labels = train_test_split(
            texts,
            labels,
            test_size=test_size,
            random_state=42,
            shuffle=True
        )
        
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
                activation='sigmoid'
            )
        ])
        optimizer = Adam(learning_rate=learning_rate)
        model.compile(
            loss='binary_crossentropy',
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
                activation='sigmoid'
            )
        ])
        model.compile(
            loss='binary_crossentropy',
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
                activation='sigmoid'
            )
        ])
        optimizer = Adam(learning_rate=learning_rate)
        model.compile(
            loss='binary_crossentropy',
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
                activation='sigmoid'
            )
        ])
        model.compile(
            loss='binary_crossentropy',
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
                activation="sigmoid"
            )
        ])
        model.compile(
            loss="binary_crossentropy",
            optimizer="adam",
            metrics=[
                'binary_accuracy',
                keras.metrics.AUC(name='auc'),
                keras.metrics.Precision(name='precision'),
                keras.metrics.Recall(name='recall')
            ]
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
            self.job_manager.update_status(job_id, 'running')
            
            log_msg = f"Starting training for job {job_id}"
            print(f" {log_msg}")
            self.job_manager.update_progress(job_id, 0, 1, 0, log_message=log_msg)
            
            log_msg = f"Model type: {model_type}"
            print(f"   {log_msg}")
            self.job_manager.update_progress(job_id, 0, 1, 0, log_message=log_msg)
            
            log_msg = f"Samples: {len(samples)}"
            print(f"   {log_msg}")
            self.job_manager.update_progress(job_id, 0, 1, 0, log_message=log_msg)
            
            epochs = hyperparameters.get('epochs', 25)
            batch_size = hyperparameters.get('batch_size', 32)
            learning_rate = hyperparameters.get('learning_rate', 0.0001)
            max_words = hyperparameters.get('max_words', 50000)
            max_len = hyperparameters.get('max_len', 256)
            
            log_msg = "Preparing data..."
            print(f" {log_msg}")
            self.job_manager.update_progress(job_id, 0, 1, 0, log_message=log_msg)
            
            X_train, X_test, y_train, y_test, tokenizer, mlb, num_classes, label_names = \
                self.prepare_data(samples, max_words, max_len)
            
            log_msg = f"Train samples: {len(X_train)}, Test samples: {len(X_test)}"
            print(f"   {log_msg}")
            self.job_manager.update_progress(job_id, 0, 1, 0, log_message=log_msg)
            
            log_msg = f"Number of classes: {num_classes}"
            print(f"   {log_msg}")
            self.job_manager.update_progress(job_id, 0, 1, 0, log_message=log_msg)
            
            log_msg = f"Building {model_type} model..."
            print(f" {log_msg}")
            self.job_manager.update_progress(job_id, 0, 1, 0, log_message=log_msg)
            
            model = self.build_model(model_type, max_words, max_len, num_classes, learning_rate)
            model.summary()
            
            callback = TrainingCallback(self.job_manager, job_id, epochs)
            
            log_msg = f"Training model for {epochs} epochs..."
            print(f" {log_msg}")
            self.job_manager.update_progress(job_id, 0, epochs, 0, log_message=log_msg)
            
            history = model.fit(
                X_train, y_train,
                validation_data=(X_test, y_test),
                epochs=epochs,
                batch_size=batch_size,
                callbacks=[callback],
                verbose=1
            )
            
            log_msg = "Evaluating model..."
            print(f" {log_msg}")
            self.job_manager.update_progress(job_id, epochs, epochs, 100, log_message=log_msg)
            test_results = model.evaluate(X_test, y_test, verbose=0)
            test_loss = test_results[0]
            test_accuracy = test_results[1]
            
            y_pred_probs = model.predict(X_test, verbose=0)
            y_pred_binary = (y_pred_probs > 0.5).astype(int)
            
            hamming = hamming_loss(y_test, y_pred_binary)
            subset_acc = accuracy_score(y_test, y_pred_binary)
            f1_macro = f1_score(y_test, y_pred_binary, average='macro', zero_division=0)
            f1_micro = f1_score(y_test, y_pred_binary, average='micro', zero_division=0)
            f1_weighted = f1_score(y_test, y_pred_binary, average='weighted', zero_division=0)
            
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
                'label_binarizer': mlb,
                'metadata': {
                    'model_type': model_type,
                    'max_words': max_words,
                    'max_len': max_len,
                    'num_classes': num_classes,
                    'classes': label_names.tolist(),
                    'hyperparameters': hyperparameters,
                    'is_multilabel': True
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
                    'confusionMatrix': None
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
        
        model_path = os.path.join(output_dir, f"{model_name}.h5")
        results['model'].save(model_path)
        print(f" Model saved to: {model_path}")
        
        tokenizer_path = os.path.join(output_dir, 'tokenizer.pkl')
        with open(tokenizer_path, 'wb') as f:
            pickle.dump(results['tokenizer'], f)
        print(f" Tokenizer saved to: {tokenizer_path}")
        
        label_binarizer_path = os.path.join(output_dir, 'label_binarizer.pkl')
        with open(label_binarizer_path, 'wb') as f:
            pickle.dump(results['label_binarizer'], f)
        print(f" Label binarizer saved to: {label_binarizer_path}")
        
        metadata = results['metadata'].copy()
        metadata['test_metrics'] = results['metrics']
        
        metadata_path = os.path.join(output_dir, 'model_metadata.json')
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        print(f" Metadata saved to: {metadata_path}")
        
        return model_path