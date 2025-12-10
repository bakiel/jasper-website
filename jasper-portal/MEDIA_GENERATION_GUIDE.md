# JASPER Media Generation Guide

**For AI Systems Creating Visual Assets Independently**

**Model**: Nano Banana Pro (`google/gemini-3-pro-image-preview`) via OpenRouter
**Cost**: $2/M input tokens, $12/M output tokens

---

## Golden Rules of Prompting

Nano Banana Pro is a **Thinking** model. It understands intent, physics, and composition.

### 1. Edit, Don't Re-roll
If an image is 80% correct, ask for specific changes instead of regenerating:
```
"That's great, but change the lighting to sunset and make the text neon blue."
```

### 2. Use Natural Language
Talk to the model like briefing a human artist.

❌ **Bad**: `"Cool car, neon, city, night, 8k"`

✅ **Good**: `"A cinematic wide shot of a futuristic sports car speeding through a rainy Tokyo street at night. The neon signs reflect off the wet pavement and the car's metallic chassis."`

### 3. Be Specific
Define subject, setting, lighting, and mood.

- **Subject**: "A sophisticated elderly woman wearing a vintage Chanel-style suit"
- **Materiality**: "Matte finish," "brushed steel," "soft velvet"

### 4. Provide Context
Give the model the "why" or "for whom":
```
"Create an image of a sandwich for a high-end gourmet cookbook."
```

---

## JASPER Brand Context

**Always include in prompts:**

```
BRAND CONTEXT:
- Company: JASPER Financial Architecture
- Industry: DFI financial modelling for project developers
- Primary colour: Navy (#0F2A3C)
- Accent colour: Emerald (#2C8A5B)
- Style: Professional, clean, sophisticated
- Font (if text needed): Poppins or Montserrat
```

---

## Image Types & Templates

### 1. Blog Hero Images (16:9)

```python
prompt = """Create a sophisticated hero image for a blog article.

ARTICLE TITLE: "{title}"
KEY THEME: {theme}

Create a cinematic, professional image that visually represents this topic.
The image should work well as a header/hero image on a website.
Avoid generic stock photo aesthetics - create something distinctive.
Do NOT include any text in the image.

BRAND: JASPER Financial Architecture
COLOURS: Navy (#0F2A3C), Emerald (#2C8A5B)"""
```

### 2. Social Media Graphics (with text)

```python
prompt = """Create a professional social media graphic for LinkedIn.

TEXT TO DISPLAY: "{headline}"

REQUIREMENTS:
- Bold, legible text rendering
- Navy background (#0F2A3C), Emerald accent (#2C8A5B)
- White text for maximum contrast
- Clean, modern design
- Professional B2B financial services appearance
- Subtle geometric or abstract elements
- Text is the focal point"""
```

### 3. Infographics (9:16 vertical)

```python
prompt = """Create a clean, modern infographic.

TITLE: {title}

DATA POINTS:
{data_json}

DESIGN:
- Style: Modern professional
- Colours: Navy (#0F2A3C), Emerald (#2C8A5B)
- ALL text must be legible
- Clear visual hierarchy
- Include icons/visual elements
- Suitable for business presentations"""
```

### 4. Data Visualisation

```python
prompt = """Generate a clean, modern infographic summarising:

{data_description}

Include charts for {chart_types}.
Use JASPER brand colours: Navy (#0F2A3C), Emerald (#2C8A5B).
Ensure all text is legible and professional."""
```

### 5. Document Thumbnails

```python
prompt = """Create a professional document thumbnail/cover.

DOCUMENT: {document_type}
TITLE: "{title}"

Style: Clean, corporate, suitable for PDF cover
Colours: Navy (#0F2A3C), Emerald (#2C8A5B)
Include subtle geometric patterns
Text must be bold and legible"""
```

---

## Aspect Ratios

| Use Case | Ratio | Dimensions |
|----------|-------|------------|
| Blog hero | 16:9 | 1920x1080 |
| LinkedIn post | 16:9 | 1200x627 |
| Twitter post | 16:9 | 1200x675 |
| Instagram post | 1:1 | 1080x1080 |
| Instagram story | 9:16 | 1080x1920 |
| Infographic | 9:16 | 1080x1920 |
| PDF cover | 3:4 | 612x792 |

---

## Advanced Capabilities

### Text Rendering
Nano Banana Pro has **SOTA text rendering**. Use it for:
- Infographics with multiple text blocks
- Social media graphics with headlines
- Diagrams with labels
- Multi-language text layouts

### Identity Preservation
Supports up to **5 reference images** for consistent character/subject:
```python
reference_images = [base64_image1, base64_image2]
# Model maintains identity across generations
```

### Image Editing
Edit existing images with natural language:
```python
"Remove the tourists from the background"
"Change the lighting to golden hour"
"Add snow to the roof and yard"
```

### Conversational Iteration
Continue refining in multi-turn conversations:
```
Turn 1: "Create a hero image for renewable energy article"
Turn 2: "Make the solar panels more prominent"
Turn 3: "Add a subtle sunrise glow"
```

---

## API Integration

### OpenRouter Endpoint

```python
import httpx

async def generate_image(prompt: str):
    response = await httpx.AsyncClient().post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": "https://jasperfinance.org",
            "X-Title": "JASPER Portal",
            "Content-Type": "application/json"
        },
        json={
            "model": "google/gemini-3-pro-image-preview",
            "messages": [{"role": "user", "content": prompt}],
            "modalities": ["image", "text"],  # REQUIRED for image output
            "temperature": 0.8
        }
    )
    return response.json()
```

### Response Format

```json
{
  "choices": [{
    "message": {
      "images": [
        {"image_url": {"url": "data:image/png;base64,..."}}
      ],
      "content": "Optional text response"
    }
  }]
}
```

---

## DO's and DON'Ts

### DO ✓

- Use full sentences in natural language
- Include JASPER brand colours in every prompt
- Specify aspect ratio explicitly
- Request legible text when text is needed
- Use conversational edits for refinements
- Provide context (for whom, why)

### DON'T ✗

- Use tag soups (`"finance, 8k, professional, clean"`)
- Regenerate from scratch when editing would work
- Forget to include `modalities: ["image", "text"]`
- Use colours outside the brand palette
- Include text without specifying it should be legible
- Skip the brand context

---

## Cost Estimation

| Task | Est. Tokens | Est. Cost |
|------|-------------|-----------|
| Simple image | ~500 | ~$0.006 |
| Complex infographic | ~1500 | ~$0.020 |
| Image edit | ~800 | ~$0.010 |
| Multi-turn session | ~3000 | ~$0.040 |

---

## Model Comparison

| Model | Use Case | Via |
|-------|----------|-----|
| **Nano Banana Pro** | All JASPER image generation | OpenRouter |
| ~~Gemini 2.5 Flash Image~~ | ❌ Deprecated - poor quality | - |
| ~~Higgsfield~~ | ❌ Removed | - |

---

## Integration with JASPER Services

```python
from app.services.ai import ai_service

# Generate blog hero
result = await ai_service.generate_blog_hero(
    article_title="DFI Funding Guide",
    key_theme="project finance"
)

# Generate infographic
result = await ai_service.generate_infographic(
    title="DFI Funding Process",
    data_points=[
        {"step": 1, "label": "Application"},
        {"step": 2, "label": "Due Diligence"},
        {"step": 3, "label": "Approval"}
    ]
)

# Generate social image with text
result = await ai_service.generate_social_image(
    headline="Secure $5M-$500M DFI Funding",
    platform="linkedin"
)

# Edit existing image
result = await ai_service.edit_image(
    image_base64=existing_image,
    edit_instruction="Change the background to sunset colours"
)
```

---

*Last Updated: December 2025*
*Model: google/gemini-3-pro-image-preview (Nano Banana Pro)*
