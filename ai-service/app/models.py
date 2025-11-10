from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator

class ClassifyRequest(BaseModel):
    title: str = Field (
        ...,
        min_length=1,
        max_length=500,
        description="Email title"
    )
    
    content: str = Field (
        ...,
        min_length=1,
        description= "Email content"
    )
    
    @field_validator('title','content')
    @classmethod
    def validate_not_empty(cls, v : str) -> str:
        if not v or not v.strip():
            return ValueError('Field cannot be empty or whitespace only')
        return v.strip()
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Team Meeting Tomorrow",
                "content": "We have a team meeting scheduled for tomorrow at 10 AM in the conference room."
            }
        }
class PredictedLabel(BaseModel):
    label: str = Field(..., description="Label name")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")

class ClassifyResponse(BaseModel):
    labels: List[PredictedLabel] = Field(
        ...,
        description="Predicted labels with confidence scores (multi-label)"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "labels": [
                    {"label": "Công việc", "confidence": 0.95},
                    {"label": "Học tập", "confidence": 0.78}
                ]
            }
        }
class HealthResponse(BaseModel):
    status: str = Field(..., description="Service status")
    model_loaded: bool = Field(..., description="ML model is loaded")
    class Config:
        json_schema_extra = {
            "example": {
                "status":"healthy",
                "model_loaded":True
            }
        }
class ErrorResponse(BaseModel):
    error: str = Field(..., description="error type")
    detail: str = Field(...,description="error details")
    
    class Config:
        json_schema_extra = {
            "example": {
                "error":"ValidationError",
                "detail": "Title cannot be empty"
            }
        }

class TrainingSample(BaseModel):
    id: int = Field(...,description="email ID trong db")
    title: str = Field(...,description="Email title")
    content: str = Field(..., description="Email content")
    labels: List[str] = Field(...,description="List of label names for multi-label")
    
    @field_validator('labels')
    @classmethod
    def validate_labels_not_empty(cls, v: List[str]) -> List[str]:
        if not v or len(v) == 0:
            raise ValueError('Labels list cannot be empty')
        return v

class Hyperparameters(BaseModel):
     epochs: int = Field(
         default=25,
         ge=1,
         le=100,
         description="Number of training epochs"
     )
     batch_size: int = Field(
         default=32,
         ge=1,
         le=256,
         description="batch size"
     )
     learning_rate: float = Field(
         default=0.0001,
         gt=0,
         le=1,
         description="lr"
     )
     max_words: int = Field (
         default= 50000,
         ge = 1000,
         description="max words"
     )
     max_len: int = Field(
         default=256,
         ge=50,
         le=1000,
         description="max sequence len"
     )
     
     class Config:
         json_schema_extra = {
             "example":{
                 "epochs":25,
                 "batch_size":32,
                 "learning_rate":0.0001,
                 "max_words": 50000,
                 "max_len": 256
             }
         }
class RetrainRequest(BaseModel):
    jobId: str = Field(..., description="Training job ID")
    modelType: str = Field(..., description="Model type (RNN, LSTM, BiLSTM, CNN, BiLSTM+CNN)")
    modelPath: Optional[str] = Field(
        None,  # Optional field (có thể None)
        description="Path to existing model (optional)"
    )
    samples: List[TrainingSample] = Field(
        ..., 
        min_length=10, 
        description="Training samples"
    )
    hyperparameters: Hyperparameters = Field(..., description="Training hyperparameters")
    @field_validator('modelType')
    @classmethod
    def validate_model_type(cls, v: str) -> str:
        allowed_types = ['RNN', 'LSTM', 'BiLSTM', 'CNN', 'BiLSTM+CNN']
        if v not in allowed_types:
            raise ValueError(f'Model type must be one of {allowed_types}')
        return v
    class Config:
        json_schema_extra = {
            "example": {
                "jobId": "123",
                "modelType": "LSTM",
                "samples": [
                    {
                        "id": 1,
                        "title": "Meeting tomorrow",
                        "content": "We have a team meeting...",
                        "labels": ["Công việc", "Học tập"]
                    }
                ],
                "hyperparameters": {
                    "epochs": 25,
                    "batch_size": 32,
                    "learning_rate": 0.0001
                }
            }
        }
class RetrainResponse(BaseModel):
    jobId: str = Field(..., description="Training job ID")
    status: str = Field(..., description="Job status (running, completed, failed)")
    message: str = Field(..., description="Status message")

    class Config:
        json_schema_extra = {
            "example": {
                "jobId": "123",
                "status": "running",
                "message": "Training started successfully"
            }
        }
class TrainingProgress(BaseModel):
    currentEpoch: int = Field(..., description="Current epoch number")
    totalEpochs: int = Field(..., description="Total number of epochs")
    progress: float = Field(
            ..., 
        ge=0.0,   # Minimum 0%
        le=100.0, # Maximum 100%
        description="Progress percentage"
    )
    
    # Metrics của epoch hiện tại (optional vì có thể chưa có)
    currentLoss: Optional[float] = Field(None, description="Current training loss")
    currentAccuracy: Optional[float] = Field(None, description="Current training accuracy")
    valLoss: Optional[float] = Field(None, description="Current validation loss")
    valAccuracy: Optional[float] = Field(None, description="Current validation accuracy")
class TrainingStatusResponse(BaseModel):
    jobId: str = Field(..., description="Training job ID")
    
    status: str = Field(
        ..., 
        description="Job status (pending, running, completed, failed)"
    )
    
    progress: Optional[TrainingProgress] = Field(
        None, 
        description="Training progress"
    )
    
    error: Optional[str] = Field(None, description="Error message if failed")
    
    logs: Optional[List[Dict[str, str]]] = Field(
        None,
        description="Training logs with timestamp and message"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "jobId": "123",
                "status": "running",
                "progress": {
                    "currentEpoch": 10,
                    "totalEpochs": 25,
                    "progress": 40.0,
                    "currentLoss": 0.5,
                    "currentAccuracy": 0.85,
                    "valLoss": 0.6,
                    "valAccuracy": 0.82
                },
                "logs": [
                    {"timestamp": "2024-01-01T10:00:00", "message": "Starting training..."},
                    {"timestamp": "2024-01-01T10:00:01", "message": "10/152 - auc: 0.9754..."}
                ]
            }
        }
class TrainingMetrics(BaseModel):
    testLoss: float = Field(..., description="Test loss")
    testAccuracy: float = Field(..., description="Test binary accuracy")
    
    # Multi-label specific metrics
    hammingLoss: Optional[float] = Field(None, description="Hamming loss for multi-label")
    subsetAccuracy: Optional[float] = Field(None, description="Subset accuracy (exact match)")
    f1Macro: Optional[float] = Field(None, description="F1 score (macro average)")
    f1Micro: Optional[float] = Field(None, description="F1 score (micro average)")
    f1Weighted: Optional[float] = Field(None, description="F1 score (weighted average)")
    
    classificationReport: Dict[str, Any] = Field (
        ...,
        description="Classification Report"
    )
    confusionMatrix: Optional[List[List[int]]] = Field (
        None,
        description="Confusion matrix (if applicable)"
    )

class TrainingHistory(BaseModel):
    loss: List[float] = Field(..., description="Training loss history")
    accuracy: List[float] = Field(..., description="Training accuracy history")
    
    val_loss: List[float] = Field(..., description="Validation loss history")
    val_accuracy: List[float] = Field(..., description="Validation accuracy history")
class TrainingResultsResponse(BaseModel):
    jobId: str = Field(..., description="Training job ID")
    status: str = Field(..., description="Job status")
    
    # Metrics và history (None nếu training chưa xong hoặc failed)
    metrics: Optional[TrainingMetrics] = Field(
        None, 
        description="Training metrics"
    )
    history: Optional[TrainingHistory] = Field(
        None, 
        description="Training history"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "jobId": "123",
                "status": "completed",
                "metrics": {
                    "testLoss": 0.3737,
                    "testAccuracy": 0.9414,
                    "classificationReport": {},
                    "confusionMatrix": []
                },
                "history": {
                    "loss": [1.8, 1.2, 0.8],
                    "accuracy": [0.5, 0.7, 0.85],
                    "val_loss": [1.3, 0.9, 0.7],
                    "val_accuracy": [0.6, 0.75, 0.88]
                }
            }
        }
class SaveModelRequest(BaseModel):
    modelName: str = Field(
        ..., 
        min_length=1,   
        max_length=100, 
        description="Name for the saved model"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "modelName": "lstm_model_v2"
            }
        }
class SaveModelResponse(BaseModel):
    success: bool = Field(..., description="Whether save was successful")
    modelPath: str = Field(..., description="Path to saved model")
    message: str = Field(..., description="Status message")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "modelPath": "/models/lstm_model_v2.h5",
                "message": "Model saved successfully"
            }
        }