import openai
import base64
import os
import json
from dotenv import load_dotenv
from datetime import datetime
from typing import List, Optional, Dict, Any

# Load environment variables
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

UPLOAD_DIR = os.path.join("uploads", "images")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ============================================================================
# SERVICE DESCRIPTION GENERATION (FOR VENDORS LISTING SERVICES)
# ============================================================================

def build_service_prompt(data: Dict[str, Any]) -> str:
    """
    Build a sophisticated prompt for service descriptions based on vendor input.
    Incorporates vendor preferences for tone, length, and emphasis.
    """
    
    service_type = data.get("service_type", "Service")
    skills = data.get("skills", [])
    experience_years = data.get("experience_years")
    price_min = data.get("price_min")
    price_max = data.get("price_max")
    pricing_type = data.get("pricing_type", "negotiable")
    service_areas = data.get("service_areas", [])
    city = data.get("city", "")
    availability_hours = data.get("availability_hours", "9 AM - 6 PM")
    certifications = data.get("certifications", [])
    
    # Vendor preferences
    preferences = data.get("vendor_preferences", {})
    length = preferences.get("length", "medium")  # short, medium, detailed
    tone = preferences.get("tone", "professional")  # casual, professional, friendly
    
    # Build context about vendor
    skills_str = ", ".join(skills) if skills else "Professional services"
    certs_str = ", ".join(certifications) if certifications else ""
    areas_str = ", ".join(service_areas) if service_areas else city
    
    length_instruction = {
        "short": "Keep the description under 100 words. Be concise and punchy.",
        "medium": "Keep the description between 100-200 words. Balance detail with readability.",
        "detailed": "Provide a comprehensive description of 200-300 words with thorough details."
    }
    
    tone_instruction = {
        "casual": "Use a friendly, conversational tone. Use 'you' and 'I' pronouns.",
        "professional": "Use a professional, business-focused tone. Emphasize expertise and reliability.",
        "friendly": "Use a warm, approachable tone that builds trust and connection with clients."
    }
    
    # Build the prompt
    prompt = f"""You are an expert service copywriter for vendors in Pakistan. Create a compelling service listing description.

SERVICE DETAILS:
- Service Type: {service_type}
- Skills/Specializations: {skills_str}
- Years of Experience: {experience_years if experience_years else "Not specified"}
- Certifications: {certs_str if certs_str else "None listed"}
- Pricing: {pricing_type.replace('_', ' ')} (PKR {price_min}-{price_max} if applicable)
- Service Areas: {areas_str}
- Availability: {availability_hours}

VENDOR PREFERENCES:
- Description Length: {length}
- Tone: {tone}

INSTRUCTIONS:
{length_instruction.get(length, length_instruction["medium"])}
{tone_instruction.get(tone, tone_instruction["professional"])}

RETURN FORMAT (ONLY JSON, NO OTHER TEXT):
{{
    "title": "Catchy, keyword-rich service title (5-8 words)",
    "description": "Compelling service description",
    "highlights": ["Key benefit or skill", "Another key selling point", "Third unique advantage"],
    "keywords": ["seo", "keyword1", "keyword2", "keyword3"],
    "opening_line": "First sentence that hooks the client"
}}

IMPORTANT:
- The title should be searchable (include "{service_type}" naturally)
- Highlights should be specific benefits, NOT generic praise
- Include location-specific context (mention {city} if relevant)
- Emphasize experience level if years > 5
- Make it persuasive but honest
- For Pakistani market: mention reliability, punctuality, professional service"""
    
    return prompt


def generate_service_description(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a professional service description using OpenAI.
    Designed specifically for service providers (plumbers, electricians, designers, etc.)
    """
    try:
        prompt = build_service_prompt(data)
        
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system", 
                    "content": "You are an expert eCommerce copywriter specializing in service descriptions. Always respond with ONLY valid JSON, no markdown, no explanation."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,  # Slightly creative but focused
        )
        
        ai_output = response.choices[0].message.content
        
        # Clean up the output if it has markdown code blocks
        if "```json" in ai_output:
            ai_output = ai_output.split("```json")[1].split("```")[0].strip()
        elif "```" in ai_output:
            ai_output = ai_output.split("```")[1].split("```")[0].strip()
        
        # Parse JSON response
        try:
            result = json.loads(ai_output)
            result["prompt_used"] = prompt  # Store for reference
            result["generation_method"] = "service_form"
            result["model"] = "gpt-4o-mini"
            return result
        except json.JSONDecodeError:
            return {
                "error": "Invalid JSON response from AI",
                "raw_response": ai_output,
                "prompt_used": prompt
            }
            
    except Exception as e:
        return {
            "error": f"Error generating service description: {repr(e)}",
            "error_type": type(e).__name__
        }


# ============================================================================
# PRODUCT DESCRIPTION GENERATION (FOR ECOMMERCE PRODUCTS)
# ============================================================================

def build_product_prompt(data: Dict[str, Any]) -> str:
    """
    Build a prompt for product descriptions based on vendor input.
    Incorporates vendor preferences for tone, length, and emphasis.
    """
    
    product_name = data.get("product_name", "Product")
    category = data.get("category", "")
    subcategory = data.get("subcategory", "")
    price = data.get("price", 0)
    key_features = data.get("key_features", [])
    
    # Vendor preferences
    preferences = data.get("vendor_preferences", {})
    length = preferences.get("length", "medium")
    tone = preferences.get("tone", "professional")
    
    features_str = "\n".join([f"- {feature}" for feature in key_features]) if key_features else "- High quality\n- Professional grade"
    
    length_instruction = {
        "short": "Keep the description under 80 words. Focus on the main benefit.",
        "medium": "Keep the description between 80-150 words. Balanced and informative.",
        "detailed": "Provide a comprehensive description of 150-250 words with benefits and specifications."
    }
    
    tone_instruction = {
        "casual": "Use a friendly, approachable tone. Make it relatable.",
        "professional": "Use a professional tone. Highlight quality and reliability.",
        "friendly": "Use a warm tone that makes customers feel confident about the purchase."
    }
    
    prompt = f"""You are an expert eCommerce product copywriter. Create a compelling product description.

PRODUCT DETAILS:
- Product Name: {product_name}
- Category: {category}
- Subcategory: {subcategory if subcategory else "General"}
- Price: PKR {price}
- Key Features:
{features_str}

VENDOR PREFERENCES:
- Description Length: {length}
- Tone: {tone}

INSTRUCTIONS:
{length_instruction.get(length, length_instruction["medium"])}
{tone_instruction.get(tone, tone_instruction["professional"])}

RETURN FORMAT (ONLY JSON, NO OTHER TEXT):
{{
    "title": "Short, compelling product name (3-7 words)",
    "description": "Engaging product description that highlights benefits",
    "features": ["Feature or benefit 1", "Feature or benefit 2", "Feature or benefit 3"],
    "keywords": ["seo", "keyword1", "keyword2", "keyword3"],
    "value_proposition": "One sentence that answers 'Why should I buy this?'"
}}

IMPORTANT:
- Title should be SEO-friendly and searchable
- Description should focus on BENEFITS not just features
- Features should answer customer questions
- Keywords should be searchable terms for this product
- Include price comparison sentiment if appropriate
- Make it persuasive and conversion-focused"""
    
    return prompt


def generate_product_description(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a professional product description using OpenAI.
    Designed specifically for eCommerce products.
    """
    try:
        prompt = build_product_prompt(data)
        
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert eCommerce copywriter. Always respond with ONLY valid JSON, no markdown, no explanation."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
        )
        
        ai_output = response.choices[0].message.content
        
        # Clean up markdown if present
        if "```json" in ai_output:
            ai_output = ai_output.split("```json")[1].split("```")[0].strip()
        elif "```" in ai_output:
            ai_output = ai_output.split("```")[1].split("```")[0].strip()
        
        try:
            result = json.loads(ai_output)
            result["prompt_used"] = prompt
            result["generation_method"] = "product_form"
            result["model"] = "gpt-4o-mini"
            return result
        except json.JSONDecodeError:
            return {
                "error": "Invalid JSON response from AI",
                "raw_response": ai_output,
                "prompt_used": prompt
            }
            
    except Exception as e:
        return {
            "error": f"Error generating product description: {repr(e)}",
            "error_type": type(e).__name__
        }


# ============================================================================
# IMAGE-BASED GENERATION (WORKS FOR BOTH PRODUCTS AND SERVICES)
# ============================================================================

def generate_description_from_image(file, item_type: str = "product") -> Dict[str, Any]:
    """
    Generate a description by analyzing an uploaded image.
    Works for both products and services based on item_type parameter.
    """
    try:
        print(f"Received file: {file.filename}")
        image_bytes = file.file.read()
        
        # Save the image with a timestamped filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_ext = file.filename.split(".")[-1].lower()
        saved_filename = f"{item_type}_{timestamp}.{file_ext}"
        saved_path = os.path.join(UPLOAD_DIR, saved_filename)
        
        with open(saved_path, "wb") as f:
            f.write(image_bytes)
        
        print(f"Image saved at: {saved_path}")
        
        # Encode image as Base64
        mime_type = f"image/{'jpeg' if file_ext in ['jpg', 'jpeg'] else 'png'}"
        image_base64 = base64.b64encode(image_bytes).decode("utf-8")
        
        # Choose system prompt based on item type
        if item_type == "service":
            system_prompt = """Analyze this image of a service provider's work or professional context.
            Return JSON with service description structure:
            {
                "title": "Service title based on what's shown",
                "description": "Description of the service quality shown",
                "highlights": ["What stands out", "Professional aspect", "Quality indicator"],
                "keywords": ["relevant", "searchable", "terms"]
            }"""
        else:  # product
            system_prompt = """Analyze this product image and create a compelling eCommerce description.
            Return JSON with product description structure:
            {
                "title": "Product name",
                "description": "What it is and why it's great",
                "features": ["Visual feature 1", "Quality aspect", "Use case"],
                "keywords": ["searchable", "terms"]
            }"""
        
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{image_base64}"}}
                    ]
                }
            ],
        )
        
        ai_output = response.choices[0].message.content
        
        # Clean up markdown
        if "```json" in ai_output:
            ai_output = ai_output.split("```json")[1].split("```")[0].strip()
        elif "```" in ai_output:
            ai_output = ai_output.split("```")[1].split("```")[0].strip()
        
        try:
            ai_data = json.loads(ai_output)
        except json.JSONDecodeError:
            ai_data = {"raw_text": ai_output}
        
        print("AI response successfully received.")
        
        return {
            "image_filename": saved_filename,
            "image_path": saved_path,
            "ai_description": ai_data,
            "generation_method": f"image_upload_{item_type}",
            "model": "gpt-4o-mini"
        }
        
    except Exception as e:
        print("Error:", repr(e))
        return {"error": f"Error generating description from image: {repr(e)}"}


# ============================================================================
# REGENERATION WITH FEEDBACK (FOR VENDOR PREFERENCE LEARNING)
# ============================================================================

def regenerate_with_feedback(
    original_data: Dict[str, Any],
    feedback: str,
    item_type: str = "service"
) -> Dict[str, Any]:
    """
    Regenerate description based on vendor feedback.
    Used to refine AI output based on vendor preferences.
    
    Feedback examples:
    - "Make it shorter"
    - "More casual tone"
    - "Emphasize reliability"
    - "Add pricing information"
    """
    try:
        # Build base prompt
        if item_type == "service":
            prompt = build_service_prompt(original_data)
        else:
            prompt = build_product_prompt(original_data)
        
        # Add feedback instruction
        feedback_prompt = f"""Previous feedback from vendor: {feedback}

Please regenerate the description taking this feedback into account while maintaining all other details."""
        
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert copywriter. Always respond with ONLY valid JSON."
                },
                {"role": "user", "content": prompt},
                {"role": "user", "content": feedback_prompt}
            ],
            temperature=0.7,
        )
        
        ai_output = response.choices[0].message.content
        
        # Clean markdown
        if "```json" in ai_output:
            ai_output = ai_output.split("```json")[1].split("```")[0].strip()
        elif "```" in ai_output:
            ai_output = ai_output.split("```")[1].split("```")[0].strip()
        
        try:
            result = json.loads(ai_output)
            result["regenerated_from_feedback"] = feedback
            return result
        except json.JSONDecodeError:
            return {
                "error": "Invalid JSON response",
                "raw_response": ai_output
            }
            
    except Exception as e:
        return {"error": f"Error during regeneration: {repr(e)}"}
