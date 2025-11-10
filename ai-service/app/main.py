
import os
import threading
from typing import Dict
from fastapi import FastAPI, HTTPException, Header, Depends, BackgroundTasks
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from app.models import *
from app.ml_service import MLService
from app.training_manager import TrainingJobManager
from app.training_service import TrainingService
from content_size_limit_asgi import ContentSizeLimitMiddleware

load_dotenv()

app = FastAPI(
    title="Email Classification API",             
    description="ML-powered email classification service",  
    version="1.0.0",                             
    docs_url="/docs",                            
    redoc_url="/redoc", 
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    ContentSizeLimitMiddleware, 
    max_content_size=10485760
)

ml_service = MLService()
training_manager = TrainingJobManager()
training_service = TrainingService(training_manager)
API_KEY = os.getenv("API_KEY", "dev-secret-key-12345")

def verify_api_key(x_api_key: str = Header(..., alias="X-API-Key")) -> str:
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return x_api_key

@app.get("/", tags=["Root"])
async def root() -> Dict[str, str]:
    return {
        "message": "Email Classification API", 
        "version": "1.0.0",                    
        "docs": "/docs",                       
        "health": "/health",               
    }
    
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="healthy" if ml_service.is_model_loaded() else "unhealthy",
        model_loaded=ml_service.is_model_loaded(),
    )
    
@app.post("/api/v1/classify", response_model=ClassifyResponse, responses={
        200: {"model": ClassifyResponse},  
        400: {"model": ErrorResponse},     
        401: {"model": ErrorResponse},     
        500: {"model": ErrorResponse},     
    }, tags=["Classification"], dependencies=[Depends(verify_api_key)],)
async def classify_email(request: ClassifyRequest) -> ClassifyResponse:
    """
    Classify email with multi-label support
    Returns list of predicted labels with confidence scores
    """
    try:
        # ml_service.predict now returns List[Dict] for multi-label
        predicted_labels = ml_service.predict(
            title=request.title,     
            content=request.content   
        )
        
        return ClassifyResponse(labels=predicted_labels)

    except RuntimeError as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Model prediction failed: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error: {str(e)}"
        )
@app.get("/api/v1/model/info", tags=["Model"])
async def get_model_info() -> Dict:
    return ml_service.get_model_info()

def run_training_in_background(job_id: str, model_type: str, samples: list, hyperparameters: dict):
    try:
        training_service.train_model(
            job_id=job_id,
            model_type=model_type,
            samples=samples,
            hyperparameters=hyperparameters,
        )
    except Exception as e:
        print(f" Background training failed: {str(e)}")

@app.post("/api/v1/retrain",response_model=RetrainResponse, tags=["Retrain"], dependencies=[Depends(verify_api_key)],)
async def start_retraining(request: RetrainRequest, background_tasks: BackgroundTasks) -> RetrainResponse:
    try:
        print(f" Received retrain request for job {request.jobId}")
        print(f"   Model type: {request.modelType}")
        print(f"   Samples: {len(request.samples)}")
        training_manager.create_job(request.jobId, request.modelType)
        samples = [sample.model_dump() for sample in request.samples]
        hyperparameters = request.hyperparameters.model_dump()
        thread = threading.Thread(
            target=run_training_in_background,
            args=(request.jobId, request.modelType, samples, hyperparameters),
        )
        thread.daemon = True
        thread.start()
        return RetrainResponse(
            jobId=request.jobId,
            status="running", 
            message="Training started successfully",
        )
    except Exception as e:
        print(f" Failed to start retraining: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to start retraining: {str(e)}"
        )
    
@app.get(
    "/api/v1/retrain/status/{jobId}",
    response_model= TrainingStatusResponse,
    tags=["Retrain"],
    dependencies=[Depends(verify_api_key)],  
)
async def get_training_status(jobId: str) -> TrainingStatusResponse:
    try:
        status = training_manager.get_job_status(jobId)
        if not status:
            raise HTTPException(
                status_code=404, 
                detail=f"Job {jobId} not found"
            )
        return TrainingStatusResponse(**status)
       
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get training status: {str(e)}"
        )
@app.get(
    "/api/v1/retrain/results/{jobId}",
    response_model=TrainingResultsResponse,
    tags=["Retrain"],
    dependencies=[Depends(verify_api_key)],  # YÊU CẦU API KEY
)
async def get_training_results(jobId: str) -> TrainingResultsResponse:
    try:
        results = training_manager.get_job_results(jobId)
        if not results:
            job = training_manager.get_job(jobId)
            if not job:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Job {jobId} not found"
                )
            elif job["status"] != "completed":
                # Job tồn tại nhưng chưa completed
                raise HTTPException(
                    status_code=400,
                    detail=f"Job {jobId} not completed yet (status: {job['status']})",
                )
        return TrainingResultsResponse(**results)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get training results: {str(e)}"
        )
@app.post(
    "/api/v1/retrain/save/{jobId}",
    response_model=SaveModelResponse,
    tags=["Retrain"],
    dependencies=[Depends(verify_api_key)], 
)
async def save_trained_model(
    jobId: str, 
    request: SaveModelRequest
) -> SaveModelResponse:
    try:
        print(f" Saving model for job {jobId} as {request.modelName}")
        model_path = training_service.save_model(
            job_id=jobId, 
            model_name=request.modelName
        )

        return SaveModelResponse(
            success=True, 
            modelPath=model_path, 
            message="Model saved successfully"
        )

    except ValueError as e: 
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to save model: {str(e)}"
        )
        
@app.on_event("startup")
async def startup_event():
    print(" Starting Email Classification API")
    if ml_service.is_model_loaded():
        print("ML Model loaded successfully")
    else:
        print(" ML Model failed to load")
@app.on_event("shutdown")
async def shutdown_event():
    print(" Shutting down Email Classification API")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000)) 
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=True,)