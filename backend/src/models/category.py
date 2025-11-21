from pydantic import BaseModel


class CategoryBase(BaseModel):
    name: str


class CategoryCreate(CategoryBase):
    pass


class Category(CategoryBase):
    categoryId: str
    count: int = 0
    createdAt: str

    class Config:
        from_attributes = True
