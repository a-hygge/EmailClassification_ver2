import threading
from typing import Dict, Any, Optional
from datetime import datetime

class TrainingJobManager:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(TrainingJobManager, cls).__new__(cls)
        return cls._instance
    def __init__(self):
        if not hasattr(self, '_initialized'):
            self._jobs: Dict[str, Dict[str,Any]] = {}
            self._initialized = True
    
    def create_job(self, job_id: str, model_type: str) -> None:
        with self._lock:
            self._jobs[job_id] = {
                'jobId': job_id,
                'modelType': model_type,
                'status': 'pending',
                'progress': None,
                'results': None,
                'error': None,
                'logs': [],
                'createdAt': datetime.now().isoformat(),
                'updatedAt': datetime.now().isoformat()
            }
            print(f"Created job {job_id} for model type {model_type}")
    def update_status(self, job_id: str, status: str) -> None:
        with self._lock:
            if job_id in self._jobs:
                self._jobs[job_id]['status'] = status
                self._jobs[job_id]['updateAt'] = datetime.now().isoformat()
                print(f"Job {job_id} status updated to: {status}")
    def update_progress(
        self,
        job_id: str,
        current_epoch: int,
        total_epochs: int,
        progress: float,
        current_batch: Optional[int] = None,
        total_batches: Optional[int] = None,
        current_loss: Optional[float] = None,
        current_accuracy: Optional[float] = None,
        current_auc: Optional[float] = None,
        current_precision: Optional[float] = None,
        current_recall: Optional[float] = None,
        val_loss: Optional[float] = None,
        val_accuracy: Optional[float] = None,
        val_auc: Optional[float] = None,
        val_precision: Optional[float] = None,
        val_recall: Optional[float] = None,
        log_message: Optional[str] = None
    ) -> None:
        with self._lock:
            if job_id in self._jobs:
                progress_data = {
                    'currentEpoch': current_epoch,
                    'totalEpochs': total_epochs,
                    'progress': progress,
                    'currentLoss': current_loss,
                    'currentAccuracy': current_accuracy,
                    'valLoss': val_loss,
                    'valAccuracy': val_accuracy
                }
                
                if current_batch is not None:
                    progress_data['currentBatch'] = current_batch
                if total_batches is not None:
                    progress_data['totalBatches'] = total_batches
                if current_auc is not None:
                    progress_data['currentAuc'] = current_auc
                if current_precision is not None:
                    progress_data['currentPrecision'] = current_precision
                if current_recall is not None:
                    progress_data['currentRecall'] = current_recall
                if val_auc is not None:
                    progress_data['valAuc'] = val_auc
                if val_precision is not None:
                    progress_data['valPrecision'] = val_precision
                if val_recall is not None:
                    progress_data['valRecall'] = val_recall
                
                self._jobs[job_id]['progress'] = progress_data
                self._jobs[job_id]['updatedAt'] = datetime.now().isoformat()
                
                if log_message:
                    if 'logs' not in self._jobs[job_id]:
                        self._jobs[job_id]['logs'] = []
                    self._jobs[job_id]['logs'].append({
                        'timestamp': datetime.now().isoformat(),
                        'message': log_message
                    })
                    if len(self._jobs[job_id]['logs']) > 1000:
                        self._jobs[job_id]['logs'] = self._jobs[job_id]['logs'][-1000:]
                
                if current_batch is not None and total_batches is not None:
                    print(f"Job {job_id} progress: {progress:.1f}% (Epoch {current_epoch}/{total_epochs}, Batch {current_batch}/{total_batches})")
                else:
                    print(f"Job {job_id} progress: {progress:.1f}% (Epoch {current_epoch}/{total_epochs})")
    def complete_job(self, job_id: str, results: Dict[str, Any]) -> None:
        with self._lock:
            if job_id in self._jobs:
                serializable_results = {
                    'metadata': results.get('metadata'),
                    'metrics': results.get('metrics'),
                    'history': results.get('history')
                }
                
                self._jobs[job_id]['status'] = 'completed'
                self._jobs[job_id]['results'] = serializable_results
                self._jobs[job_id]['updatedAt'] = datetime.now().isoformat()
                
                self._jobs[job_id]['_full_results'] = results
                
                print(f"Job {job_id} completed successfully")
    def fail_job(self, job_id: str, error: str) -> None:
        with self._lock:
            if job_id in self._jobs:
                self._jobs[job_id]['status'] = 'failed'
                self._jobs[job_id]['error'] = error
                self._jobs[job_id]['updatedAt'] = datetime.now().isoformat()
                print(f"Job {job_id} failed: {error}")
    
    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            job = self._jobs.get(job_id)
            if job:
                job_copy = job.copy()
                if '_full_results' in job_copy:
                    pass
                return job_copy
            return None
    
    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        job = self.get_job(job_id)
        if job:
            return {
                'jobId': job['jobId'],
                'status': job['status'],
                'progress': job.get('progress'),
                'error': job.get('error'),
                'logs': job.get('logs', [])
            }
        return None
    
    def get_job_results(self, job_id: str) -> Optional[Dict[str, Any]]:
        job = self.get_job(job_id)
        if job and job['status'] == 'completed':
            return {
                'jobId': job['jobId'],
                'status': job['status'],
                'metrics': job['results'].get('metrics'),
                'history': job['results'].get('history')
            }
        return None
    
    def list_jobs(self) -> Dict[str, Dict[str, Any]]:
        with self._lock:
            jobs_copy = {}
            for job_id, job in self._jobs.items():
                job_copy = job.copy()
                if '_full_results' in job_copy:
                    del job_copy['_full_results']
                jobs_copy[job_id] = job_copy
            return jobs_copy
    
    def delete_job(self, job_id: str) -> bool:
        with self._lock:
            if job_id in self._jobs:
                del self._jobs[job_id]
                print(f" Deleted job {job_id}")
                return True
            return False

