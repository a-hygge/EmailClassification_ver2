"""
Script huấn luyện mô hình phân loại email đa nhãn
Sử dụng CNN với Sigmoid activation thay vì Softmax
"""

import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MultiLabelBinarizer
import matplotlib.pyplot as plt
import os

# Thiết lập seed
np.random.seed(42)
tf.random.set_seed(42)

# Đọc dữ liệu
print("Đang đọc dữ liệu...")
data_file = r'D:\EmailClassification-1\EmailClassification\MultiLabel_Classification\data_multilabel.json'
with open(data_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Tổng số mẫu: {len(data)}")

# Chuẩn bị dữ liệu
texts = [item['Text'] for item in data]
labels = [item['Labels'] for item in data]

# Chuyển đổi nhãn sang binary format
mlb = MultiLabelBinarizer()
y = mlb.fit_transform(labels)
label_names = mlb.classes_

print(f"Số lượng nhãn: {len(label_names)}")
print(f"Các nhãn: {label_names}")

# Tokenization
max_words = 10000
max_len = 200

tokenizer = keras.preprocessing.text.Tokenizer(num_words=max_words)
tokenizer.fit_on_texts(texts)
X = tokenizer.texts_to_sequences(texts)
X = keras.preprocessing.sequence.pad_sequences(X, maxlen=max_len)

print(f"Kích thước dữ liệu: {X.shape}")
print(f"Kích thước nhãn: {y.shape}")

# Chia dữ liệu train/validation/test
X_temp, X_test, y_temp, y_test = train_test_split(
    X, y, test_size=0.15, random_state=42
)
X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp, test_size=0.176, random_state=42  # 0.176 * 0.85 ≈ 0.15
)

print(f"\nKích thước tập dữ liệu:")
print(f"Train: {X_train.shape[0]} mẫu")
print(f"Validation: {X_val.shape[0]} mẫu")
print(f"Test: {X_test.shape[0]} mẫu")

# Xây dựng mô hình RNN cho đa nhãn
def build_multilabel_rnn():
    model = keras.Sequential([
        layers.Embedding(max_words, 128, input_length=max_len),
        layers.SimpleRNN(128, return_sequences=False),
        layers.Dense(len(label_names), activation='sigmoid')
    ])
    
    model.compile(
        optimizer='adam',
        loss='binary_crossentropy',
        metrics=[
            'binary_accuracy',
            keras.metrics.AUC(name='auc'),
            keras.metrics.Precision(name='precision'),
            keras.metrics.Recall(name='recall')
        ]
    )
    
    return model

# Xây dựng mô hình LSTM cho đa nhãn
def build_multilabel_lstm():
    model = keras.Sequential([
        layers.Embedding(max_words, 128, input_length=max_len),
        layers.LSTM(128, dropout=0.3, recurrent_dropout=0.3),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.4),
        layers.Dense(len(label_names), activation='sigmoid')
    ])
    
    model.compile(
        optimizer='adam',
        loss='binary_crossentropy',
        metrics=[
            'binary_accuracy',
            keras.metrics.AUC(name='auc'),
            keras.metrics.Precision(name='precision'),
            keras.metrics.Recall(name='recall')
        ]
    )
    
    return model

# Xây dựng mô hình BiLSTM cho đa nhãn
def build_multilabel_bilstm():
    model = keras.Sequential([
        layers.Embedding(max_words, 128, input_length=max_len),
        layers.Bidirectional(layers.LSTM(128, dropout=0.3, recurrent_dropout=0.3)),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.5),
        layers.Dense(len(label_names), activation='sigmoid')
    ])
    
    model.compile(
        optimizer='adam',
        loss='binary_crossentropy',
        metrics=[
            'binary_accuracy',
            keras.metrics.AUC(name='auc'),
            keras.metrics.Precision(name='precision'),
            keras.metrics.Recall(name='recall')
        ]
    )
    
    return model

# Xây dựng mô hình CNN cho đa nhãn
def build_multilabel_cnn():
    model = keras.Sequential([
        layers.Embedding(max_words, 128, input_length=max_len),
        layers.Dropout(0.3),
        
        layers.Conv1D(128, 5, activation='relu'),
        layers.MaxPooling1D(pool_size=2),
        layers.Dropout(0.3),
        
        layers.Conv1D(64, 5, activation='relu'),
        layers.MaxPooling1D(pool_size=2),
        layers.Dropout(0.3),
        
        layers.GlobalMaxPooling1D(),
        
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.5),
        
        # Sigmoid cho đa nhãn (thay vì softmax)
        layers.Dense(len(label_names), activation='sigmoid')
    ])
    
    # Binary crossentropy cho đa nhãn
    model.compile(
        optimizer='adam',
        loss='binary_crossentropy',
        metrics=[
            'binary_accuracy',
            keras.metrics.AUC(name='auc'),
            keras.metrics.Precision(name='precision'),
            keras.metrics.Recall(name='recall')
        ]
    )
    
    return model

# Xây dựng mô hình BiLSTM+CNN cho đa nhãn
def build_multilabel_bilstm_cnn():
    model = keras.Sequential([
        layers.Embedding(max_words, 128, input_length=max_len),
        layers.Conv1D(64, 5, activation='relu'),
        layers.MaxPooling1D(pool_size=2),
        layers.Bidirectional(layers.LSTM(128, return_sequences=True)),
        layers.GlobalMaxPooling1D(),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.4),
        layers.Dense(len(label_names), activation='sigmoid')
    ])
    
    model.compile(
        optimizer='adam',
        loss='binary_crossentropy',
        metrics=[
            'binary_accuracy',
            keras.metrics.AUC(name='auc'),
            keras.metrics.Precision(name='precision'),
            keras.metrics.Recall(name='recall')
        ]
    )
    
    return model

print("\nXây dựng mô hình CNN đa nhãn...")
model = build_multilabel_cnn()
model.summary()

# Callbacks
callbacks = [
    keras.callbacks.EarlyStopping(
        monitor='val_loss',
        patience=5,
        restore_best_weights=True
    ),
    keras.callbacks.ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=3,
        min_lr=1e-7
    )
]

# Huấn luyện
print("\nBắt đầu huấn luyện...")
history = model.fit(
    X_train, y_train,
    batch_size=32,
    epochs=50,
    validation_data=(X_val, y_val),
    callbacks=callbacks,
    verbose=1
)

# Đánh giá trên tập test
print("\nĐánh giá trên tập test...")
test_results = model.evaluate(X_test, y_test, verbose=0)
print(f"Test Loss: {test_results[0]:.4f}")
print(f"Test Binary Accuracy: {test_results[1]:.4f}")
print(f"Test AUC: {test_results[2]:.4f}")
print(f"Test Precision: {test_results[3]:.4f}")
print(f"Test Recall: {test_results[4]:.4f}")

# Dự đoán và phân tích
y_pred = model.predict(X_test)
y_pred_binary = (y_pred > 0.5).astype(int)

# Tính các metrics chi tiết
from sklearn.metrics import hamming_loss, accuracy_score, f1_score, classification_report

print("\n=== Metrics đa nhãn ===")
print(f"Hamming Loss: {hamming_loss(y_test, y_pred_binary):.4f}")
print(f"Subset Accuracy: {accuracy_score(y_test, y_pred_binary):.4f}")
print(f"F1-Score (Macro): {f1_score(y_test, y_pred_binary, average='macro'):.4f}")
print(f"F1-Score (Micro): {f1_score(y_test, y_pred_binary, average='micro'):.4f}")
print(f"F1-Score (Weighted): {f1_score(y_test, y_pred_binary, average='weighted'):.4f}")

# Classification report cho từng nhãn
print("\n=== Classification Report (từng nhãn) ===")
print(classification_report(y_test, y_pred_binary, target_names=label_names, zero_division=0))

# Lưu mô hình
model_dir = r'D:\EmailClassification-1\EmailClassification\MultiLabel_Classification\models'
os.makedirs(model_dir, exist_ok=True)

model_path = os.path.join(model_dir, 'email_multilabel_cnn.h5')
model.save(model_path)
print(f"\nĐã lưu mô hình tại: {model_path}")

# Lưu tokenizer
import pickle
tokenizer_path = os.path.join(model_dir, 'tokenizer.pkl')
with open(tokenizer_path, 'wb') as f:
    pickle.dump(tokenizer, f)
print(f"Đã lưu tokenizer tại: {tokenizer_path}")

# Lưu label binarizer
mlb_path = os.path.join(model_dir, 'label_binarizer.pkl')
with open(mlb_path, 'wb') as f:
    pickle.dump(mlb, f)
print(f"Đã lưu label binarizer tại: {mlb_path}")

# Lưu metadata
metadata = {
    'max_words': max_words,
    'max_len': max_len,
    'label_names': label_names.tolist(),
    'num_labels': len(label_names),
    'train_samples': X_train.shape[0],
    'val_samples': X_val.shape[0],
    'test_samples': X_test.shape[0],
    'test_metrics': {
        'loss': float(test_results[0]),
        'binary_accuracy': float(test_results[1]),
        'auc': float(test_results[2]),
        'precision': float(test_results[3]),
        'recall': float(test_results[4]),
        'hamming_loss': float(hamming_loss(y_test, y_pred_binary)),
        'subset_accuracy': float(accuracy_score(y_test, y_pred_binary)),
        'f1_macro': float(f1_score(y_test, y_pred_binary, average='macro')),
        'f1_micro': float(f1_score(y_test, y_pred_binary, average='micro')),
        'f1_weighted': float(f1_score(y_test, y_pred_binary, average='weighted'))
    }
}

metadata_path = os.path.join(model_dir, 'model_metadata.json')
with open(metadata_path, 'w', encoding='utf-8') as f:
    json.dump(metadata, f, ensure_ascii=False, indent=2)
print(f"Đã lưu metadata tại: {metadata_path}")

# Vẽ biểu đồ training history
plt.figure(figsize=(15, 5))

# Loss
plt.subplot(1, 3, 1)
plt.plot(history.history['loss'], label='Train Loss')
plt.plot(history.history['val_loss'], label='Val Loss')
plt.title('Model Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()
plt.grid(True)

# Binary Accuracy
plt.subplot(1, 3, 2)
plt.plot(history.history['binary_accuracy'], label='Train Accuracy')
plt.plot(history.history['val_binary_accuracy'], label='Val Accuracy')
plt.title('Binary Accuracy')
plt.xlabel('Epoch')
plt.ylabel('Accuracy')
plt.legend()
plt.grid(True)

# AUC
plt.subplot(1, 3, 3)
plt.plot(history.history['auc'], label='Train AUC')
plt.plot(history.history['val_auc'], label='Val AUC')
plt.title('AUC Score')
plt.xlabel('Epoch')
plt.ylabel('AUC')
plt.legend()
plt.grid(True)

plt.tight_layout()
plot_path = os.path.join(model_dir, 'training_history.png')
plt.savefig(plot_path, dpi=150, bbox_inches='tight')
print(f"Đã lưu biểu đồ training tại: {plot_path}")

# Phân tích một số ví dụ dự đoán
print("\n=== Ví dụ dự đoán ===")
num_examples = 5
sample_indices = np.random.choice(len(X_test), num_examples, replace=False)

for idx in sample_indices:
    true_labels = [label_names[i] for i, val in enumerate(y_test[idx]) if val == 1]
    pred_labels = [label_names[i] for i, val in enumerate(y_pred_binary[idx]) if val == 1]
    pred_probs = [(label_names[i], y_pred[idx][i]) for i in range(len(label_names))]
    pred_probs_sorted = sorted(pred_probs, key=lambda x: x[1], reverse=True)
    
    print(f"\nMẫu {idx}:")
    print(f"  Nhãn thực tế: {', '.join(true_labels)}")
    print(f"  Nhãn dự đoán: {', '.join(pred_labels) if pred_labels else 'Không có'}")
    print(f"  Xác suất:")
    for label, prob in pred_probs_sorted[:3]:
        print(f"    {label}: {prob:.3f}")

print("\n=== Hoàn thành huấn luyện ===")
