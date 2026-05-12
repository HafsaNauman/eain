# from fastapi import FastAPI, Form, UploadFile, File, HTTPException
# from fastapi.staticfiles import StaticFiles
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from typing import List, Optional, Dict, Any
# from ai_description import (
#     generate_service_description, 
#     generate_product_description,
#     generate_description_from_image,
#     regenerate_with_feedback
# )
# import os
# import json


# # ============================================================================
# # PYDANTIC MODELS FOR REQUEST VALIDATION
# # ============================================================================

# class VendorPreferences(BaseModel):
#     """Vendor's AI generation preferences"""
#     length: str = "medium"  # short, medium, detailed
#     tone: str = "professional"  # casual, professional, friendly


# class ServiceDescriptionRequest(BaseModel):
#     """Request model for service description generation"""
#     service_type: str  # e.g., "Plumbing", "Electrical", "Graphic Design"
#     skills: List[str]  # ["Pipe fitting", "Water heater repair"]
#     experience_years: Optional[int] = None
#     price_min: Optional[float] = None
#     price_max: Optional[float] = None
#     pricing_type: str = "negotiable"  # hourly, fixed, per_project, negotiable
#     service_areas: List[str]  # ["DHA Lahore", "Gulberg"]
#     city: str
#     availability_hours: Optional[str] = "9 AM - 6 PM"
#     certifications: Optional[List[str]] = []
#     vendor_preferences: VendorPreferences


# class ProductDescriptionRequest(BaseModel):
#     """Request model for product description generation"""
#     product_name: str
#     category: str
#     subcategory: Optional[str] = None
#     price: float
#     key_features: Optional[List[str]] = []
#     vendor_preferences: VendorPreferences


# class RegenerationRequest(BaseModel):
#     """Request model for regenerating with feedback"""
#     original_data: Dict[str, Any]
#     feedback: str  # e.g., "Make it shorter", "More casual tone"
#     item_type: str = "service"  # service or product


# # ============================================================================
# # INITIALIZE FASTAPI APPLICATION
# # ============================================================================

# app = FastAPI(
#     title="AI Description Microservice",
#     description="Generate professional service and product descriptions using OpenAI. Microservice for vendor listing platform.",
#     version="2.0.0"
# )

# # Add CORS middleware to allow requests from Node.js backend
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000", "http://localhost:5000", "*"],  # Adjust for production
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Setup static files for image access
# UPLOAD_DIR = os.path.join("uploads", "images")
# os.makedirs(UPLOAD_DIR, exist_ok=True)
# app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# # Base URL for self-referencing static files like images
# BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


# # ============================================================================
# # ROOT ENDPOINT
# # ============================================================================

# @app.get("/")
# async def root():
#     return {
#         "message": "AI Description Microservice is running",
#         "version": "2.0.0",
#         "endpoints": {
#             "POST /generate-service-description": "Generate professional service description",
#             "POST /generate-product-description": "Generate professional product description",
#             "POST /generate-description-from-image": "Generate description from uploaded image",
#             "POST /regenerate-with-feedback": "Regenerate description based on vendor feedback"
#         },
#         "designed_for": "Node.js backend integration"
#     }


# @app.get("/health")
# async def health_check():
#     """Health check endpoint for monitoring"""
#     return {
#         "status": "healthy",
#         "service": "AI Description Generator",
#         "key_configured": bool(os.getenv("OPENAI_API_KEY"))
#     }


# # ============================================================================
# # SERVICE DESCRIPTION ENDPOINTS
# # ============================================================================

# @app.post("/generate-service-description")
# async def create_service_description(request: ServiceDescriptionRequest):
#     """
#     Generate a professional service description for vendors.
    
#     Used for: Plumbers, Electricians, Designers, Consultants, etc.
    
#     Returns:
#     - title: Catchy, SEO-friendly service title
#     - description: Compelling service pitch
#     - highlights: Key selling points
#     - keywords: SEO keywords for discoverability
#     - opening_line: Hook for client attention
#     - prompt_used: The actual prompt sent to AI (for debugging)
#     - generation_method: "service_form"
#     - model: "gpt-4o-mini"
#     """
#     try:
#         result = generate_service_description(request.dict())
        
#         if "error" in result:
#             raise HTTPException(status_code=500, detail=result["error"])
        
#         return {
#             "success": True,
#             "data": result,
#             "message": "Service description generated successfully"
#         }
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Error generating service description: {repr(e)}"
#         )


# # ============================================================================
# # PRODUCT DESCRIPTION ENDPOINTS
# # ============================================================================

# @app.post("/generate-product-description")
# async def create_product_description(request: ProductDescriptionRequest):
#     """
#     Generate a professional product description for eCommerce vendors.
    
#     Used for: Physical products, items for sale
    
#     Returns:
#     - title: Short, compelling product name
#     - description: Engaging product pitch focused on benefits
#     - features: List of product benefits and features
#     - keywords: SEO keywords for search optimization
#     - value_proposition: One-liner answer to "Why buy this?"
#     - prompt_used: The actual prompt sent to AI
#     - generation_method: "product_form"
#     - model: "gpt-4o-mini"
#     """
#     try:
#         result = generate_product_description(request.dict())
        
#         if "error" in result:
#             raise HTTPException(status_code=500, detail=result["error"])
        
#         return {
#             "success": True,
#             "data": result,
#             "message": "Product description generated successfully"
#         }
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Error generating product description: {repr(e)}"
#         )


# # ============================================================================
# # IMAGE-BASED GENERATION ENDPOINTS
# # ============================================================================

# @app.post("/generate-service-description-from-image")
# async def create_service_description_from_image(file: UploadFile = File(...)):
#     """
#     Generate service description by analyzing an uploaded image.
#     Perfect for vendors who want to showcase their work visually.
    
#     The image is saved locally with a timestamped filename.
    
#     Returns:
#     - image_filename: Name of saved image file
#     - image_url: Public URL to access the image
#     - ai_description: Generated description from image analysis
#     - generation_method: "image_upload_service"
#     """
#     try:
#         result = generate_description_from_image(file, item_type="service")
        
#         if "error" in result:
#             raise HTTPException(status_code=500, detail=result["error"])
        
#         # Include public image URL in response
#         if "image_filename" in result:
#             result["image_url"] = f"{BASE_URL}/uploads/images/{result['image_filename']}"
        
#         return {
#             "success": True,
#             "data": result,
#             "message": "Service description generated from image successfully"
#         }
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Error processing image: {str(e)}"
#         )


# @app.post("/generate-product-description-from-image")
# async def create_product_description_from_image(file: UploadFile = File(...)):
#     """
#     Generate product description by analyzing an uploaded image.
#     Perfect for eCommerce vendors with product photos.
    
#     The image is saved locally with a timestamped filename.
    
#     Returns:
#     - image_filename: Name of saved image file
#     - image_url: Public URL to access the image
#     - ai_description: Generated description from image analysis
#     - generation_method: "image_upload_product"
#     """
#     try:
#         result = generate_description_from_image(file, item_type="product")
        
#         if "error" in result:
#             raise HTTPException(status_code=500, detail=result["error"])
        
#         # Include public image URL
#         if "image_filename" in result:
#             result["image_url"] = f"{BASE_URL}/uploads/images/{result['image_filename']}"
        
#         return {
#             "success": True,
#             "data": result,
#             "message": "Product description generated from image successfully"
#         }
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Error processing image: {str(e)}"
#         )


# # ============================================================================
# # REGENERATION ENDPOINTS (WITH VENDOR FEEDBACK)
# # ============================================================================

# @app.post("/regenerate-service-description")
# async def regenerate_service_with_feedback(request: RegenerationRequest):
#     """
#     Regenerate a service description based on vendor feedback.
    
#     Feedback examples:
#     - "Make it shorter and punchier"
#     - "Use more casual tone"
#     - "Emphasize experience and reliability"
#     - "Add more details about certifications"
    
#     This endpoint helps vendors refine the AI output iteratively.
#     """
#     try:
#         if request.item_type != "service":
#             raise HTTPException(
#                 status_code=400,
#                 detail="Use this endpoint for services only"
#             )
        
#         result = regenerate_with_feedback(
#             request.original_data,
#             request.feedback,
#             item_type="service"
#         )
        
#         if "error" in result:
#             raise HTTPException(status_code=500, detail=result["error"])
        
#         return {
#             "success": True,
#             "data": result,
#             "feedback_applied": request.feedback,
#             "message": "Service description regenerated with feedback"
#         }
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Error regenerating description: {str(e)}"
#         )


# @app.post("/regenerate-product-description")
# async def regenerate_product_with_feedback(request: RegenerationRequest):
#     """
#     Regenerate a product description based on vendor feedback.
    
#     Feedback examples:
#     - "Make it more persuasive"
#     - "Focus more on benefits than features"
#     - "Add urgency (limited stock, sale, etc.)"
#     - "Make it sound more premium"
#     """
#     try:
#         if request.item_type != "product":
#             raise HTTPException(
#                 status_code=400,
#                 detail="Use this endpoint for products only"
#             )
        
#         result = regenerate_with_feedback(
#             request.original_data,
#             request.feedback,
#             item_type="product"
#         )
        
#         if "error" in result:
#             raise HTTPException(status_code=500, detail=result["error"])
        
#         return {
#             "success": True,
#             "data": result,
#             "feedback_applied": request.feedback,
#             "message": "Product description regenerated with feedback"
#         }
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Error regenerating description: {str(e)}"
#         )


# # ============================================================================
# # ERROR HANDLING
# # ============================================================================

# from fastapi.responses import JSONResponse

# @app.exception_handler(HTTPException)
# async def http_exception_handler(request, exc):
#     return JSONResponse(
#         status_code=exc.status_code,
#         content={
#             "success": False,
#             "error": exc.detail,
#             "status_code": exc.status_code
#         }
#     )


# @app.exception_handler(Exception)
# async def general_exception_handler(request, exc):
#     return JSONResponse(
#         status_code=500,
#         content={
#             "success": False,
#             "error": str(exc),
#             "status_code": 500
#         }
#     )


# if __name__ == "__main__":
#     import uvicorn
#     import os
#     port = int(os.environ.get("PORT", 8000))
#     uvicorn.run(app, host="0.0.0.0", port=port)


from fastapi import FastAPI, Form, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from ai_description import (
    generate_service_description, 
    generate_product_description,
    generate_description_from_image,
    regenerate_with_feedback
)
import os
import json


# ============================================================================
# PYDANTIC MODELS FOR REQUEST VALIDATION
# ============================================================================

class VendorPreferences(BaseModel):
    """Vendor's AI generation preferences"""
    length: str = "medium"  # short, medium, detailed
    tone: str = "professional"  # casual, professional, friendly


class ServiceDescriptionRequest(BaseModel):
    """Request model for service description generation"""
    service_type: str  # e.g., "Plumbing", "Electrical", "Graphic Design"
    skills: List[str]  # ["Pipe fitting", "Water heater repair"]
    experience_years: Optional[int] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    pricing_type: str = "negotiable"  # hourly, fixed, per_project, negotiable
    service_areas: List[str]  # ["DHA Lahore", "Gulberg"]
    city: str
    availability_hours: Optional[str] = "9 AM - 6 PM"
    certifications: Optional[List[str]] = []
    vendor_preferences: VendorPreferences


class ProductDescriptionRequest(BaseModel):
    """Request model for product description generation"""
    product_name: str
    category: str
    subcategory: Optional[str] = None
    price: float
    key_features: Optional[List[str]] = []
    vendor_preferences: VendorPreferences


class RegenerationRequest(BaseModel):
    """Request model for regenerating with feedback"""
    original_data: Dict[str, Any]
    feedback: str  # e.g., "Make it shorter", "More casual tone"
    item_type: str = "service"  # service or product


# ============================================================================
# INITIALIZE FASTAPI APPLICATION
# ============================================================================

app = FastAPI(
    title="AI Description Microservice",
    description="Generate professional service and product descriptions using OpenAI. Microservice for vendor listing platform.",
    version="2.0.0"
)

# Add CORS middleware to allow requests from Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup static files for image access
UPLOAD_DIR = os.path.join("uploads", "images")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Base URL for self-referencing static files like images
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


# ============================================================================
# ROOT ENDPOINT
# ============================================================================

@app.get("/")
async def root():
    return {
        "message": "AI Description Microservice is running",
        "version": "2.0.0",
        "endpoints": {
            "POST /generate-service-description": "Generate professional service description",
            "POST /generate-product-description": "Generate professional product description",
            "POST /generate-description-from-image": "Generate description from uploaded image",
            "POST /regenerate-with-feedback": "Regenerate description based on vendor feedback"
        },
        "designed_for": "Node.js backend integration"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "AI Description Generator",
        "key_configured": bool(os.getenv("OPENAI_API_KEY"))
    }


# ============================================================================
# SERVICE DESCRIPTION ENDPOINTS
# ============================================================================

@app.post("/generate-service-description")
async def create_service_description(request: ServiceDescriptionRequest):
    """
    Generate a professional service description for vendors.
    
    Used for: Plumbers, Electricians, Designers, Consultants, etc.
    
    Returns:
    - title: Catchy, SEO-friendly service title
    - description: Compelling service pitch
    - highlights: Key selling points
    - keywords: SEO keywords for discoverability
    - opening_line: Hook for client attention
    - prompt_used: The actual prompt sent to AI (for debugging)
    - generation_method: "service_form"
    - model: "gpt-4o-mini"
    """
    try:
        result = generate_service_description(request.dict())
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return {
            "success": True,
            "data": result,
            "message": "Service description generated successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating service description: {repr(e)}"
        )


# ============================================================================
# PRODUCT DESCRIPTION ENDPOINTS
# ============================================================================

@app.post("/generate-product-description")
async def create_product_description(request: ProductDescriptionRequest):
    """
    Generate a professional product description for eCommerce vendors.
    
    Used for: Physical products, items for sale
    
    Returns:
    - title: Short, compelling product name
    - description: Engaging product pitch focused on benefits
    - features: List of product benefits and features
    - keywords: SEO keywords for search optimization
    - value_proposition: One-liner answer to "Why buy this?"
    - prompt_used: The actual prompt sent to AI
    - generation_method: "product_form"
    - model: "gpt-4o-mini"
    """
    try:
        result = generate_product_description(request.dict())
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return {
            "success": True,
            "data": result,
            "message": "Product description generated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating product description: {repr(e)}"
        )


# ============================================================================
# IMAGE-BASED GENERATION ENDPOINTS
# ============================================================================

@app.post("/generate-service-description-from-image")
async def create_service_description_from_image(file: UploadFile = File(...)):
    """
    Generate service description by analyzing an uploaded image.
    Perfect for vendors who want to showcase their work visually.

    The image is saved locally with a timestamped filename.

    Returns:
    - image_filename: Name of saved image file
    - image_url: Public URL to access the image
    - ai_description: Generated description from image analysis
    - generation_method: "image_upload_service"
    """
    try:
        image_bytes = await file.read()
        result = generate_description_from_image(file.filename, image_bytes, item_type="service")
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        # Include public image URL in response
        if "image_filename" in result:
            result["image_url"] = f"{BASE_URL}/uploads/images/{result['image_filename']}"
        
        return {
            "success": True,
            "data": result,
            "message": "Service description generated from image successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )


@app.post("/generate-product-description-from-image")
async def create_product_description_from_image(file: UploadFile = File(...)):
    """
    Generate product description by analyzing an uploaded image.
    Perfect for eCommerce vendors with product photos.

    The image is saved locally with a timestamped filename.

    Returns:
    - image_filename: Name of saved image file
    - image_url: Public URL to access the image
    - ai_description: Generated description from image analysis
    - generation_method: "image_upload_product"
    """
    try:
        image_bytes = await file.read()
        result = generate_description_from_image(file.filename, image_bytes, item_type="product")
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        # Include public image URL
        if "image_filename" in result:
            result["image_url"] = f"{BASE_URL}/uploads/images/{result['image_filename']}"
        
        return {
            "success": True,
            "data": result,
            "message": "Product description generated from image successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )


# ============================================================================
# REGENERATION ENDPOINTS (WITH VENDOR FEEDBACK)
# ============================================================================

@app.post("/regenerate-service-description")
async def regenerate_service_with_feedback(request: RegenerationRequest):
    """
    Regenerate a service description based on vendor feedback.
    
    Feedback examples:
    - "Make it shorter and punchier"
    - "Use more casual tone"
    - "Emphasize experience and reliability"
    - "Add more details about certifications"
    
    This endpoint helps vendors refine the AI output iteratively.
    """
    try:
        if request.item_type != "service":
            raise HTTPException(
                status_code=400,
                detail="Use this endpoint for services only"
            )
        
        result = regenerate_with_feedback(
            request.original_data,
            request.feedback,
            item_type="service"
        )
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return {
            "success": True,
            "data": result,
            "feedback_applied": request.feedback,
            "message": "Service description regenerated with feedback"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error regenerating description: {str(e)}"
        )


@app.post("/regenerate-product-description")
async def regenerate_product_with_feedback(request: RegenerationRequest):
    """
    Regenerate a product description based on vendor feedback.
    
    Feedback examples:
    - "Make it more persuasive"
    - "Focus more on benefits than features"
    - "Add urgency (limited stock, sale, etc.)"
    - "Make it sound more premium"
    """
    try:
        if request.item_type != "product":
            raise HTTPException(
                status_code=400,
                detail="Use this endpoint for products only"
            )
        
        result = regenerate_with_feedback(
            request.original_data,
            request.feedback,
            item_type="product"
        )
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return {
            "success": True,
            "data": result,
            "feedback_applied": request.feedback,
            "message": "Product description regenerated with feedback"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error regenerating description: {str(e)}"
        )


# ============================================================================
# ERROR HANDLING
# ============================================================================

from fastapi.responses import JSONResponse

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": str(exc),
            "status_code": 500
        }
    )


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
