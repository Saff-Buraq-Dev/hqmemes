from pydantic import BaseModel
from typing import List, Literal


class UploadJobBase(BaseModel):
    userId: str
    totalFiles: int


class UploadJobCreate(UploadJobBase):
    jobId: str


class UploadJobUpdate(BaseModel):
    status: Literal['pending', 'processing', 'completed', 'failed']
    processedFiles: int
    errors: List[str] = []


class UploadJob(UploadJobBase):
    jobId: str
    status: Literal['pending', 'processing', 'completed', 'failed']
    processedFiles: int = 0
    errors: List[str] = []
    createdAt: str

    class Config:
        from_attributes = True
